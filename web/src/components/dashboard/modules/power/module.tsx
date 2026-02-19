"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { MetricChart } from "../../components/charts/metric-chart";
import { RichControlSlider } from "../../components/ui/rich-control-slider";
import type { ChartLineDef, NodeRuntime } from "../../types";
import { deltaRate, maxOr } from "../../utils/rates";
import { nsToTimeLabel } from "../../utils/time";
import { clamp, formatKHz, formatNumber, formatPowerMicroW, formatPowerMilliW } from "../../utils/units";
import type { HistoryMap } from "../../state/metric-history";
import { cpuPackageIDsFromRegistration } from "../cpu/module";
import { gpuIndexesFromRegistration } from "../gpu/module";
import { linePalette, moduleMeta, numField, sampledAtNs, strField } from "../shared/data";
import { useThrottledEmitter } from "../shared/live-control";
import { Section } from "../shared/section";

type PowerModuleViewProps = {
  nodes: NodeRuntime[];
  history: HistoryMap;
  sendCommand: (nodeId: string, commandType: string, payload: Record<string, unknown>) => Promise<{ ok: boolean; message: string }>;
};

type ChartBuildResult = {
  data: Array<Record<string, number | string>>;
  lines: ChartLineDef[];
  maxY: number;
};

type CpuControlDevice = {
  id: string;
  nodeId: string;
  label: string;
  packageId: number;
  scalingMinBound: number;
  scalingMaxBound: number;
  scalingCurrentMin: number;
  scalingCurrentMax: number;
  scalingCurrentKhz: number;
  uncoreMinBound: number;
  uncoreMaxBound: number;
  uncoreCurrentMin: number;
  uncoreCurrentMax: number;
  uncoreCurrentKhz: number;
  canTuneUncore: boolean;
  packagePowerMinMicroW: number;
  packagePowerMaxMicroW: number;
  packagePowerCurrentMicroW: number;
  packagePowerUsageMicroW: number;
  dramPowerMinMicroW: number;
  dramPowerMaxMicroW: number;
  dramPowerCurrentMicroW: number;
  dramPowerUsageMicroW: number;
  hasDramPowerUsage: boolean;
  supportsDramPowerCap: boolean;
};

