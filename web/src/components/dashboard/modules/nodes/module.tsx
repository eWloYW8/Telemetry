"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import { Server } from "lucide-react";

import type { HistoryMap } from "../../state/metric-history";
import type { NodeRuntime } from "../../types";
import { formatNumber } from "../../utils/units";
import {
  CpuCoreRangeControlItem,
  CpuPowerCapControlItem,
  GpuClockRangeControlItem,
  GpuPowerCapControlItem,
  collectCPUControlDevices,
  collectGPUControlDevices,
  nodeDeviceName,
  type CpuControlDevice,
  type GpuControlDevice,
  type SelectionOption,
} from "../power/module";
import { Section } from "../shared/section";

type NodesModuleViewProps = {
  nodes: NodeRuntime[];
  history: HistoryMap;
  sendCommand: (
    nodeId: string,
    commandType: string,
    payload: Record<string, unknown>,
  ) => Promise<{ ok: boolean; message: string }>;
};

const NOOP = () => {};
const LIVE_COLOR = "var(--telemetry-accent)";

function makeOption(id: string, label: string): SelectionOption {
  return { id, label, scopeKey: id };
}

function compareNodes(a: NodeRuntime, b: NodeRuntime): number {
  const an = nodeDeviceName(a);
  const bn = nodeDeviceName(b);
  if (an !== bn) return an.localeCompare(bn);
  return a.nodeId.localeCompare(b.nodeId);
}

function formatFreqKHz(khz: number): string {
  if (!Number.isFinite(khz) || khz <= 0) return "—";
  const ghz = khz / 1_000_000;
  if (ghz >= 1) return `${formatNumber(ghz, 2)} GHz`;
  return `${formatNumber(khz / 1000, 0)} MHz`;
}

function formatMHz(mhz: number): string {
  if (!Number.isFinite(mhz) || mhz <= 0) return "—";
  return `${formatNumber(mhz, 0)} MHz`;
}

function formatWMilli(mw: number): string {
  if (!Number.isFinite(mw) || mw <= 0) return "—";
  return `${formatNumber(mw / 1000, 1)} W`;
}

function formatWMicro(uw: number): string {
  if (!Number.isFinite(uw) || uw <= 0) return "—";
  return `${formatNumber(uw / 1_000_000, 1)} W`;
}

function nodeTotalPowerW(cpuDevices: CpuControlDevice[], gpuDevices: GpuControlDevice[]): number | null {
  let total = 0;
  let found = false;
  for (const d of cpuDevices) {
    if (d.packagePowerUsageMicroW > 0) {
      total += d.packagePowerUsageMicroW / 1_000_000;
      found = true;
    }
    if (d.hasDramPowerUsage && d.dramPowerUsageMicroW > 0) {
      total += d.dramPowerUsageMicroW / 1_000_000;
      found = true;
    }
  }
  for (const d of gpuDevices) {
    if (d.powerCurrentUsageMilliW > 0) {
      total += d.powerCurrentUsageMilliW / 1000;
      found = true;
    }
  }
  return found ? total : null;
}

function ItemHeader({ title, value }: { title: string; value: ReactNode }) {
  return (
    <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
      <span className="font-medium text-[var(--telemetry-text)]">{title}</span>
      <span className="font-mono text-xs" style={{ color: LIVE_COLOR }}>
        {value}
      </span>
    </div>
  );
}

