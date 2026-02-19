"use client";

import { useMemo } from "react";

import { MetricChart } from "../../components/charts/metric-chart";
import type { ChartLineDef, NodeRuntime } from "../../types";
import { deltaRate } from "../../utils/rates";
import { nsToTimeLabel } from "../../utils/time";
import { formatNumber } from "../../utils/units";
import type { HistoryMap } from "../../state/metric-history";
import { cpuPackageIDsFromRegistration } from "../cpu/module";
import { gpuIndexesFromRegistration } from "../gpu/module";
import { linePalette, numField, sampledAtNs, strField } from "../shared/data";

type PowerModuleViewProps = {
  nodes: NodeRuntime[];
  history: HistoryMap;
};

type ChartBuildResult = {
  data: Array<Record<string, number | string>>;
  lines: ChartLineDef[];
  maxY: number;
};

function colorForIndex(index: number): string {
  if (index < linePalette.length) return linePalette[index];
  const hue = (index * 47) % 360;
  return `hsl(${hue} 70% 42%)`;
}

function toRows(rowsByTs: Map<string, Record<string, number | string>>): Array<Record<string, number | string>> {
  return Array.from(rowsByTs.values()).sort((a, b) => {
    const ta = BigInt(String(a.tsNs ?? "0"));
    const tb = BigInt(String(b.tsNs ?? "0"));
    return ta === tb ? 0 : ta < tb ? -1 : 1;
  });
}

function ensureRow(rowsByTs: Map<string, Record<string, number | string>>, atNs: bigint): Record<string, number | string> {
  const key = atNs.toString();
  const found = rowsByTs.get(key);
  if (found) return found;
  const row: Record<string, number | string> = {
    tsNs: key,
    time: nsToTimeLabel(atNs),
  };
  rowsByTs.set(key, row);
  return row;
}

function ensureLine(lines: ChartLineDef[], key: string, label: string): void {
  if (lines.some((line) => line.key === key)) return;
  lines.push({
    key,
    label,
    color: colorForIndex(lines.length),
  });
}

function cpuLineKey(nodeID: string, packageID: number): string {
  return `cpu_${nodeID}_${packageID}`.replace(/[^a-zA-Z0-9_]/g, "_");
}

function gpuLineKey(nodeID: string, gpuIndex: number): string {
  return `gpu_${nodeID}_${gpuIndex}`.replace(/[^a-zA-Z0-9_]/g, "_");
}

function nodeDeviceName(node: NodeRuntime): string {
  const basic = (node.registration?.basic ?? null) as Record<string, any> | null;
  return strField(basic, "hostname") || node.nodeId;
}

function buildCPUFrequencySeries(nodes: NodeRuntime[], history: HistoryMap): ChartBuildResult {
  const rowsByTs = new Map<string, Record<string, number | string>>();
  const lines: ChartLineDef[] = [];
  let maxY = 1;

  for (const node of nodes) {
    const labelPrefix = nodeDeviceName(node);
    const packageIDs = cpuPackageIDsFromRegistration((node.registration ?? null) as Record<string, any> | null);
    for (const packageID of packageIDs) {
      ensureLine(lines, cpuLineKey(node.nodeId, packageID), `${labelPrefix} CPU ${packageID}`);
    }

    const samples = history[node.nodeId]?.cpu_medium ?? [];
    for (const item of samples) {
      const payload = item.sample.cpuMediumMetrics ?? item.sample.cpu_medium_metrics ?? {};
      const cores = (payload.cores ?? []) as Array<Record<string, any>>;
      const accum = new Map<number, { sumKHz: number; count: number }>();
      for (const core of cores) {
        const packageID = numField(core, "packageId", "package_id");
        if (packageID < 0) continue;
        const curKHz = numField(core, "scalingCurKhz", "scaling_cur_khz");
        const state = accum.get(packageID) ?? { sumKHz: 0, count: 0 };
        state.sumKHz += curKHz;
        state.count += 1;
        accum.set(packageID, state);
      }
      for (const [packageID, state] of accum.entries()) {
        if (state.count <= 0) continue;
        const key = cpuLineKey(node.nodeId, packageID);
        const label = `${labelPrefix} CPU ${packageID}`;
        ensureLine(lines, key, label);
        const avgMHz = state.sumKHz / state.count / 1000;
        const row = ensureRow(rowsByTs, item.atNs);
        row[key] = avgMHz;
        if (avgMHz > maxY) maxY = avgMHz;
      }
    }
  }

  return { data: toRows(rowsByTs), lines, maxY };
}

