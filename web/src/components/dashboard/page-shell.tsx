"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Cpu, Gauge, HardDrive, MemoryStick, Network } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { NodeSidebar } from "./components/node/node-sidebar";
import { CPUModuleView, cpuPackageIDsFromRegistration } from "./modules/cpu/module";
import { GPUModuleView, gpuIndexesFromRegistration } from "./modules/gpu/module";
import { InfiniBandModuleView } from "./modules/infiniband/module";
import { MemoryModuleView } from "./modules/memory/module";
import { NetworkModuleView } from "./modules/network/module";
import { PowerModuleView } from "./modules/power/module";
import { ProcessModuleView } from "./modules/process/module";
import { SettingsModuleView } from "./modules/settings/module";
import { StorageModuleView } from "./modules/storage/module";
import { useTelemetryWS } from "./state/ws-client";
import type { TabKey } from "./types";

const powerViewID = "__power__";
const settingsViewID = "__settings__";

export function DashboardShell() {
  const {
    wsConnected,
    nodes,
    history,
    historyLimits,
    minSampleIntervalMs,
    processMinSampleIntervalMs,
    setHistoryLimits,
    setMinSampleIntervalMs,
    setProcessMinSampleIntervalMs,
    sendCommand: sendCommandWS,
  } = useTelemetryWS();

  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("memory");

  const [cmdPending, setCmdPending] = useState(false);
  const [cmdMsg, setCmdMsg] = useState("");

  useEffect(() => {
    if (nodes.length === 0) {
      if (selectedNodeId && selectedNodeId !== settingsViewID && selectedNodeId !== powerViewID) {
        setSelectedNodeId("");
      }
      return;
    }
    if (selectedNodeId === settingsViewID || selectedNodeId === powerViewID) return;
    if (!selectedNodeId || !nodes.some((n) => n.nodeId === selectedNodeId)) {
      setSelectedNodeId(nodes[0].nodeId);
    }
  }, [nodes, selectedNodeId]);

  const powerSelected = selectedNodeId === powerViewID;
  const settingsSelected = selectedNodeId === settingsViewID;
  const selectedNode = useMemo(
    () => (settingsSelected || powerSelected ? null : nodes.find((n) => n.nodeId === selectedNodeId) ?? null),
    [nodes, selectedNodeId, settingsSelected, powerSelected],
  );

  const registration = (selectedNode?.registration ?? null) as Record<string, any> | null;
  const latestRaw = selectedNode?.latestRaw ?? {};
  const historyByCategory = history[selectedNodeId] ?? {};

  const cpuPackageIds = useMemo(() => cpuPackageIDsFromRegistration(registration), [registration]);
  const gpuIndexes = useMemo(() => gpuIndexesFromRegistration(registration), [registration]);

  const topTabValues = useMemo(() => {
    const values: string[] = [];
    for (const pkg of cpuPackageIds) values.push(`cpu:${pkg}`);
    for (const idx of gpuIndexes) values.push(`gpu:${idx}`);
    values.push("memory", "storage", "network", "infiniband", "process");
    return values;
  }, [cpuPackageIds, gpuIndexes]);

  useEffect(() => {
    if (topTabValues.length === 0) {
      if (activeTab !== "") setActiveTab("");
      return;
    }
    if (!topTabValues.includes(activeTab)) {
      setActiveTab(topTabValues[0]);
    }
  }, [topTabValues, activeTab]);

  const onChangeTopTab = (value: string) => {
    setActiveTab(value);
  };

  const topTabTriggerClass =
    "h-8 shrink-0 rounded-md px-2 text-[11px] after:hidden data-[state=active]:border data-[state=active]:border-[var(--telemetry-border-strong)] data-[state=active]:bg-[var(--telemetry-accent-soft)]";

  const sendCommand = async (commandType: string, payload: Record<string, unknown>) => {
    if (!selectedNodeId) return;
    setCmdPending(true);
    setCmdMsg("");
    try {
      const result = await sendCommandWS(selectedNodeId, commandType, payload);
      if (!result.ok) {
        setCmdMsg(result.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "request failed";
      setCmdMsg(`${commandType}: ${message}`);
    } finally {
      setCmdPending(false);
    }
  };

  return (
    <div className="telemetry-page">
      <div className="mx-auto flex w-full max-w-[2000px] flex-col gap-3 p-3 lg:h-screen lg:flex-row lg:overflow-hidden">
        <NodeSidebar
          wsConnected={wsConnected}
          nodes={nodes}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
          powerSelected={powerSelected}
          onSelectPower={() => setSelectedNodeId(powerViewID)}
          settingsSelected={settingsSelected}
          onSelectSettings={() => setSelectedNodeId(settingsViewID)}
        />

        <main
          className={
            powerSelected
              ? "min-w-0 flex-1 lg:min-h-0 lg:overflow-hidden"
              : "min-w-0 flex-1 space-y-3 lg:min-h-0 lg:overflow-auto"
          }
        >
          {powerSelected ? (
            <div className="lg:h-full lg:min-h-0">
              <PowerModuleView nodes={nodes} history={history} sendCommand={sendCommandWS} />
            </div>
          ) : settingsSelected ? (
            <SettingsModuleView
              historyLimits={historyLimits}
              minSampleIntervalMs={minSampleIntervalMs}
              processMinSampleIntervalMs={processMinSampleIntervalMs}
              onSaveHistoryLimits={setHistoryLimits}
              onSaveMinSampleIntervalMs={setMinSampleIntervalMs}
              onSaveProcessMinSampleIntervalMs={setProcessMinSampleIntervalMs}
            />
          ) : !selectedNode ? (
            <div className="telemetry-empty p-6 text-sm">Select a node from the panel.</div>
          ) : (
            <Tabs value={activeTab} onValueChange={onChangeTopTab} className="space-y-3">
                <div className="sticky top-0 z-30">
                  <div className="telemetry-toolbar p-1">
                    <div className="overflow-x-auto overflow-y-hidden">
                      <TabsList variant="line" className="w-max min-w-full gap-1 bg-transparent p-0">
                        {cpuPackageIds.map((pkg) => (
                          <TabsTrigger
                            key={`top-cpu-${pkg}`}
                            value={`cpu:${pkg}`}
                            className={topTabTriggerClass}
                          >
                            <Cpu className="h-4 w-4" /> CPU {pkg}
                          </TabsTrigger>
                        ))}
                        {gpuIndexes.map((idx) => (
                          <TabsTrigger
                            key={`top-gpu-${idx}`}
                            value={`gpu:${idx}`}
                            className={topTabTriggerClass}
                          >
                            <Gauge className="h-4 w-4" /> GPU {idx}
                          </TabsTrigger>
                        ))}
                        <TabsTrigger
                          value="memory"
                          className={topTabTriggerClass}
                        >
                          <MemoryStick className="h-4 w-4" /> Memory
                        </TabsTrigger>
                        <TabsTrigger
                          value="storage"
                          className={topTabTriggerClass}
                        >
                          <HardDrive className="h-4 w-4" /> Storage
                        </TabsTrigger>
                        <TabsTrigger
                          value="network"
                          className={topTabTriggerClass}
                        >
                          <Network className="h-4 w-4" /> Network
                        </TabsTrigger>
                        <TabsTrigger
                          value="infiniband"
                          className={topTabTriggerClass}
                        >
                          <Network className="h-4 w-4" /> InfiniBand
                        </TabsTrigger>
                        <TabsTrigger
                          value="process"
                          className={topTabTriggerClass}
                        >
                          <Activity className="h-4 w-4" /> Process
                        </TabsTrigger>
                      </TabsList>
                    </div>
                  </div>
                </div>

                {cpuPackageIds.map((pkg) => (
                  <TabsContent key={`cpu-content-${pkg}`} value={`cpu:${pkg}`} className="space-y-3">
                    <CPUModuleView
                      nodeId={selectedNode.nodeId}
                      packageId={pkg}
                      registration={registration}
                      latestRaw={latestRaw}
                      historyByCategory={historyByCategory}
                      cmdPending={cmdPending}
                      cmdMsg={cmdMsg}
                      sendCommand={sendCommand}
                    />
                  </TabsContent>
                ))}

                {gpuIndexes.map((idx) => (
                  <TabsContent key={`gpu-content-${idx}`} value={`gpu:${idx}`} className="space-y-3">
                    <GPUModuleView
                      nodeId={selectedNode.nodeId}
                      gpuIndex={idx}
                      registration={registration}
                      latestRaw={latestRaw}
                      historyByCategory={historyByCategory}
                      cmdPending={cmdPending}
                      cmdMsg={cmdMsg}
                      sendCommand={sendCommand}
                    />
                  </TabsContent>
                ))}

                <TabsContent value="memory" className="space-y-3">
                  <MemoryModuleView
                    registration={registration}
                    latestRaw={latestRaw}
                    historyByCategory={historyByCategory}
                  />
                </TabsContent>

                <TabsContent value="storage" className="space-y-3">
                  <StorageModuleView
                    latestRaw={latestRaw}
                    registration={registration}
                    historyByCategory={historyByCategory}
                  />
                </TabsContent>

                <TabsContent value="network" className="space-y-3">
                  <NetworkModuleView latestRaw={latestRaw} historyByCategory={historyByCategory} />
                </TabsContent>

                <TabsContent value="infiniband" className="space-y-3">
                  <InfiniBandModuleView latestRaw={latestRaw} historyByCategory={historyByCategory} />
                </TabsContent>

                <TabsContent value="process" className="space-y-3">
                  <ProcessModuleView
                    latestRaw={latestRaw}
                    cmdPending={cmdPending}
                    sendCommand={sendCommand}
                    cmdMsg={cmdMsg}
                  />
                </TabsContent>
              </Tabs>
          )}
        </main>
      </div>
    </div>
  );
}