function NodeCard({
  node,
  cpuDevices,
  gpuDevices,
  sendCommand,
}: {
  node: NodeRuntime;
  cpuDevices: CpuControlDevice[];
  gpuDevices: GpuControlDevice[];
  sendCommand: NodesModuleViewProps["sendCommand"];
}) {
  const hostname = nodeDeviceName(node);
  const basic = (node.registration?.basic ?? null) as Record<string, any> | null;
  const arch = String(basic?.arch ?? "");
  const os = String(basic?.os ?? "");
  const meta = [arch, os].filter(Boolean).join(" · ");

  const hasAnyControl = cpuDevices.length > 0 || gpuDevices.length > 0;

  const totalPowerW = nodeTotalPowerW(cpuDevices, gpuDevices);

  return (
    <Section
      title={
        <span className="flex min-w-0 flex-1 items-baseline gap-3">
          <span className="truncate">{hostname}</span>
          {totalPowerW !== null ? (
            <span
              className="ml-auto shrink-0 font-mono text-sm font-semibold"
              style={{ color: LIVE_COLOR }}
              title="Current total power usage"
            >
              {formatNumber(totalPowerW, 1)} W
            </span>
          ) : null}
        </span>
      }
      description={meta ? `${meta} · ${node.nodeId}` : node.nodeId}
      icon={<Server className="h-4 w-4" />}
      compact
      right={
        <span
          className="inline-flex items-center gap-1.5 text-xs"
          style={{ color: node.connected ? "var(--telemetry-success)" : "var(--telemetry-warning)" }}
        >
          <span
            className="telemetry-status-dot"
            style={{ background: node.connected ? "var(--telemetry-success)" : "var(--telemetry-warning)" }}
            aria-hidden="true"
          />
          {node.connected ? "online" : "stale"}
        </span>
      }
    >
      {!hasAnyControl ? (
        <div className="text-sm text-[var(--telemetry-muted-fg)]">No controllable devices on this node.</div>
      ) : (
        <div className="space-y-3">
          {cpuDevices.length > 0 ? (
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--telemetry-muted-fg)]">CPU</div>
              {cpuDevices.map((device) => (
                <div
                  key={`cpu-block-${device.id}`}
                  className="rounded-md border border-[var(--telemetry-border-subtle)] p-2.5 space-y-2.5"
                >
                  <div className="text-sm font-semibold text-[var(--telemetry-text)]">{device.label}</div>
                  <div>
                    <ItemHeader
                      title="Core Frequency Range"
                      value={formatFreqKHz(device.scalingCurrentKhz)}
                    />
                    <CpuCoreRangeControlItem
                      device={device}
                      sendCommand={sendCommand}
                      option={makeOption(`${device.id}::core`, "Core Frequency Range")}
                      selected={false}
                      forcedRange={null}
                      selectionDisabled={false}
                      onToggleSelection={NOOP}
                      showControls
                      hideSelection
                      hideLabel
                    />
                  </div>
                  <div>
                    <ItemHeader
                      title="Package Power Cap"
                      value={formatWMicro(device.packagePowerUsageMicroW)}
                    />
                    <CpuPowerCapControlItem
                      device={device}
                      domain="package"
                      sendCommand={sendCommand}
                      option={makeOption(`${device.id}::package-cap`, "Package Power Cap")}
                      selected={false}
                      forcedValue={null}
                      selectionDisabled={false}
                      onToggleSelection={NOOP}
                      showControls
                      hideSelection
                      hideLabel
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {gpuDevices.length > 0 ? (
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--telemetry-muted-fg)]">GPU</div>
              {gpuDevices.map((device) => (
                <div
                  key={`gpu-block-${device.id}`}
                  className="rounded-md border border-[var(--telemetry-border-subtle)] p-2.5 space-y-2.5"
                >
                  <div className="text-sm font-semibold text-[var(--telemetry-text)]">{device.label}</div>
                  {device.canTuneSM ? (
                    <div>
                      <ItemHeader
                        title="SM Clock Range"
                        value={formatMHz(device.smCurrentClock)}
                      />
                      <GpuClockRangeControlItem
                        device={device}
                        sendCommand={sendCommand}
                        option={makeOption(`${device.id}::clock`, "SM Clock Range")}
                        selected={false}
                        forcedSmRange={null}
                        forcedMemRange={null}
                        selectionDisabled={false}
                        onToggleSelection={NOOP}
                        showControls
                        hideSelection
                        hideLabel
                        hideMemoryClock
                      />
                    </div>
                  ) : null}
                  <div>
                    <ItemHeader
                      title="Power Cap"
                      value={formatWMilli(device.powerCurrentUsageMilliW)}
                    />
                    <GpuPowerCapControlItem
                      device={device}
                      sendCommand={sendCommand}
                      option={makeOption(`${device.id}::power-cap`, "Power Cap")}
                      selected={false}
                      forcedValue={null}
                      selectionDisabled={false}
                      onToggleSelection={NOOP}
                      showControls
                      hideSelection
                      hideLabel
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </Section>
  );
}

export function NodesModuleView({ nodes, history, sendCommand }: NodesModuleViewProps) {
  const sortedNodes = useMemo(() => nodes.slice().sort(compareNodes), [nodes]);
  const cpuDevices = useMemo(() => collectCPUControlDevices(sortedNodes, history), [sortedNodes, history]);
  const gpuDevices = useMemo(() => collectGPUControlDevices(sortedNodes), [sortedNodes]);

  const cpuByNode = useMemo(() => {
    const m = new Map<string, CpuControlDevice[]>();
    for (const d of cpuDevices) {
      const arr = m.get(d.nodeId) ?? [];
      arr.push(d);
      m.set(d.nodeId, arr);
    }
    return m;
  }, [cpuDevices]);

  const gpuByNode = useMemo(() => {
    const m = new Map<string, GpuControlDevice[]>();
    for (const d of gpuDevices) {
      const arr = m.get(d.nodeId) ?? [];
      arr.push(d);
      m.set(d.nodeId, arr);
    }
    return m;
  }, [gpuDevices]);

  if (sortedNodes.length === 0) {
    return <div className="telemetry-empty p-6 text-sm">Waiting for telemetry stream...</div>;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sortedNodes.map((node) => (
        <NodeCard
          key={node.nodeId}
          node={node}
          cpuDevices={cpuByNode.get(node.nodeId) ?? []}
          gpuDevices={gpuByNode.get(node.nodeId) ?? []}
          sendCommand={sendCommand}
        />
      ))}
    </div>
  );
}