function buildGPUFrequencySeries(nodes: NodeRuntime[], history: HistoryMap): ChartBuildResult {
  const rowsByTs = new Map<string, Record<string, number | string>>();
  const lines: ChartLineDef[] = [];
  let maxY = 1;

  for (const node of nodes) {
    const labelPrefix = nodeDeviceName(node);
    const gpuIndexes = gpuIndexesFromRegistration((node.registration ?? null) as Record<string, any> | null);
    for (const gpuIndex of gpuIndexes) {
      ensureLine(lines, gpuLineKey(node.nodeId, gpuIndex), `${labelPrefix} GPU ${gpuIndex}`);
    }

    const samples = history[node.nodeId]?.gpu_fast ?? [];
    for (const item of samples) {
      const payload = item.sample.gpuFastMetrics ?? item.sample.gpu_fast_metrics ?? {};
      const devices = (payload.devices ?? []) as Array<Record<string, any>>;
      for (const dev of devices) {
        const gpuIndex = numField(dev, "index");
        if (gpuIndex < 0) continue;
        const key = gpuLineKey(node.nodeId, gpuIndex);
        const label = `${labelPrefix} GPU ${gpuIndex}`;
        ensureLine(lines, key, label);
        const freqMHz = numField(dev, "graphicsClockMhz", "graphics_clock_mhz");
        const row = ensureRow(rowsByTs, item.atNs);
        row[key] = freqMHz;
        if (freqMHz > maxY) maxY = freqMHz;
      }
    }
  }

  return { data: toRows(rowsByTs), lines, maxY };
}

function buildCPUPowerSeries(nodes: NodeRuntime[], history: HistoryMap): ChartBuildResult {
  const rowsByTs = new Map<string, Record<string, number | string>>();
  const lines: ChartLineDef[] = [];
  let maxY = 1;

  for (const node of nodes) {
    const labelPrefix = nodeDeviceName(node);
    const packageIDs = cpuPackageIDsFromRegistration((node.registration ?? null) as Record<string, any> | null);
    for (const packageID of packageIDs) {
      ensureLine(lines, cpuLineKey(node.nodeId, packageID), `${labelPrefix} CPU ${packageID}`);
    }

    const samples = history[node.nodeId]?.cpu_ultra_fast ?? [];
    const prevByPackage = new Map<number, { energyMicroJ: number; tsNs: bigint }>();
    for (const item of samples) {
      const payload = item.sample.cpuUltraMetrics ?? item.sample.cpu_ultra_metrics ?? {};
      const rapl = (payload.rapl ?? []) as Array<Record<string, any>>;
      for (const r of rapl) {
        const packageID = numField(r, "packageId", "package_id");
        if (packageID < 0) continue;
        const key = cpuLineKey(node.nodeId, packageID);
        const label = `${labelPrefix} CPU ${packageID}`;
        ensureLine(lines, key, label);

        const tsNs = sampledAtNs(r, item.atNs);
        const energyMicroJ = numField(r, "energyMicroJ", "energy_micro_j");
        const prev = prevByPackage.get(packageID);
        if (prev) {
          const microW = deltaRate(energyMicroJ, prev.energyMicroJ, tsNs, prev.tsNs);
          if (microW !== null) {
            const powerW = microW / 1_000_000;
            const row = ensureRow(rowsByTs, tsNs);
            row[key] = powerW;
            if (powerW > maxY) maxY = powerW;
          }
        }
        prevByPackage.set(packageID, { energyMicroJ, tsNs });
      }
    }
  }

  return { data: toRows(rowsByTs), lines, maxY };
}

function buildGPUPowerSeries(nodes: NodeRuntime[], history: HistoryMap): ChartBuildResult {
  const rowsByTs = new Map<string, Record<string, number | string>>();
  const lines: ChartLineDef[] = [];
  let maxY = 1;

  for (const node of nodes) {
    const labelPrefix = nodeDeviceName(node);
    const gpuIndexes = gpuIndexesFromRegistration((node.registration ?? null) as Record<string, any> | null);
    for (const gpuIndex of gpuIndexes) {
      ensureLine(lines, gpuLineKey(node.nodeId, gpuIndex), `${labelPrefix} GPU ${gpuIndex}`);
    }

    const samples = history[node.nodeId]?.gpu_fast ?? [];
    for (const item of samples) {
      const payload = item.sample.gpuFastMetrics ?? item.sample.gpu_fast_metrics ?? {};
      const devices = (payload.devices ?? []) as Array<Record<string, any>>;
      for (const dev of devices) {
        const gpuIndex = numField(dev, "index");
        if (gpuIndex < 0) continue;
        const key = gpuLineKey(node.nodeId, gpuIndex);
        const label = `${labelPrefix} GPU ${gpuIndex}`;
        ensureLine(lines, key, label);
        const powerW = numField(dev, "powerUsageMilliwatt", "power_usage_milliwatt") / 1000;
        const row = ensureRow(rowsByTs, item.atNs);
        row[key] = powerW;
        if (powerW > maxY) maxY = powerW;
      }
    }
  }

  return { data: toRows(rowsByTs), lines, maxY };
}