type GpuControlDevice = {
  id: string;
  nodeId: string;
  label: string;
  gpuIndex: number;
  smMinBound: number;
  smMaxBound: number;
  smCurrentMin: number;
  smCurrentMax: number;
  smCurrentClock: number;
  memMinBound: number;
  memMaxBound: number;
  memCurrentMin: number;
  memCurrentMax: number;
  memCurrentClock: number;
  canTuneSM: boolean;
  canTuneMem: boolean;
  powerMinMilliW: number;
  powerMaxMilliW: number;
  powerCurrentCapMilliW: number;
  powerCurrentUsageMilliW: number;
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

function buildCPUUncoreFrequencySeries(nodes: NodeRuntime[], history: HistoryMap): ChartBuildResult {
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
    for (const item of samples) {
      const payload = item.sample.cpuUltraMetrics ?? item.sample.cpu_ultra_metrics ?? {};
      const uncore = (payload.uncore ?? []) as Array<Record<string, any>>;
      for (const u of uncore) {
        const packageID = numField(u, "packageId", "package_id");
        if (packageID < 0) continue;
        const key = cpuLineKey(node.nodeId, packageID);
        const label = `${labelPrefix} CPU ${packageID}`;
        ensureLine(lines, key, label);
        const curKHz = numField(u, "currentKhz", "current_khz");
        const mhz = curKHz / 1000;
        const tsNs = sampledAtNs(u, item.atNs);
        const row = ensureRow(rowsByTs, tsNs);
        row[key] = mhz;
        if (mhz > maxY) maxY = mhz;
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

function buildCPUDramPowerSeries(nodes: NodeRuntime[], history: HistoryMap): ChartBuildResult {
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
    const prevByPackage = new Map<number, { dramEnergyMicroJ: number; tsNs: bigint }>();
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
        const dramEnergyMicroJ = numField(r, "dramEnergyMicroJ", "dram_energy_micro_j");
        const prev = prevByPackage.get(packageID);
        if (prev) {
          const microW = deltaRate(dramEnergyMicroJ, prev.dramEnergyMicroJ, tsNs, prev.tsNs);
          if (microW !== null) {
            const powerW = microW / 1_000_000;
            const row = ensureRow(rowsByTs, tsNs);
            row[key] = powerW;
            if (powerW > maxY) maxY = powerW;
          }
        }
        prevByPackage.set(packageID, { dramEnergyMicroJ, tsNs });
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

function packageRealtimePowerBreakdownMicroW(
  prevSample: Record<string, any>,
  curSample: Record<string, any>,
  packageId: number,
): { packageMicroW: number; dramMicroW: number; hasDram: boolean } {
  const prevRapl = ((prevSample.cpuUltraMetrics ?? prevSample.cpu_ultra_metrics ?? {}).rapl ?? []) as Array<
    Record<string, any>
  >;
  const curRapl = ((curSample.cpuUltraMetrics ?? curSample.cpu_ultra_metrics ?? {}).rapl ?? []) as Array<Record<string, any>>;

  const prevByPkg = new Map<number, Record<string, any>>();
  for (const p of prevRapl) {
    prevByPkg.set(numField(p, "packageId", "package_id"), p);
  }

  const curPkg = curRapl.find((c) => numField(c, "packageId", "package_id") === packageId);
  const prevPkg = curPkg ? prevByPkg.get(packageId) : null;
  if (!curPkg || !prevPkg) return { packageMicroW: 0, dramMicroW: 0, hasDram: false };

  const curEnergy = numField(curPkg, "energyMicroJ", "energy_micro_j");
  const prevEnergy = numField(prevPkg, "energyMicroJ", "energy_micro_j");
  const curTs = sampledAtNs(curPkg, BigInt(String(curSample.atUnixNano ?? curSample.at_unix_nano ?? 0)));
  const prevTs = sampledAtNs(prevPkg, BigInt(String(prevSample.atUnixNano ?? prevSample.at_unix_nano ?? 0)));
  const packageRate = Math.max(deltaRate(curEnergy, prevEnergy, curTs, prevTs) ?? 0, 0);

  const curDramEnergy = numField(curPkg, "dramEnergyMicroJ", "dram_energy_micro_j");
  const prevDramEnergy = numField(prevPkg, "dramEnergyMicroJ", "dram_energy_micro_j");
  const hasDram = curDramEnergy > 0 || prevDramEnergy > 0;
  const dramRate = hasDram ? Math.max(deltaRate(curDramEnergy, prevDramEnergy, curTs, prevTs) ?? 0, 0) : 0;
  return { packageMicroW: packageRate, dramMicroW: dramRate, hasDram };
}

function latestCpuPowerUsageByPackage(samples: Array<{ atNs: bigint; sample: Record<string, any> }>): Map<number, { packageMicroW: number; dramMicroW: number; hasDram: boolean }> {
  const result = new Map<number, { packageMicroW: number; dramMicroW: number; hasDram: boolean }>();
  if (samples.length < 2) return result;

  for (let i = samples.length - 1; i >= 1; i -= 1) {
    const cur = samples[i];
    const prev = samples[i - 1];
    const curSample = {
      ...cur.sample,
      atUnixNano: cur.atNs.toString(),
    };
    const prevSample = {
      ...prev.sample,
      atUnixNano: prev.atNs.toString(),
    };
    const curRapl = ((cur.sample.cpuUltraMetrics ?? cur.sample.cpu_ultra_metrics ?? {}).rapl ?? []) as Array<Record<string, any>>;

    for (const item of curRapl) {
      const packageId = numField(item, "packageId", "package_id");
      if (packageId < 0 || result.has(packageId)) continue;
      const value = packageRealtimePowerBreakdownMicroW(prevSample, curSample, packageId);
      if (value.packageMicroW > 0 || value.dramMicroW > 0 || value.hasDram) {
        result.set(packageId, value);
      }
    }
  }

  return result;
}

function collectCPUControlDevices(nodes: NodeRuntime[], history: HistoryMap): CpuControlDevice[] {
  const devices: CpuControlDevice[] = [];

  for (const node of nodes) {
    const labelPrefix = nodeDeviceName(node);
    const cpuMeta = moduleMeta((node.registration ?? null) as Record<string, any> | null, "cpu");
    const packageControls =
      ((cpuMeta?.packageControls ?? cpuMeta?.package_controls ?? []) as Array<Record<string, any>>)
        .slice()
        .sort((a, b) => numField(a, "packageId", "package_id") - numField(b, "packageId", "package_id"));

    const packageIDSet = new Set<number>(cpuPackageIDsFromRegistration((node.registration ?? null) as Record<string, any> | null));
    for (const control of packageControls) {
      const pkg = numField(control, "packageId", "package_id");
      if (pkg >= 0) packageIDSet.add(pkg);
    }
    const packageIDs = Array.from(packageIDSet).sort((a, b) => a - b);

    const cpuMediumRaw = node.latestRaw.cpu_medium?.cpuMediumMetrics ?? node.latestRaw.cpu_medium?.cpu_medium_metrics ?? null;
    const cpuUltraRaw =
      node.latestRaw.cpu_ultra_fast?.cpuUltraMetrics ?? node.latestRaw.cpu_ultra_fast?.cpu_ultra_metrics ?? null;
    const cpuUltraHistory = history[node.nodeId]?.cpu_ultra_fast ?? [];
    const powerUsageByPackage = latestCpuPowerUsageByPackage(cpuUltraHistory);

    const cpuCores = (cpuMediumRaw?.cores ?? []) as Array<Record<string, any>>;
    const cpuUncore = (cpuUltraRaw?.uncore ?? []) as Array<Record<string, any>>;
    const cpuPerCore = (cpuUltraRaw?.perCore ?? []) as Array<Record<string, any>>;
    const cpuRapl = (cpuUltraRaw?.rapl ?? []) as Array<Record<string, any>>;

    for (const packageId of packageIDs) {
      const control = packageControls.find((c) => numField(c, "packageId", "package_id") === packageId) ?? null;
      const uncoreMetric = cpuUncore.find((u) => numField(u, "packageId", "package_id") === packageId) ?? null;
      const perCoreMetric = cpuPerCore.find((c) => numField(c, "packageId", "package_id") === packageId) ?? null;
      const raplMetric = cpuRapl.find((r) => numField(r, "packageId", "package_id") === packageId) ?? null;

      const scalingMinBound =
        numField(control, "scalingHwMinKhz", "scaling_hw_min_khz", "scalingMinKhz", "scaling_min_khz") || 800_000;
      const scalingMaxBound =
        numField(control, "scalingHwMaxKhz", "scaling_hw_max_khz", "scalingMaxKhz", "scaling_max_khz") || 5_000_000;

      const scalingCurrentMinRaw =
        numField(perCoreMetric, "scalingMinKhz", "scaling_min_khz") || numField(control, "scalingMinKhz", "scaling_min_khz");
      const scalingCurrentMaxRaw =
        numField(perCoreMetric, "scalingMaxKhz", "scaling_max_khz") || numField(control, "scalingMaxKhz", "scaling_max_khz");

      const scalingCurrentMin = clamp(
        Math.min(scalingCurrentMinRaw || scalingMinBound, scalingCurrentMaxRaw || scalingMaxBound),
        scalingMinBound,
        scalingMaxBound,
      );
      const scalingCurrentMax = clamp(
        Math.max(scalingCurrentMinRaw || scalingMinBound, scalingCurrentMaxRaw || scalingMaxBound),
        scalingMinBound,
        scalingMaxBound,
      );

      const pkgCores = cpuCores.filter((c) => numField(c, "packageId", "package_id") === packageId);
      const scalingCurrentKhz =
        pkgCores.length > 0
          ? pkgCores.reduce((acc, core) => acc + numField(core, "scalingCurKhz", "scaling_cur_khz"), 0) / pkgCores.length
          : 0;

      const uncoreInitialMin = numField(uncoreMetric, "initialMinKhz", "initial_min_khz");
      const uncoreInitialMax = numField(uncoreMetric, "initialMaxKhz", "initial_max_khz");
      const uncoreMinBound = uncoreInitialMin || numField(control, "uncoreMinKhz", "uncore_min_khz");
      const uncoreMaxBound = uncoreInitialMax || numField(control, "uncoreMaxKhz", "uncore_max_khz");
      const canTuneUncore = uncoreMinBound > 0 && uncoreMaxBound > uncoreMinBound;

      const uncoreRuntimeMin = numField(uncoreMetric, "minKhz", "min_khz");
      const uncoreRuntimeMax = numField(uncoreMetric, "maxKhz", "max_khz");
      const uncoreCurrentMin = canTuneUncore
        ? clamp(
            Math.min(uncoreRuntimeMin || uncoreMinBound, uncoreRuntimeMax || uncoreMaxBound),
            uncoreMinBound,
            uncoreMaxBound,
          )
        : 0;
      const uncoreCurrentMax = canTuneUncore
        ? clamp(
            Math.max(uncoreRuntimeMin || uncoreMinBound, uncoreRuntimeMax || uncoreMaxBound),
            uncoreMinBound,
            uncoreMaxBound,
          )
        : 0;
      const uncoreCurrentKhz = numField(uncoreMetric, "currentKhz", "current_khz");

      const packagePowerMinRaw = numField(control, "powerCapMinMicroW", "power_cap_min_micro_w");
      const packagePowerMaxRaw = numField(control, "powerCapMaxMicroW", "power_cap_max_micro_w");
      const packagePowerCurrentRaw =
        numField(raplMetric, "powerCapMicroW", "power_cap_micro_w") || numField(control, "powerCapMicroW", "power_cap_micro_w");
      const packagePowerMaxMicroW =
        packagePowerMaxRaw > 0
          ? packagePowerMaxRaw
          : packagePowerCurrentRaw > 0
            ? packagePowerCurrentRaw
            : 400_000_000;
      const packagePowerMinMicroW =
        packagePowerMinRaw > 0 && packagePowerMinRaw <= packagePowerMaxMicroW
          ? packagePowerMinRaw
          : Math.min(1_000_000, packagePowerMaxMicroW);
      const packagePowerCurrentMicroW = clamp(
        packagePowerCurrentRaw > 0 ? packagePowerCurrentRaw : packagePowerMinMicroW,
        packagePowerMinMicroW,
        packagePowerMaxMicroW,
      );

      const dramPowerMinRaw = numField(control, "dramPowerCapMinMicroW", "dram_power_cap_min_micro_w");
      const dramPowerMaxRaw = numField(control, "dramPowerCapMaxMicroW", "dram_power_cap_max_micro_w");
      const dramPowerCurrentRaw =
        numField(raplMetric, "dramPowerCapMicroW", "dram_power_cap_micro_w") ||
        numField(control, "dramPowerCapMicroW", "dram_power_cap_micro_w");
      const dramPowerMaxMicroW =
        dramPowerMaxRaw > 0
          ? dramPowerMaxRaw
          : dramPowerCurrentRaw > 0
            ? dramPowerCurrentRaw
            : 200_000_000;
      const dramPowerMinMicroW =
        dramPowerMinRaw > 0 && dramPowerMinRaw <= dramPowerMaxMicroW
          ? dramPowerMinRaw
          : Math.min(1_000_000, dramPowerMaxMicroW);
      const dramPowerCurrentMicroW = clamp(
        dramPowerCurrentRaw > 0 ? dramPowerCurrentRaw : dramPowerMinMicroW,
        dramPowerMinMicroW,
        dramPowerMaxMicroW,
      );
      const supportsDramPowerCap = dramPowerMinRaw > 0 || dramPowerMaxRaw > 0 || dramPowerCurrentRaw > 0;
      const powerUsage = powerUsageByPackage.get(packageId);

      devices.push({
        id: `${node.nodeId}::cpu::${packageId}`,
        nodeId: node.nodeId,
        label: `${labelPrefix} CPU ${packageId}`,
        packageId,
        scalingMinBound,
        scalingMaxBound,
        scalingCurrentMin,
        scalingCurrentMax,
        scalingCurrentKhz,
        uncoreMinBound,
        uncoreMaxBound,
        uncoreCurrentMin,
        uncoreCurrentMax,
        uncoreCurrentKhz,
        canTuneUncore,
        packagePowerMinMicroW,
        packagePowerMaxMicroW,
        packagePowerCurrentMicroW,
        packagePowerUsageMicroW: powerUsage?.packageMicroW ?? 0,
        dramPowerMinMicroW,
        dramPowerMaxMicroW,
        dramPowerCurrentMicroW,
        dramPowerUsageMicroW: powerUsage?.dramMicroW ?? 0,
        hasDramPowerUsage: powerUsage?.hasDram ?? false,
        supportsDramPowerCap,
      });
    }
  }

  return devices;
}

function collectGPUControlDevices(nodes: NodeRuntime[]): GpuControlDevice[] {
  const devices: GpuControlDevice[] = [];

  for (const node of nodes) {
    const labelPrefix = nodeDeviceName(node);
    const gpuMeta = moduleMeta((node.registration ?? null) as Record<string, any> | null, "gpu");
    const gpuStatic = ((gpuMeta?.static ?? []) as Array<Record<string, any>>)
      .slice()
      .sort((a, b) => numField(a, "index") - numField(b, "index"));

    const gpuFastRaw = node.latestRaw.gpu_fast?.gpuFastMetrics ?? node.latestRaw.gpu_fast?.gpu_fast_metrics ?? null;
    const gpuFastDevices = ((gpuFastRaw?.devices ?? []) as Array<Record<string, any>>)
      .slice()
      .sort((a, b) => numField(a, "index") - numField(b, "index"));

    const gpuIndexSet = new Set<number>(gpuIndexesFromRegistration((node.registration ?? null) as Record<string, any> | null));
    for (const dev of gpuFastDevices) {
      const idx = numField(dev, "index");
      if (idx >= 0) gpuIndexSet.add(idx);
    }

    const gpuIndexes = Array.from(gpuIndexSet).sort((a, b) => a - b);

    for (const gpuIndex of gpuIndexes) {
      const staticDev = gpuStatic.find((g) => numField(g, "index") === gpuIndex) ?? null;
      const fastDev = gpuFastDevices.find((g) => numField(g, "index") === gpuIndex) ?? null;

      const smMinBound = maxOr(numField(staticDev, "smClockMinMhz", "sm_clock_min_mhz"), 1);
      const smMaxBound = maxOr(numField(staticDev, "smClockMaxMhz", "sm_clock_max_mhz"), smMinBound);
      const memMinBound = maxOr(numField(staticDev, "memClockMinMhz", "mem_clock_min_mhz"), 1);
      const memMaxBound = maxOr(numField(staticDev, "memClockMaxMhz", "mem_clock_max_mhz"), memMinBound);

      const canTuneSM = smMaxBound > smMinBound;
      const canTuneMem = memMaxBound > memMinBound;

      const smCurrentMinRaw = numField(fastDev, "smClockMinMhz", "sm_clock_min_mhz");
      const smCurrentMaxRaw = numField(fastDev, "smClockMaxMhz", "sm_clock_max_mhz");
      const memCurrentMinRaw = numField(fastDev, "memClockMinMhz", "mem_clock_min_mhz");
      const memCurrentMaxRaw = numField(fastDev, "memClockMaxMhz", "mem_clock_max_mhz");

      const smCurrentMin = canTuneSM
        ? clamp(Math.min(smCurrentMinRaw || smMinBound, smCurrentMaxRaw || smMaxBound), smMinBound, smMaxBound)
        : 0;
      const smCurrentMax = canTuneSM
        ? clamp(Math.max(smCurrentMinRaw || smMinBound, smCurrentMaxRaw || smMaxBound), smMinBound, smMaxBound)
        : 0;
      const memCurrentMin = canTuneMem
        ? clamp(Math.min(memCurrentMinRaw || memMinBound, memCurrentMaxRaw || memMaxBound), memMinBound, memMaxBound)
        : 0;
      const memCurrentMax = canTuneMem
        ? clamp(Math.max(memCurrentMinRaw || memMinBound, memCurrentMaxRaw || memMaxBound), memMinBound, memMaxBound)
        : 0;

      const powerMinRaw = numField(staticDev, "powerMinMilliwatt", "power_min_milliwatt");
      const powerMaxRaw = numField(staticDev, "powerMaxMilliwatt", "power_max_milliwatt");
      const powerCurrentCapRaw = numField(fastDev, "powerLimitMilliwatt", "power_limit_milliwatt");

      const powerMinMilliW = powerMinRaw > 0 ? powerMinRaw : 30_000;
      const powerMaxMilliW =
        powerMaxRaw > 0
          ? Math.max(powerMaxRaw, powerMinMilliW)
          : powerCurrentCapRaw > 0
            ? Math.max(powerCurrentCapRaw, powerMinMilliW)
            : Math.max(450_000, powerMinMilliW);
      const powerCurrentCapMilliW = clamp(
        powerCurrentCapRaw > 0 ? powerCurrentCapRaw : powerMinMilliW,
        powerMinMilliW,
        powerMaxMilliW,
      );

      devices.push({
        id: `${node.nodeId}::gpu::${gpuIndex}`,
        nodeId: node.nodeId,
        label: `${labelPrefix} GPU ${gpuIndex}`,
        gpuIndex,
        smMinBound,
        smMaxBound,
        smCurrentMin,
        smCurrentMax,
        smCurrentClock: numField(fastDev, "graphicsClockMhz", "graphics_clock_mhz"),
        memMinBound,
        memMaxBound,
        memCurrentMin,
        memCurrentMax,
        memCurrentClock: numField(fastDev, "memoryClockMhz", "memory_clock_mhz"),
        canTuneSM,
        canTuneMem,
        powerMinMilliW,
        powerMaxMilliW,
        powerCurrentCapMilliW,
        powerCurrentUsageMilliW: numField(fastDev, "powerUsageMilliwatt", "power_usage_milliwatt"),
      });
    }
  }

  return devices;
}

function dispatchControlCommand(
  sendCommand: PowerModuleViewProps["sendCommand"],
  nodeId: string,
  commandType: string,
  payload: Record<string, unknown>,
) {
  void sendCommand(nodeId, commandType, payload)
    .then((result) => {
      if (!result.ok) {
        console.warn(result.message);
      }
    })
    .catch(() => {
      // ignore command dispatch errors in control panel
    });
}

function CpuCoreRangeControlItem({
  device,
  sendCommand,
}: {
  device: CpuControlDevice;
  sendCommand: PowerModuleViewProps["sendCommand"];
}) {
  const [range, setRange] = useState<[number, number]>([device.scalingCurrentMin, device.scalingCurrentMax]);
  const [isEditing, setIsEditing] = useState(false);
  const syncBlockUntilRef = useRef(0);

  useEffect(() => {
    if (isEditing) return;
    if (Date.now() < syncBlockUntilRef.current) return;
    const lo = clamp(device.scalingCurrentMin, device.scalingMinBound, device.scalingMaxBound);
    const hi = clamp(device.scalingCurrentMax, device.scalingMinBound, device.scalingMaxBound);
    setRange((prev) => (prev[0] === lo && prev[1] === hi ? prev : [lo, hi]));
  }, [
    isEditing,
    device.scalingCurrentMin,
    device.scalingCurrentMax,
    device.scalingMinBound,
    device.scalingMaxBound,
  ]);

  const control = useThrottledEmitter<[number, number]>((next) => {
    dispatchControlCommand(sendCommand, device.nodeId, "cpu_scaling_range", {
      packageId: device.packageId,
      minKhz: Math.round(next[0]),
      maxKhz: Math.round(next[1]),
    });
  }, 20);

  return (
    <div className="space-y-1.5">
      <div className="mb-1 text-sm font-medium text-[var(--telemetry-text)]">{device.label}</div>
      <RichControlSlider
        min={device.scalingMinBound}
        max={device.scalingMaxBound}
        step={1000}
        value={range}
        currentValue={device.scalingCurrentKhz > 0 ? device.scalingCurrentKhz : null}
        valueFormatter={(value) => formatKHz(value)}
        tickFormatter={(value) => formatNumber(value / 1000, 0)}
        majorTickStep={100_000}
        onValueChange={(v) => {
          const next: [number, number] = [
            clamp(v[0] ?? range[0], device.scalingMinBound, device.scalingMaxBound),
            clamp(v[1] ?? range[1], device.scalingMinBound, device.scalingMaxBound),
          ];
          const fixed: [number, number] = [Math.min(next[0], next[1]), Math.max(next[0], next[1])];
          setIsEditing(true);
          setRange(fixed);
          control.send(fixed);
        }}
        onValueCommit={(v) => {
          const next: [number, number] = [
            clamp(v[0] ?? range[0], device.scalingMinBound, device.scalingMaxBound),
            clamp(v[1] ?? range[1], device.scalingMinBound, device.scalingMaxBound),
          ];
          const fixed: [number, number] = [Math.min(next[0], next[1]), Math.max(next[0], next[1])];
          setRange(fixed);
          control.flush(fixed);
          syncBlockUntilRef.current = Date.now() + 200;
          setIsEditing(false);
        }}
      />
    </div>
  );
}

function CpuUncoreRangeControlItem({
  device,
  sendCommand,
}: {
  device: CpuControlDevice;
  sendCommand: PowerModuleViewProps["sendCommand"];
}) {
  const [range, setRange] = useState<[number, number]>([device.uncoreCurrentMin, device.uncoreCurrentMax]);
  const [isEditing, setIsEditing] = useState(false);
  const syncBlockUntilRef = useRef(0);

  useEffect(() => {
    if (!device.canTuneUncore) return;
    if (isEditing) return;
    if (Date.now() < syncBlockUntilRef.current) return;
    const lo = clamp(device.uncoreCurrentMin, device.uncoreMinBound, device.uncoreMaxBound);
    const hi = clamp(device.uncoreCurrentMax, device.uncoreMinBound, device.uncoreMaxBound);
    setRange((prev) => (prev[0] === lo && prev[1] === hi ? prev : [lo, hi]));
  }, [
    device.canTuneUncore,
    isEditing,
    device.uncoreCurrentMin,
    device.uncoreCurrentMax,
    device.uncoreMinBound,
    device.uncoreMaxBound,
  ]);

  const control = useThrottledEmitter<[number, number]>((next) => {
    dispatchControlCommand(sendCommand, device.nodeId, "cpu_uncore_range", {
      packageId: device.packageId,
      minKhz: Math.round(next[0]),
      maxKhz: Math.round(next[1]),
    });
  }, 20);

  if (!device.canTuneUncore) return null;

  return (
    <div className="space-y-1.5">
      <div className="mb-1 text-sm font-medium text-[var(--telemetry-text)]">{device.label}</div>
      <RichControlSlider
        min={device.uncoreMinBound}
        max={device.uncoreMaxBound}
        step={1000}
        value={range}
        currentValue={device.uncoreCurrentKhz > 0 ? device.uncoreCurrentKhz : null}
        valueFormatter={(value) => formatKHz(value)}
        tickFormatter={(value) => formatNumber(value / 1000, 0)}
        majorTickStep={100_000}
        onValueChange={(v) => {
          const next: [number, number] = [
            clamp(v[0] ?? range[0], device.uncoreMinBound, device.uncoreMaxBound),
            clamp(v[1] ?? range[1], device.uncoreMinBound, device.uncoreMaxBound),
          ];
          const fixed: [number, number] = [Math.min(next[0], next[1]), Math.max(next[0], next[1])];
          setIsEditing(true);
          setRange(fixed);
          control.send(fixed);
        }}
        onValueCommit={(v) => {
          const next: [number, number] = [
            clamp(v[0] ?? range[0], device.uncoreMinBound, device.uncoreMaxBound),
            clamp(v[1] ?? range[1], device.uncoreMinBound, device.uncoreMaxBound),
          ];
          const fixed: [number, number] = [Math.min(next[0], next[1]), Math.max(next[0], next[1])];
          setRange(fixed);
          control.flush(fixed);
          syncBlockUntilRef.current = Date.now() + 200;
          setIsEditing(false);
        }}
      />
    </div>
  );
}

function CpuPowerCapControlItem({
  device,
  domain,
  sendCommand,
}: {
  device: CpuControlDevice;
  domain: "package" | "dram";
  sendCommand: PowerModuleViewProps["sendCommand"];
}) {
  const minBound = domain === "package" ? device.packagePowerMinMicroW : device.dramPowerMinMicroW;
  const maxBound = domain === "package" ? device.packagePowerMaxMicroW : device.dramPowerMaxMicroW;
  const backendCurrent = domain === "package" ? device.packagePowerCurrentMicroW : device.dramPowerCurrentMicroW;
  const currentUsage =
    domain === "package"
      ? device.packagePowerUsageMicroW
      : device.hasDramPowerUsage
        ? device.dramPowerUsageMicroW
        : 0;

  const [cap, setCap] = useState(backendCurrent);
  const [isEditing, setIsEditing] = useState(false);
  const syncBlockUntilRef = useRef(0);

  useEffect(() => {
    if (isEditing) return;
    if (Date.now() < syncBlockUntilRef.current) return;
    const next = clamp(backendCurrent, minBound, maxBound);
    setCap((prev) => (Math.abs(prev - next) < 1 ? prev : next));
  }, [isEditing, backendCurrent, minBound, maxBound]);

  const control = useThrottledEmitter<number>((value) => {
    dispatchControlCommand(sendCommand, device.nodeId, "cpu_power_cap", {
      packageId: device.packageId,
      microwatt: Math.round(clamp(value, minBound, maxBound)),
      domain,
    });
  }, 20);

  return (
    <div className="space-y-1.5">
      <div className="mb-1 text-sm font-medium text-[var(--telemetry-text)]">{device.label}</div>
      <RichControlSlider
        min={minBound}
        max={maxBound}
        step={1000}
        value={[cap]}
        currentValue={currentUsage > 0 ? currentUsage : null}
        valueFormatter={(value) => formatPowerMicroW(value)}
        tickFormatter={(value) => formatNumber(value / 1_000_000, 0)}
        onValueChange={(v) => {
          const next = clamp(v[0] ?? cap, minBound, maxBound);
          setIsEditing(true);
          setCap(next);
          control.send(next);
        }}
        onValueCommit={(v) => {
          const next = clamp(v[0] ?? cap, minBound, maxBound);
          setCap(next);
          control.flush(next);
          syncBlockUntilRef.current = Date.now() + 200;
          setIsEditing(false);
        }}
      />
    </div>
  );
}

function GpuClockRangeControlItem({
  device,
  sendCommand,
}: {
  device: GpuControlDevice;
  sendCommand: PowerModuleViewProps["sendCommand"];
}) {
  const [smRange, setSmRange] = useState<[number, number]>([device.smCurrentMin, device.smCurrentMax]);
  const [memRange, setMemRange] = useState<[number, number]>([device.memCurrentMin, device.memCurrentMax]);
  const [isEditing, setIsEditing] = useState(false);
  const syncBlockUntilRef = useRef(0);

  useEffect(() => {
    if (isEditing) return;
    if (Date.now() < syncBlockUntilRef.current) return;

    if (device.canTuneSM) {
      const lo = clamp(device.smCurrentMin, device.smMinBound, device.smMaxBound);
      const hi = clamp(device.smCurrentMax, device.smMinBound, device.smMaxBound);
      setSmRange((prev) => (prev[0] === lo && prev[1] === hi ? prev : [lo, hi]));
    } else {
      setSmRange([0, 0]);
    }

    if (device.canTuneMem) {
      const lo = clamp(device.memCurrentMin, device.memMinBound, device.memMaxBound);
      const hi = clamp(device.memCurrentMax, device.memMinBound, device.memMaxBound);
      setMemRange((prev) => (prev[0] === lo && prev[1] === hi ? prev : [lo, hi]));
    } else {
      setMemRange([0, 0]);
    }
  }, [
    isEditing,
    device.canTuneSM,
    device.canTuneMem,
    device.smCurrentMin,
    device.smCurrentMax,
    device.memCurrentMin,
    device.memCurrentMax,
    device.smMinBound,
    device.smMaxBound,
    device.memMinBound,
    device.memMaxBound,
  ]);

  const control = useThrottledEmitter<{ sm: [number, number]; mem: [number, number] }>((range) => {
    dispatchControlCommand(sendCommand, device.nodeId, "gpu_clock_range", {
      gpuIndex: device.gpuIndex,
      smMinMhz: device.canTuneSM ? Math.round(range.sm[0]) : 0,
      smMaxMhz: device.canTuneSM ? Math.round(range.sm[1]) : 0,
      memMinMhz: device.canTuneMem ? Math.round(range.mem[0]) : 0,
      memMaxMhz: device.canTuneMem ? Math.round(range.mem[1]) : 0,
    });
  }, 20);

  if (!device.canTuneSM && !device.canTuneMem) return null;

  return (
    <div className="space-y-1.5">
      <div className="mb-1 text-sm font-medium text-[var(--telemetry-text)]">{device.label}</div>

      {device.canTuneSM ? (
        <div className="mb-1.5">
          <RichControlSlider
            min={device.smMinBound}
            max={device.smMaxBound}
            step={1}
            value={smRange}
            currentValue={device.smCurrentClock > 0 ? device.smCurrentClock : null}
            valueFormatter={(value) => `${formatNumber(value)} MHz`}
            tickFormatter={(value) => formatNumber(value, 0)}
            onValueChange={(v) => {
              const next: [number, number] = [
                clamp(v[0] ?? smRange[0], device.smMinBound, device.smMaxBound),
                clamp(v[1] ?? smRange[1], device.smMinBound, device.smMaxBound),
              ];
              const fixed: [number, number] = [Math.min(next[0], next[1]), Math.max(next[0], next[1])];
              setIsEditing(true);
              setSmRange(fixed);
              control.send({ sm: fixed, mem: memRange });
            }}
            onValueCommit={(v) => {
              const next: [number, number] = [
                clamp(v[0] ?? smRange[0], device.smMinBound, device.smMaxBound),
                clamp(v[1] ?? smRange[1], device.smMinBound, device.smMaxBound),
              ];
              const fixed: [number, number] = [Math.min(next[0], next[1]), Math.max(next[0], next[1])];
              setSmRange(fixed);
              control.flush({ sm: fixed, mem: memRange });
              syncBlockUntilRef.current = Date.now() + 200;
              setIsEditing(false);
            }}
          />
        </div>
      ) : null}

      {device.canTuneMem ? (
        <div>
          <div className="mb-0.5 text-sm text-[var(--telemetry-muted-fg)]">
            Memory Clock {formatNumber(memRange[0])} ~ {formatNumber(memRange[1])} MHz
          </div>
          <RichControlSlider
            min={device.memMinBound}
            max={device.memMaxBound}
            step={1}
            value={memRange}
            currentValue={device.memCurrentClock > 0 ? device.memCurrentClock : null}
            valueFormatter={(value) => `${formatNumber(value)} MHz`}
            tickFormatter={(value) => formatNumber(value, 0)}
            onValueChange={(v) => {
              const next: [number, number] = [
                clamp(v[0] ?? memRange[0], device.memMinBound, device.memMaxBound),
                clamp(v[1] ?? memRange[1], device.memMinBound, device.memMaxBound),
              ];
              const fixed: [number, number] = [Math.min(next[0], next[1]), Math.max(next[0], next[1])];
              setIsEditing(true);
              setMemRange(fixed);
              control.send({ sm: smRange, mem: fixed });
            }}
            onValueCommit={(v) => {
              const next: [number, number] = [
                clamp(v[0] ?? memRange[0], device.memMinBound, device.memMaxBound),
                clamp(v[1] ?? memRange[1], device.memMinBound, device.memMaxBound),
              ];
              const fixed: [number, number] = [Math.min(next[0], next[1]), Math.max(next[0], next[1])];
              setMemRange(fixed);
              control.flush({ sm: smRange, mem: fixed });
              syncBlockUntilRef.current = Date.now() + 200;
              setIsEditing(false);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function GpuPowerCapControlItem({
  device,
  sendCommand,
}: {
  device: GpuControlDevice;
  sendCommand: PowerModuleViewProps["sendCommand"];
}) {
  const [cap, setCap] = useState(device.powerCurrentCapMilliW);
  const [isEditing, setIsEditing] = useState(false);
  const syncBlockUntilRef = useRef(0);

  useEffect(() => {
    if (isEditing) return;
    if (Date.now() < syncBlockUntilRef.current) return;
    const next = clamp(device.powerCurrentCapMilliW, device.powerMinMilliW, device.powerMaxMilliW);
    setCap((prev) => (Math.abs(prev - next) < 1 ? prev : next));
  }, [isEditing, device.powerCurrentCapMilliW, device.powerMinMilliW, device.powerMaxMilliW]);

  const control = useThrottledEmitter<number>((value) => {
    dispatchControlCommand(sendCommand, device.nodeId, "gpu_power_cap", {
      gpuIndex: device.gpuIndex,
      milliwatt: Math.round(clamp(value, device.powerMinMilliW, device.powerMaxMilliW)),
    });
  }, 20);

  return (
    <div className="space-y-1.5">
      <div className="mb-1 text-sm font-medium text-[var(--telemetry-text)]">{device.label}</div>
      <RichControlSlider
        min={device.powerMinMilliW}
        max={device.powerMaxMilliW}
        step={1}
        value={[cap]}
        currentValue={device.powerCurrentUsageMilliW > 0 ? device.powerCurrentUsageMilliW : null}
        valueFormatter={(value) => formatPowerMilliW(value)}
        tickFormatter={(value) => formatNumber(value / 1000, 0)}
        onValueChange={(v) => {
          const next = clamp(v[0] ?? cap, device.powerMinMilliW, device.powerMaxMilliW);
          setIsEditing(true);
          setCap(next);
          control.send(next);
        }}
        onValueCommit={(v) => {
          const next = clamp(v[0] ?? cap, device.powerMinMilliW, device.powerMaxMilliW);
          setCap(next);
          control.flush(next);
          syncBlockUntilRef.current = Date.now() + 200;
          setIsEditing(false);
        }}
      />
    </div>
  );
}

function ControlGroup({
  title,
  description,
  children,
  defaultOpen = true,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Section
      title={title}
      description={description}
      compact
      right={
        <button
          type="button"
          className="inline-flex h-7 items-center gap-1 rounded-md border border-[var(--telemetry-border)] bg-[var(--telemetry-surface-soft)] px-2 text-xs font-medium text-[var(--telemetry-text)] transition-colors hover:bg-[var(--telemetry-surface)]"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
        >
          <span>{open ? "Collapse" : "Expand"}</span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      }
    >
      <div className={open ? "space-y-2" : "hidden"}>{children}</div>
    </Section>
  );
}

export function PowerModuleView({ nodes, history, sendCommand }: PowerModuleViewProps) {
  const sortedNodes = useMemo(() => nodes.slice().sort(compareNodes), [nodes]);

  const cpuFrequency = useMemo(() => buildCPUFrequencySeries(sortedNodes, history), [sortedNodes, history]);
  const cpuUncoreFrequency = useMemo(() => buildCPUUncoreFrequencySeries(sortedNodes, history), [sortedNodes, history]);
  const gpuFrequency = useMemo(() => buildGPUFrequencySeries(sortedNodes, history), [sortedNodes, history]);
  const cpuPower = useMemo(() => buildCPUPowerSeries(sortedNodes, history), [sortedNodes, history]);
  const cpuDramPower = useMemo(() => buildCPUDramPowerSeries(sortedNodes, history), [sortedNodes, history]);
  const gpuPower = useMemo(() => buildGPUPowerSeries(sortedNodes, history), [sortedNodes, history]);

  const cpuControlDevices = useMemo(() => collectCPUControlDevices(sortedNodes, history), [sortedNodes, history]);
  const gpuControlDevices = useMemo(() => collectGPUControlDevices(sortedNodes), [sortedNodes]);

  const cpuPowerTotal = useMemo(() => latestTotalOfAllLines(cpuPower), [cpuPower]);
  const cpuDramPowerTotal = useMemo(() => latestTotalOfAllLines(cpuDramPower), [cpuDramPower]);
  const gpuPowerTotal = useMemo(() => latestTotalOfAllLines(gpuPower), [gpuPower]);
  const cpuPowerStatusKey = useMemo(() => firstLineKeyWithValue(cpuPower), [cpuPower]);
  const cpuDramPowerStatusKey = useMemo(() => firstLineKeyWithValue(cpuDramPower), [cpuDramPower]);
  const gpuPowerStatusKey = useMemo(() => firstLineKeyWithValue(gpuPower), [gpuPower]);

  const cpuUncoreDevices = useMemo(() => cpuControlDevices.filter((d) => d.canTuneUncore), [cpuControlDevices]);
  const cpuDramCapDevices = useMemo(
    () => cpuControlDevices.filter((d) => d.supportsDramPowerCap),
    [cpuControlDevices],
  );
  const gpuClockDevices = useMemo(
    () => gpuControlDevices.filter((d) => d.canTuneSM || d.canTuneMem),
    [gpuControlDevices],
  );

  return (
    <div className="grid gap-3 lg:h-full lg:min-h-0 lg:grid-cols-[4fr_3fr_3fr] lg:grid-rows-1 lg:overflow-hidden">
      <div className="flex flex-col gap-3 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pr-1">
        <div className="shrink-0">
          <MetricChart
            chartId="power-overview-cpu-frequency"
            title="CPU Core Frequency"
            yLabel="MHz"
            data={cpuFrequency.data}
            lines={cpuFrequency.lines}
            yDomain={[0, Math.max(cpuFrequency.maxY, 1)]}
            connectNulls
          />
        </div>
        <div className="shrink-0">
          <MetricChart
            chartId="power-overview-cpu-uncore-frequency"
            title="CPU Uncore Frequency"
            yLabel="MHz"
            data={cpuUncoreFrequency.data}
            lines={cpuUncoreFrequency.lines}
            yDomain={[0, Math.max(cpuUncoreFrequency.maxY, 1)]}
            connectNulls
          />
        </div>
        <div className="shrink-0">
          <MetricChart
            chartId="power-overview-gpu-frequency"
            title="GPU Frequency"
            yLabel="MHz"
            data={gpuFrequency.data}
            lines={gpuFrequency.lines}
            yDomain={[0, Math.max(gpuFrequency.maxY, 1)]}
            connectNulls
          />
        </div>
        <div className="shrink-0">
          <MetricChart
            chartId="power-overview-cpu-power"
            title="CPU Package Power"
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
        </div>
        <div className="shrink-0">
          <MetricChart
            chartId="power-overview-cpu-dram-power"
            title="CPU DRAM Power"
            yLabel="W"
            data={cpuDramPower.data}
            lines={cpuDramPower.lines}
            yDomain={[0, Math.max(cpuDramPower.maxY, 1)]}
            showCurrentStatus
            currentValueFormatter={(_value, line) => {
              if (line.key !== cpuDramPowerStatusKey || cpuDramPowerTotal === null) return null;
              return `${formatNumber(cpuDramPowerTotal, 3)} W`;
            }}
            connectNulls
          />
        </div>
        <div className="shrink-0">
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
      </div>

      <div className="space-y-3 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:px-1">
        <ControlGroup
          title="CPU Core Range"
        >
          {cpuControlDevices.length > 0 ? (
            cpuControlDevices.map((device) => (
              <CpuCoreRangeControlItem key={`cpu-core-${device.id}`} device={device} sendCommand={sendCommand} />
            ))
          ) : (
            <div className="text-sm text-[var(--telemetry-muted-fg)]">No CPU core range controls available.</div>
          )}
        </ControlGroup>

        <ControlGroup
          title="CPU Uncore Range"
        >
          {cpuUncoreDevices.length > 0 ? (
            cpuUncoreDevices.map((device) => (
              <CpuUncoreRangeControlItem key={`cpu-uncore-${device.id}`} device={device} sendCommand={sendCommand} />
            ))
          ) : (
            <div className="text-sm text-[var(--telemetry-muted-fg)]">No CPU uncore controls available.</div>
          )}
        </ControlGroup>

        <ControlGroup
          title="CPU Package Power Cap"
        >
          {cpuControlDevices.length > 0 ? (
            cpuControlDevices.map((device) => (
              <CpuPowerCapControlItem
                key={`cpu-package-cap-${device.id}`}
                device={device}
                domain="package"
                sendCommand={sendCommand}
              />
            ))
          ) : (
            <div className="text-sm text-[var(--telemetry-muted-fg)]">No CPU package power cap controls available.</div>
          )}
        </ControlGroup>

        <ControlGroup
          title="CPU DRAM Power Cap"
        >
          {cpuDramCapDevices.length > 0 ? (
            cpuDramCapDevices.map((device) => (
              <CpuPowerCapControlItem
                key={`cpu-dram-cap-${device.id}`}
                device={device}
                domain="dram"
                sendCommand={sendCommand}
              />
            ))
          ) : (
            <div className="text-sm text-[var(--telemetry-muted-fg)]">No CPU DRAM power cap controls available.</div>
          )}
        </ControlGroup>

      </div>

      <div className="space-y-3 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pl-1">
        <ControlGroup
          title="GPU Clock Range"
        >
          {gpuClockDevices.length > 0 ? (
            gpuClockDevices.map((device) => (
              <GpuClockRangeControlItem key={`gpu-clock-${device.id}`} device={device} sendCommand={sendCommand} />
            ))
          ) : (
            <div className="text-sm text-[var(--telemetry-muted-fg)]">No GPU clock range controls available.</div>
          )}
        </ControlGroup>

        <ControlGroup
          title="GPU Power Cap"
        >
          {gpuControlDevices.length > 0 ? (
            gpuControlDevices.map((device) => (
              <GpuPowerCapControlItem key={`gpu-power-cap-${device.id}`} device={device} sendCommand={sendCommand} />
            ))
          ) : (
            <div className="text-sm text-[var(--telemetry-muted-fg)]">No GPU power cap controls available.</div>
          )}
        </ControlGroup>
      </div>
    </div>
  );
}
