"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Cpu, Gauge, HardDrive, MemoryStick, Network } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { NodeSidebar } from "./components/node/node-sidebar";
import { CPUModuleView, cpuPackageIDsFromRegistration } from "./modules/cpu/module";
import { GPUModuleView, gpuIndexesFromRegistration } from "./modules/gpu/module";
import { MemoryModuleView } from "./modules/memory/module";
import { NetworkModuleView } from "./modules/network/module";
import { ProcessModuleView } from "./modules/process/module";
import { StorageModuleView } from "./modules/storage/module";
import { postProtoCommand } from "./state/commands";
import { useTelemetryWS } from "./state/ws-client";
import type { TabKey } from "./types";

export function DashboardShell() {
  const { wsConnected, nodes, history } = useTelemetryWS();

  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("memory");

  const [cmdPending, setCmdPending] = useState(false);
  const [cmdMsg, setCmdMsg] = useState("");

  useEffect(() => {
    if (nodes.length === 0) {
      if (selectedNodeId) setSelectedNodeId("");
      return;
    }
    if (!selectedNodeId || !nodes.some((n) => n.nodeId === selectedNodeId)) {
      setSelectedNodeId(nodes[0].nodeId);
    }
  }, [nodes, selectedNodeId]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.nodeId === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
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
    values.push("memory", "storage", "network", "process");
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

  const sendCommand = async (commandType: string, payload: Record<string, unknown>) => {
    if (!selectedNodeId) return;
    setCmdPending(true);
    setCmdMsg("");
    try {
      const result = await postProtoCommand(selectedNodeId, commandType, payload);
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
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <NodeSidebar
        wsConnected={wsConnected}
        nodes={nodes}
        selectedNodeId={selectedNodeId}
        onSelectNode={setSelectedNodeId}
      />

      <main className="flex-1 p-3">
        {!selectedNode ? (
          <div className="border border-dashed border-slate-300 bg-white p-6 text-slate-500">
            Select a node from the left panel.
          </div>
        ) : (
          <div className="space-y-3">
            <Tabs value={activeTab} onValueChange={onChangeTopTab}>
              <TabsList className="flex w-full flex-wrap gap-1 bg-white p-1">
                {cpuPackageIds.map((pkg) => (
                  <TabsTrigger key={`top-cpu-${pkg}`} value={`cpu:${pkg}`} className="text-xs">
                    <Cpu className="h-4 w-4" /> CPU {pkg}
                  </TabsTrigger>
                ))}
                {gpuIndexes.map((idx) => (
                  <TabsTrigger key={`top-gpu-${idx}`} value={`gpu:${idx}`} className="text-xs">
                    <Gauge className="h-4 w-4" /> GPU {idx}
                  </TabsTrigger>
                ))}
                <TabsTrigger value="memory" className="text-xs">
                  <MemoryStick className="h-4 w-4" /> Memory
                </TabsTrigger>
                <TabsTrigger value="storage" className="text-xs">
                  <HardDrive className="h-4 w-4" /> Storage
                </TabsTrigger>
                <TabsTrigger value="network" className="text-xs">
                  <Network className="h-4 w-4" /> Network
                </TabsTrigger>
                <TabsTrigger value="process" className="text-xs">
                  <Activity className="h-4 w-4" /> Process
                </TabsTrigger>
              </TabsList>

              {cpuPackageIds.map((pkg) => (
                <TabsContent key={`cpu-content-${pkg}`} value={`cpu:${pkg}`} className="mt-3 space-y-3">
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
                <TabsContent key={`gpu-content-${idx}`} value={`gpu:${idx}`} className="mt-3 space-y-3">
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

              <TabsContent value="memory" className="mt-3 space-y-3">
                <MemoryModuleView
                  registration={registration}
                  latestRaw={latestRaw}
                  historyByCategory={historyByCategory}
                />
              </TabsContent>

              <TabsContent value="storage" className="mt-3 space-y-3">
                <StorageModuleView
                  latestRaw={latestRaw}
                  registration={registration}
                  historyByCategory={historyByCategory}
                />
              </TabsContent>

              <TabsContent value="network" className="mt-3 space-y-3">
                <NetworkModuleView latestRaw={latestRaw} historyByCategory={historyByCategory} />
              </TabsContent>

              <TabsContent value="process" className="mt-3 space-y-3">
                <ProcessModuleView
                  latestRaw={latestRaw}
                  historyByCategory={historyByCategory}
                  cmdPending={cmdPending}
                  sendCommand={sendCommand}
                  cmdMsg={cmdMsg}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
}