function compareNodes(a: NodeRuntime, b: NodeRuntime): number {
  const an = nodeDeviceName(a);
  const bn = nodeDeviceName(b);
  if (an !== bn) return an.localeCompare(bn);
  return a.nodeId.localeCompare(b.nodeId);
}

function latestTotalOfAllLines(series: ChartBuildResult): number | null {
  if (series.lines.length === 0 || series.data.length === 0) return null;
  let sum = 0;
  let found = 0;

  for (const line of series.lines) {
    for (let i = series.data.length - 1; i >= 0; i -= 1) {
      const raw = series.data[i]?.[line.key];
      const value = typeof raw === "number" ? raw : Number(raw);
      if (!Number.isFinite(value)) continue;
      sum += value;
      found += 1;
      break;
    }
  }

  return found > 0 ? sum : null;
}

function firstLineKeyWithValue(series: ChartBuildResult): string | null {
  for (const line of series.lines) {
    for (let i = series.data.length - 1; i >= 0; i -= 1) {
      const raw = series.data[i]?.[line.key];
      const value = typeof raw === "number" ? raw : Number(raw);
      if (Number.isFinite(value)) return line.key;
    }
  }
  return null;
}

export function PowerModuleView({ nodes, history }: PowerModuleViewProps) {
  const sortedNodes = useMemo(() => nodes.slice().sort(compareNodes), [nodes]);

  const cpuFrequency = useMemo(() => buildCPUFrequencySeries(sortedNodes, history), [sortedNodes, history]);
  const gpuFrequency = useMemo(() => buildGPUFrequencySeries(sortedNodes, history), [sortedNodes, history]);
  const cpuPower = useMemo(() => buildCPUPowerSeries(sortedNodes, history), [sortedNodes, history]);
  const gpuPower = useMemo(() => buildGPUPowerSeries(sortedNodes, history), [sortedNodes, history]);
  const cpuPowerTotal = useMemo(() => latestTotalOfAllLines(cpuPower), [cpuPower]);
  const gpuPowerTotal = useMemo(() => latestTotalOfAllLines(gpuPower), [gpuPower]);
  const cpuPowerStatusKey = useMemo(() => firstLineKeyWithValue(cpuPower), [cpuPower]);
  const gpuPowerStatusKey = useMemo(() => firstLineKeyWithValue(gpuPower), [gpuPower]);

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <MetricChart
        chartId="power-overview-cpu-frequency"
        title="CPU Frequency"
        yLabel="MHz"
        data={cpuFrequency.data}
        lines={cpuFrequency.lines}
        yDomain={[0, Math.max(cpuFrequency.maxY, 1)]}
        connectNulls
      />
      <MetricChart
        chartId="power-overview-gpu-frequency"
        title="GPU Frequency"
        yLabel="MHz"
        data={gpuFrequency.data}
        lines={gpuFrequency.lines}
        yDomain={[0, Math.max(gpuFrequency.maxY, 1)]}
        connectNulls
      />
      <MetricChart
        chartId="power-overview-cpu-power"
        title="CPU Power"
        yLabel="W"
        data={cpuPower.data}
        lines={cpuPower.lines}
        yDomain={[0, Math.max(cpuPower.maxY, 1)]}
        showCurrentStatus
        currentValueFormatter={(_value, line) => {
          if (line.key !== cpuPowerStatusKey || cpuPowerTotal === null) return null;
          return `${formatNumber(cpuPowerTotal, 3)} W`;
        }}
        connectNulls
      />
      <MetricChart
        chartId="power-overview-gpu-power"
        title="GPU Power"
        yLabel="W"
        data={gpuPower.data}
        lines={gpuPower.lines}
        yDomain={[0, Math.max(gpuPower.maxY, 1)]}
        showCurrentStatus
        currentValueFormatter={(_value, line) => {
          if (line.key !== gpuPowerStatusKey || gpuPowerTotal === null) return null;
          return `${formatNumber(gpuPowerTotal, 3)} W`;
        }}
        connectNulls
      />
    </div>
  );
}
