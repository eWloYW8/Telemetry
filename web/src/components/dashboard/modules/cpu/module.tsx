"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Cpu, Thermometer } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

import { MetricChart } from "../../components/charts/metric-chart";
import { CpuCoreDenseTable } from "../../components/cpu/core-dense-table";
import { ControlCard } from "../../components/ui/control-card";
import type { CpuCoreDenseRow, RawHistorySample } from "../../types";
import { deltaRate, maxOr } from "../../utils/rates";
import { nsToTimeLabel } from "../../utils/time";
import { clamp, formatKHz, formatNumber, formatPowerMicroW } from "../../utils/units";
import { formatIDRanges, moduleMeta, numField, sampledAtNs, strField } from "../shared/data";
import { useThrottledEmitter } from "../shared/live-control";
import { Section, StatRow } from "../shared/section";

type CPUModuleViewProps = {
  nodeId: string;
  packageId: number;
  registration: Record<string, any> | null;
  latestRaw: Record<string, Record<string, any>>;
  historyByCategory: Record<string, RawHistorySample[]>;
  cmdPending: boolean;
  cmdMsg: string;
  sendCommand: (commandType: string, payload: Record<string, unknown>) => void;
};

export function cpuPackageIDsFromRegistration(registration: Record<string, any> | null): number[] {
  const cpuMeta = moduleMeta(registration, "cpu");
  const cpuDevices = (cpuMeta?.devices ?? []) as Array<Record<string, any>>;
  const cpuControls = (cpuMeta?.packageControls ?? cpuMeta?.package_controls ?? []) as Array<Record<string, any>>;
  const ids = [
    ...cpuDevices.map((d) => numField(d, "packageId", "package_id")),
    ...cpuControls.map((c) => numField(c, "packageId", "package_id")),
  ].filter((v) => v >= 0);
  return Array.from(new Set(ids)).sort((a, b) => a - b);
}

export function CPUModuleView({
  nodeId,
  packageId,
  registration,
  latestRaw,
  historyByCategory,
  cmdPending,
  cmdMsg,
  sendCommand,
}: CPUModuleViewProps) {
  const cpuMeta = moduleMeta(registration, "cpu");
  const cpuStatic = (cpuMeta?.static ?? null) as Record<string, any> | null;
  const cpuDevices = (cpuMeta?.devices ?? []) as Array<Record<string, any>>;
  const cpuControls = ((cpuMeta?.packageControls ?? cpuMeta?.package_controls ?? []) as Array<Record<string, any>>)
    .slice()
    .sort((a, b) => numField(a, "packageId", "package_id") - numField(b, "packageId", "package_id"));

  const activeCpuDevice = useMemo(
    () => cpuDevices.find((d) => numField(d, "packageId", "package_id") === packageId) ?? null,
    [cpuDevices, packageId],
  );
  const activeCpuControl = useMemo(
    () => cpuControls.find((c) => numField(c, "packageId", "package_id") === packageId) ?? null,
    [cpuControls, packageId],
  );

  const cpuMediumRaw = latestRaw.cpu_medium?.cpuMediumMetrics ?? latestRaw.cpu_medium?.cpu_medium_metrics ?? null;
  const cpuUltraRaw =
    latestRaw.cpu_ultra_fast?.cpuUltraMetrics ?? latestRaw.cpu_ultra_fast?.cpu_ultra_metrics ?? null;
  const cpuCores = (cpuMediumRaw?.cores ?? []) as Array<Record<string, any>>;
  const cpuTemps = (cpuMediumRaw?.temperatures ?? []) as Array<Record<string, any>>;
  const cpuRapl = (cpuUltraRaw?.rapl ?? []) as Array<Record<string, any>>;
  const cpuUncoreNow = (cpuUltraRaw?.uncore ?? []) as Array<Record<string, any>>;
  const cpuPerCoreNow = (cpuUltraRaw?.perCore ?? []) as Array<Record<string, any>>;

  const cpuScaleMinBound =
    numField(
      activeCpuControl,
      "scalingHwMinKhz",
      "scaling_hw_min_khz",
      "scalingMinKhz",
      "scaling_min_khz",
    ) || 800_000;
  const cpuScaleMaxBound =
    numField(
      activeCpuControl,
      "scalingHwMaxKhz",
      "scaling_hw_max_khz",
      "scalingMaxKhz",
      "scaling_max_khz",
    ) || 5_000_000;

  const cpuGovernorOptions = useMemo(() => {
    const arr = (activeCpuControl?.availableGovernors ?? activeCpuControl?.available_governors ?? []) as string[];
    return arr.length > 0 ? arr : ["performance", "powersave"];
  }, [activeCpuControl]);

  const [cpuRange, setCpuRange] = useState<[number, number]>([cpuScaleMinBound, cpuScaleMaxBound]);
  const [cpuGovernor, setCpuGovernor] = useState<string>(cpuGovernorOptions[0] ?? "performance");
  const [uncoreRange, setUncoreRange] = useState<[number, number]>([1_200_000, 3_500_000]);
  const [cpuPowerCap, setCpuPowerCap] = useState(120_000_000);
  const [showPerCoreRuntime, setShowPerCoreRuntime] = useState(false);

  const [isEditingScale, setIsEditingScale] = useState(false);
  const [isEditingUncore, setIsEditingUncore] = useState(false);
  const [isEditingPowerCap, setIsEditingPowerCap] = useState(false);
  const scaleSyncBlockUntilRef = useRef(0);
  const uncoreSyncBlockUntilRef = useRef(0);
  const powerCapSyncBlockUntilRef = useRef(0);
  const governorSyncBlockUntilRef = useRef(0);

  const activeUncoreMetric = useMemo(
    () => cpuUncoreNow.find((u) => numField(u, "packageId", "package_id") === packageId) ?? null,
    [cpuUncoreNow, packageId],
  );
  const activePerCoreCfg = useMemo(() => {
    const list = cpuPerCoreNow
      .filter((c) => numField(c, "packageId", "package_id") === packageId)
      .sort((a, b) => numField(a, "coreId", "core_id") - numField(b, "coreId", "core_id"));
    return list[0] ?? null;
  }, [cpuPerCoreNow, packageId]);
  const activeCpuRapl = useMemo(
    () => cpuRapl.find((r) => numField(r, "packageId", "package_id") === packageId) ?? null,
    [cpuRapl, packageId],
  );

  const uncoreRuntimeMin = numField(activeUncoreMetric, "minKhz", "min_khz");
  const uncoreRuntimeMax = numField(activeUncoreMetric, "maxKhz", "max_khz");
  const uncoreInitialMin = numField(activeUncoreMetric, "initialMinKhz", "initial_min_khz");
  const uncoreInitialMax = numField(activeUncoreMetric, "initialMaxKhz", "initial_max_khz");
  const uncoreMin = uncoreInitialMin || numField(activeCpuControl, "uncoreMinKhz", "uncore_min_khz");
  const uncoreMax = uncoreInitialMax || numField(activeCpuControl, "uncoreMaxKhz", "uncore_max_khz");
  const cpuSupportsUncore = numField(cpuStatic, "supportsIntelUncore", "supports_intel_uncore") > 0;
  const canControlUncore = uncoreMin > 0 && uncoreMax > uncoreMin;

  const cpuPowerMin = numField(activeCpuControl, "powerCapMinMicroW", "power_cap_min_micro_w");
  const cpuPowerMax = numField(activeCpuControl, "powerCapMaxMicroW", "power_cap_max_micro_w");
  const cpuPowerCurrent =
    numField(activeCpuRapl, "powerCapMicroW", "power_cap_micro_w") ||
    numField(activeCpuControl, "powerCapMicroW", "power_cap_micro_w");
  const cpuPowerSliderMax = useMemo(() => {
    if (cpuPowerMax > 0) return cpuPowerMax;
    if (cpuPowerCurrent > 0) return cpuPowerCurrent;
    if (cpuPowerCap > 0) return cpuPowerCap;
    return 400_000_000;
  }, [cpuPowerMax, cpuPowerCurrent, cpuPowerCap]);
  const cpuPowerSliderMin = useMemo(() => {
    if (cpuPowerMin > 0 && cpuPowerMin <= cpuPowerSliderMax) return cpuPowerMin;
    return Math.min(1_000_000, cpuPowerSliderMax);
  }, [cpuPowerMin, cpuPowerSliderMax]);

  const scalingControl = useThrottledEmitter<[number, number]>((next) => {
    sendCommand("cpu_scaling_range", {
      packageId,
      minKhz: Math.round(next[0]),
      maxKhz: Math.round(next[1]),
    });
  }, 100);

  const uncoreControl = useThrottledEmitter<[number, number]>((next) => {
    sendCommand("cpu_uncore_range", {
      packageId,
      minKhz: Math.round(next[0]),
      maxKhz: Math.round(next[1]),
    });
  }, 100);

  const powerCapControl = useThrottledEmitter<number>((value) => {
    sendCommand("cpu_power_cap", {
      packageId,
      microwatt: Math.round(clamp(value, cpuPowerSliderMin, cpuPowerSliderMax)),
    });
  }, 100);

  const governorControl = useThrottledEmitter<string>((value) => {
    sendCommand("cpu_governor", {
      packageId,
      governor: value,
    });
  }, 100);

  useEffect(() => {
    if (isEditingScale) return;
    if (Date.now() < scaleSyncBlockUntilRef.current) return;
    const backendMinRaw =
      numField(activePerCoreCfg, "scalingMinKhz", "scaling_min_khz") ||
      numField(activeCpuControl, "scalingMinKhz", "scaling_min_khz");
    const backendMaxRaw =
      numField(activePerCoreCfg, "scalingMaxKhz", "scaling_max_khz") ||
      numField(activeCpuControl, "scalingMaxKhz", "scaling_max_khz");
    const backendMin = backendMinRaw > 0 ? backendMinRaw : cpuScaleMinBound;
    const backendMax = backendMaxRaw > 0 ? backendMaxRaw : cpuScaleMaxBound;
    const lo = clamp(Math.min(backendMin, backendMax), cpuScaleMinBound, cpuScaleMaxBound);
    const hi = clamp(Math.max(backendMin, backendMax), cpuScaleMinBound, cpuScaleMaxBound);
    setCpuRange((prev) => (prev[0] === lo && prev[1] === hi ? prev : [lo, hi]));
  }, [activePerCoreCfg, activeCpuControl, cpuScaleMinBound, cpuScaleMaxBound, isEditingScale]);

  useEffect(() => {
    if (Date.now() < governorSyncBlockUntilRef.current) return;
    const backendGovernor =
      strField(activePerCoreCfg, "currentGovernor", "current_governor") ||
      strField(activeCpuControl, "currentGovernor", "current_governor");
    if (!backendGovernor) return;
    if (!cpuGovernorOptions.includes(backendGovernor)) return;
    setCpuGovernor((prev) => (prev === backendGovernor ? prev : backendGovernor));
  }, [activePerCoreCfg, activeCpuControl, cpuGovernorOptions]);

  useEffect(() => {
    if (isEditingUncore) return;
    if (Date.now() < uncoreSyncBlockUntilRef.current) return;
    if (!canControlUncore) return;
    const runtimeMin = uncoreRuntimeMin > 0 ? uncoreRuntimeMin : uncoreMin;
    const runtimeMax = uncoreRuntimeMax > 0 ? uncoreRuntimeMax : uncoreMax;
    if (runtimeMin <= 0 || runtimeMax <= 0) return;
    const lo = clamp(Math.min(runtimeMin, runtimeMax), uncoreMin, uncoreMax);
    const hi = clamp(Math.max(runtimeMin, runtimeMax), uncoreMin, uncoreMax);
    setUncoreRange((prev) => (prev[0] === lo && prev[1] === hi ? prev : [lo, hi]));
  }, [
    isEditingUncore,
    canControlUncore,
    uncoreRuntimeMin,
    uncoreRuntimeMax,
    uncoreMin,
    uncoreMax,
    activeUncoreMetric,
  ]);

  useEffect(() => {
    if (isEditingPowerCap) return;
    if (Date.now() < powerCapSyncBlockUntilRef.current) return;
    const current = cpuPowerCurrent > 0 ? cpuPowerCurrent : cpuPowerSliderMin;
    const next = clamp(current, cpuPowerSliderMin, cpuPowerSliderMax);
    setCpuPowerCap((prev) => (Math.abs(prev - next) < 1 ? prev : next));
  }, [isEditingPowerCap, cpuPowerCurrent, cpuPowerSliderMin, cpuPowerSliderMax]);

  useEffect(() => {
    if (!cpuGovernorOptions.includes(cpuGovernor)) {
      setCpuGovernor(cpuGovernorOptions[0] ?? "performance");
    }
  }, [cpuGovernor, cpuGovernorOptions]);

  useEffect(() => {
    setCpuRange((prev) => [
      clamp(prev[0], cpuScaleMinBound, cpuScaleMaxBound),
      clamp(prev[1], cpuScaleMinBound, cpuScaleMaxBound),
    ]);
  }, [cpuScaleMinBound, cpuScaleMaxBound]);

  useEffect(() => {
    setCpuPowerCap((prev) => clamp(prev, cpuPowerSliderMin, cpuPowerSliderMax));
  }, [cpuPowerSliderMin, cpuPowerSliderMax]);

  useEffect(() => {
    setIsEditingScale(false);
    setIsEditingUncore(false);
    setIsEditingPowerCap(false);
    scaleSyncBlockUntilRef.current = 0;
    uncoreSyncBlockUntilRef.current = 0;
    powerCapSyncBlockUntilRef.current = 0;
    governorSyncBlockUntilRef.current = 0;
  }, [packageId]);

  const tempByPackage = useMemo(() => {
    const map = new Map<number, number>();
    for (const t of cpuTemps) {
      map.set(numField(t, "packageId", "package_id"), numField(t, "milliC", "milli_c") / 1000);
    }
    return map;
  }, [cpuTemps]);

  const dynamicPerCoreConfigByPackage = useMemo(() => {
    const map = new Map<number, Record<string, any>>();
    const perCore = (cpuUltraRaw?.perCore ?? []) as Array<Record<string, any>>;
    for (const cfg of perCore) {
      map.set(numField(cfg, "packageId", "package_id"), cfg);
    }
    return map;
  }, [cpuUltraRaw]);

  const staticControlByPackage = useMemo(() => {
    const map = new Map<number, Record<string, any>>();
    for (const cfg of cpuControls) {
      map.set(numField(cfg, "packageId", "package_id"), cfg);
    }
    return map;
  }, [cpuControls]);

  const cpuCoreRows = useMemo<CpuCoreDenseRow[]>(() => {
    return cpuCores
      .filter((core) => numField(core, "packageId", "package_id") === packageId)
      .map((core) => {
        const pkg = numField(core, "packageId", "package_id");
        const dyn = dynamicPerCoreConfigByPackage.get(pkg) ?? null;
        const st = staticControlByPackage.get(pkg) ?? null;
        return {
          packageId: pkg,
          coreId: numField(core, "coreId", "core_id"),
          utilPct: numField(core, "utilization") * 100,
          curKHz: numField(core, "scalingCurKhz", "scaling_cur_khz"),
          minKHz:
            numField(dyn, "scalingMinKhz", "scaling_min_khz") ||
            numField(st, "scalingMinKhz", "scaling_min_khz"),
          maxKHz:
            numField(dyn, "scalingMaxKhz", "scaling_max_khz") ||
            numField(st, "scalingMaxKhz", "scaling_max_khz"),
          governor:
            strField(dyn, "currentGovernor", "current_governor") ||
            strField(st, "currentGovernor", "current_governor"),
          driver:
            strField(dyn, "scalingDriver", "scaling_driver") ||
            strField(st, "scalingDriver", "scaling_driver"),
          tempC: tempByPackage.get(pkg) ?? 0,
        };
      })
      .sort((a, b) => (a.packageId === b.packageId ? a.coreId - b.coreId : a.packageId - b.packageId));
  }, [cpuCores, dynamicPerCoreConfigByPackage, staticControlByPackage, tempByPackage, packageId]);

  const cpuUsageSeries = useMemo(() => {
    const list = historyByCategory.cpu_medium ?? [];
    return list.map((item) => {
      const payload = item.sample.cpuMediumMetrics ?? item.sample.cpu_medium_metrics ?? {};
      const cores = (payload.cores ?? []) as Array<Record<string, any>>;
      const perPkg = cores.filter((c) => numField(c, "packageId", "package_id") === packageId);
      const utilAvg =
        perPkg.length > 0
          ? perPkg.reduce((acc, c) => acc + numField(c, "utilization") * 100, 0) / perPkg.length
          : 0;
      return { tsNs: item.atNs.toString(), time: nsToTimeLabel(item.atNs), utilPct: utilAvg };
    });
  }, [historyByCategory.cpu_medium, packageId]);

  const cpuFreqSeries = useMemo(() => {
    const list = historyByCategory.cpu_medium ?? [];
    return list.map((item) => {
      const payload = item.sample.cpuMediumMetrics ?? item.sample.cpu_medium_metrics ?? {};
      const cores = (payload.cores ?? []) as Array<Record<string, any>>;
      const perPkg = cores.filter((c) => numField(c, "packageId", "package_id") === packageId);
      const avgMHz =
        perPkg.length > 0
          ? perPkg.reduce((acc, c) => acc + numField(c, "scalingCurKhz", "scaling_cur_khz"), 0) /
            perPkg.length /
            1000
          : 0;
      return { tsNs: item.atNs.toString(), time: nsToTimeLabel(item.atNs), avgMHz };
    });
  }, [historyByCategory.cpu_medium, packageId]);

  const cpuTempSeries = useMemo(() => {
    const list = historyByCategory.cpu_medium ?? [];
    return list.map((item) => {
      const payload = item.sample.cpuMediumMetrics ?? item.sample.cpu_medium_metrics ?? {};
      const temps = (payload.temperatures ?? []) as Array<Record<string, any>>;
      const temp = temps.find((t) => numField(t, "packageId", "package_id") === packageId) ?? null;
      return {
        tsNs: item.atNs.toString(),
        time: nsToTimeLabel(item.atNs),
        tempC: numField(temp, "milliC", "milli_c") / 1000,
      };
    });
  }, [historyByCategory.cpu_medium, packageId]);

  const cpuPowerSeries = useMemo(() => {
    const list = historyByCategory.cpu_ultra_fast ?? [];
    const rows: Array<Record<string, number | string>> = [];
    for (let i = 1; i < list.length; i += 1) {
      const prev = list[i - 1];
      const cur = list[i];
      const prevRapl =
        ((prev.sample.cpuUltraMetrics ?? prev.sample.cpu_ultra_metrics ?? {}).rapl ?? []) as Array<
          Record<string, any>
        >;
      const curRapl =
        ((cur.sample.cpuUltraMetrics ?? cur.sample.cpu_ultra_metrics ?? {}).rapl ?? []) as Array<
          Record<string, any>
        >;

      const prevByPkg = new Map<number, Record<string, any>>();
      for (const p of prevRapl) {
        prevByPkg.set(numField(p, "packageId", "package_id"), p);
      }

      const curPkg = curRapl.find((c) => numField(c, "packageId", "package_id") === packageId);
      const prevPkg = curPkg ? prevByPkg.get(packageId) : null;
      let powerW = 0;
      if (curPkg && prevPkg) {
        const curEnergy = numField(curPkg, "energyMicroJ", "energy_micro_j");
        const prevEnergy = numField(prevPkg, "energyMicroJ", "energy_micro_j");
        const curTs = sampledAtNs(curPkg, cur.atNs);
        const prevTs = sampledAtNs(prevPkg, prev.atNs);
        const rate = deltaRate(curEnergy, prevEnergy, curTs, prevTs);
        if (rate !== null) powerW = rate / 1_000_000;
      }

      rows.push({ tsNs: cur.atNs.toString(), time: nsToTimeLabel(cur.atNs), powerW });
    }
    return rows;
  }, [historyByCategory.cpu_ultra_fast, packageId]);

  const cpuUncoreSeries = useMemo(() => {
    const list = historyByCategory.cpu_ultra_fast ?? [];
    return list.map((item) => {
      const payload = item.sample.cpuUltraMetrics ?? item.sample.cpu_ultra_metrics ?? {};
      const uncore = (payload.uncore ?? []) as Array<Record<string, any>>;
      const pkg = uncore.find((u) => numField(u, "packageId", "package_id") === packageId) ?? null;
      const currentMHz = numField(pkg, "currentKhz", "current_khz") / 1000;
      return { tsNs: item.atNs.toString(), time: nsToTimeLabel(item.atNs), currentMHz };
    });
  }, [historyByCategory.cpu_ultra_fast, packageId]);

  const cpuFrequencySeries = useMemo(() => {
    if (cpuFreqSeries.length === 0) return [];
    if (cpuUncoreSeries.length === 0) return cpuFreqSeries;

    const uncorePoints = cpuUncoreSeries
      .map((row) => {
        try {
          return {
            tsNs: BigInt(String(row.tsNs ?? "0")),
            mhz: numField(row, "currentMHz"),
          };
        } catch {
          return { tsNs: 0n, mhz: 0 };
        }
      })
      .filter((row) => row.tsNs > 0n && row.mhz > 0)
      .sort((a, b) => (a.tsNs === b.tsNs ? 0 : a.tsNs < b.tsNs ? -1 : 1));

    if (uncorePoints.length === 0) return cpuFreqSeries;

    let idx = 0;
    let lastUncoreMHz = uncorePoints[0]?.mhz ?? 0;

    return cpuFreqSeries.map((row) => {
      let tsNs = 0n;
      try {
        tsNs = BigInt(String(row.tsNs ?? "0"));
      } catch {
        tsNs = 0n;
      }

      while (idx < uncorePoints.length && uncorePoints[idx].tsNs <= tsNs) {
        lastUncoreMHz = uncorePoints[idx].mhz;
        idx += 1;
      }

      return {
        ...row,
        uncoreMHz: lastUncoreMHz,
      };
    });
  }, [cpuFreqSeries, cpuUncoreSeries]);

  const hasUncoreSample = useMemo(
    () => cpuUncoreSeries.some((row) => numField(row, "currentMHz") > 0),
    [cpuUncoreSeries],
  );
  const showUncore = cpuSupportsUncore || canControlUncore || hasUncoreSample;

  const cpuPowerMaxBound = useMemo(() => {
    const capW = numField(activeCpuControl, "powerCapMaxMicroW", "power_cap_max_micro_w") / 1_000_000;
    if (capW > 0) return capW;
    const sampleMax = cpuPowerSeries.reduce((acc, row) => Math.max(acc, numField(row, "powerW")), 0);
    return Math.max(sampleMax, 1);
  }, [activeCpuControl, cpuPowerSeries]);

  const cpuUncoreMaxBound = useMemo(() => {
    const boundMHz = uncoreMax > 0 ? uncoreMax / 1000 : 0;
    const sampleMax = cpuUncoreSeries.reduce((acc, row) => Math.max(acc, numField(row, "currentMHz")), 0);
    return Math.max(boundMHz, sampleMax, 1);
  }, [uncoreMax, cpuUncoreSeries]);

  const cpuTempMaxBound = useMemo(() => {
    const sampleMax = cpuTempSeries.reduce((acc, row) => Math.max(acc, numField(row, "tempC")), 0);
    return Math.max(100, sampleMax * 1.1);
  }, [cpuTempSeries]);

  const coreIDsLabel = formatIDRanges((activeCpuDevice?.coreIds ?? activeCpuDevice?.core_ids ?? []) as number[]);
  const cpuChartSuffix = `${nodeId || "node"}-pkg${packageId}`;

  if (packageId < 0) {
    return (
      <Section title="CPU Device" icon={<Cpu className="h-4 w-4" />}>
        <div className="text-sm text-[var(--telemetry-muted-fg)]">No CPU package discovered.</div>
      </Section>
    );
  }

  return (
    <>
      <Section title={`CPU ${packageId} Static`} icon={<Cpu className="h-4 w-4" />}>
        <div className="grid gap-2 md:grid-cols-2">
          <StatRow name="Vendor" value={strField(activeCpuDevice, "vendor") || strField(cpuStatic, "vendor") || "-"} />
          <StatRow name="Model" value={strField(activeCpuDevice, "model") || strField(cpuStatic, "model") || "-"} />
          <StatRow name="Core Count" value={numField(activeCpuDevice, "coreCount", "core_count")} />
          <StatRow name="Thread Count" value={numField(activeCpuDevice, "threadCount", "thread_count")} />
          <StatRow name="Threads/Core" value={numField(cpuStatic, "threadsPerCore", "threads_per_core")} />
          <StatRow
            name="Scale HW Min"
            value={formatKHz(numField(activeCpuControl, "scalingHwMinKhz", "scaling_hw_min_khz"))}
          />
          <StatRow
            name="Scale HW Max"
            value={formatKHz(numField(activeCpuControl, "scalingHwMaxKhz", "scaling_hw_max_khz"))}
          />
          <StatRow name="Core IDs" value={coreIDsLabel} />
        </div>
      </Section>

      <Section title={`CPU ${packageId} Controls`} icon={<Thermometer className="h-4 w-4" />}>
        <div className="grid gap-3 lg:grid-cols-2">
          <ControlCard title="Scaling and Governor">
            <div>
              <div className="mb-1 text-xs text-[var(--telemetry-muted-fg)]">
                Scaling Range {formatKHz(cpuRange[0])} ~ {formatKHz(cpuRange[1])}
              </div>
              <Slider
                min={cpuScaleMinBound}
                max={cpuScaleMaxBound}
                step={1000}
                value={cpuRange}
                onValueChange={(v) => {
                  const next: [number, number] = [
                    clamp(v[0] ?? cpuRange[0], cpuScaleMinBound, cpuScaleMaxBound),
                    clamp(v[1] ?? cpuRange[1], cpuScaleMinBound, cpuScaleMaxBound),
                  ];
                  const fixed: [number, number] = [Math.min(next[0], next[1]), Math.max(next[0], next[1])];
                  setIsEditingScale(true);
                  setCpuRange(fixed);
                  scalingControl.send(fixed);
                }}
                onValueCommit={(v) => {
                  const next: [number, number] = [
                    clamp(v[0] ?? cpuRange[0], cpuScaleMinBound, cpuScaleMaxBound),
                    clamp(v[1] ?? cpuRange[1], cpuScaleMinBound, cpuScaleMaxBound),
                  ];
                  const fixed: [number, number] = [Math.min(next[0], next[1]), Math.max(next[0], next[1])];
                  setCpuRange(fixed);
                  scalingControl.flush(fixed);
                  scaleSyncBlockUntilRef.current = Date.now() + 200;
                  setIsEditingScale(false);
                }}
              />
            </div>

            <div>
              <div className="mb-1 text-xs text-[var(--telemetry-muted-fg)]">Governor</div>
              <Select
                value={cpuGovernor}
                onValueChange={(value) => {
                  setCpuGovernor(value);
                  governorSyncBlockUntilRef.current = Date.now() + 200;
                  governorControl.flush(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cpuGovernorOptions.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </ControlCard>

          <ControlCard
            title={showUncore ? "Uncore and RAPL" : "RAPL"}
            disabledNote={!canControlUncore && showUncore ? "Uncore range control is unavailable on this platform." : undefined}
          >
            {showUncore ? (
              <div>
                <div className="mb-1 text-xs text-[var(--telemetry-muted-fg)]">
                  Uncore Range {formatKHz(uncoreRange[0])} ~ {formatKHz(uncoreRange[1])}
                </div>
                <Slider
                  min={maxOr(uncoreMin, 1)}
                  max={maxOr(uncoreMax, 1)}
                  step={1000}
                  value={uncoreRange}
                  onValueChange={(v) => {
                    const next: [number, number] = [
                      clamp(v[0] ?? uncoreRange[0], uncoreMin, uncoreMax),
                      clamp(v[1] ?? uncoreRange[1], uncoreMin, uncoreMax),
                    ];
                    const fixed: [number, number] = [Math.min(next[0], next[1]), Math.max(next[0], next[1])];
                    setIsEditingUncore(true);
                    setUncoreRange(fixed);
                    if (canControlUncore) uncoreControl.send(fixed);
                  }}
                  onValueCommit={(v) => {
                    const next: [number, number] = [
                      clamp(v[0] ?? uncoreRange[0], uncoreMin, uncoreMax),
                      clamp(v[1] ?? uncoreRange[1], uncoreMin, uncoreMax),
                    ];
                    const fixed: [number, number] = [Math.min(next[0], next[1]), Math.max(next[0], next[1])];
                    setUncoreRange(fixed);
                    if (canControlUncore) uncoreControl.flush(fixed);
                    uncoreSyncBlockUntilRef.current = Date.now() + 200;
                    setIsEditingUncore(false);
                  }}
                  disabled={!canControlUncore}
                />
              </div>
            ) : null}

            <div>
              <div className="mb-1 text-xs text-[var(--telemetry-muted-fg)]">Power Cap {formatPowerMicroW(cpuPowerCap)}</div>
              <Slider
                min={cpuPowerSliderMin}
                max={cpuPowerSliderMax}
                step={1000}
                value={[cpuPowerCap]}
                onValueChange={(v) => {
                  const next = clamp(v[0] ?? cpuPowerCap, cpuPowerSliderMin, cpuPowerSliderMax);
                  setIsEditingPowerCap(true);
                  setCpuPowerCap(next);
                  powerCapControl.send(next);
                }}
                onValueCommit={(v) => {
                  const next = clamp(v[0] ?? cpuPowerCap, cpuPowerSliderMin, cpuPowerSliderMax);
                  setCpuPowerCap(next);
                  powerCapControl.flush(next);
                  powerCapSyncBlockUntilRef.current = Date.now() + 200;
                  setIsEditingPowerCap(false);
                }}
              />
            </div>
          </ControlCard>
        </div>

        {cmdMsg ? <div className="mt-2 text-xs text-[var(--telemetry-muted-fg)]">{cmdMsg}</div> : null}
      </Section>

      <Section
        title={`CPU ${packageId} Per-Core Runtime`}
        icon={<Cpu className="h-4 w-4" />}
        right={
          <button
            type="button"
            className="inline-flex h-7 items-center gap-1 rounded-md border border-[var(--telemetry-border)] bg-[var(--telemetry-surface-soft)] px-2 text-xs font-medium text-[var(--telemetry-text)] transition-colors hover:bg-[var(--telemetry-surface)]"
            onClick={() => setShowPerCoreRuntime((prev) => !prev)}
            aria-expanded={showPerCoreRuntime}
            aria-controls={`cpu-per-core-runtime-${cpuChartSuffix}`}
          >
            <span>{showPerCoreRuntime ? "Collapse" : "Expand"}</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showPerCoreRuntime ? "rotate-180" : ""}`} />
          </button>
        }
      >
        <div id={`cpu-per-core-runtime-${cpuChartSuffix}`}>
          {showPerCoreRuntime ? (
            <CpuCoreDenseTable rows={cpuCoreRows} />
          ) : (
            <div className="text-xs text-[var(--telemetry-muted-fg)]">Per-core runtime table is collapsed.</div>
          )}
        </div>
      </Section>

      <div className="grid gap-3 lg:grid-cols-2">
        <MetricChart
          chartId={`cpu-utilization-${cpuChartSuffix}`}
          title={`CPU ${packageId} Utilization`}
          yLabel="%"
          data={cpuUsageSeries}
          lines={[{ key: "utilPct", label: "Utilization", color: "#0f766e" }]}
          yDomain={[0, 100]}
        />
        <MetricChart
          chartId={`cpu-frequency-${cpuChartSuffix}`}
          title={`CPU ${packageId} Frequency`}
          yLabel="MHz"
          data={cpuFrequencySeries}
          lines={[
            { key: "avgMHz", label: "Core", color: "#0369a1" },
            ...(showUncore ? [{ key: "uncoreMHz", label: "Uncore", color: "#15803d" }] : []),
          ]}
          yDomain={[0, showUncore ? Math.max(cpuScaleMaxBound / 1000, cpuUncoreMaxBound) : cpuScaleMaxBound / 1000]}
        />
        <MetricChart
          chartId={`cpu-temperature-${cpuChartSuffix}`}
          title={`CPU ${packageId} Temperature`}
          yLabel="C"
          data={cpuTempSeries}
          lines={[{ key: "tempC", label: "Temperature", color: "#dc2626" }]}
          yDomain={[0, cpuTempMaxBound]}
        />
        <MetricChart
          chartId={`cpu-package-power-${cpuChartSuffix}`}
          title={`CPU ${packageId} Package Power`}
          yLabel="W"
          data={cpuPowerSeries}
          lines={[{ key: "powerW", label: "Power", color: "#0e7490" }]}
          yDomain={[0, cpuPowerMaxBound]}
        />
      </div>

      <Section title={`CPU ${packageId} RAPL`} icon={<Thermometer className="h-4 w-4" />}>
        <div className="grid gap-2 md:grid-cols-2">
          <StatRow
            name="Energy"
            value={`${formatNumber(numField(activeCpuRapl, "energyMicroJ", "energy_micro_j") / 1_000_000)} J`}
          />
          <StatRow
            name="Current Cap"
            value={formatPowerMicroW(numField(activeCpuRapl, "powerCapMicroW", "power_cap_micro_w"))}
          />
          <StatRow
            name="Cap Range"
            value={
              numField(activeCpuControl, "powerCapMinMicroW", "power_cap_min_micro_w") > 0 ||
              numField(activeCpuControl, "powerCapMaxMicroW", "power_cap_max_micro_w") > 0
                ? `${formatPowerMicroW(numField(activeCpuControl, "powerCapMinMicroW", "power_cap_min_micro_w"))} ~ ${formatPowerMicroW(numField(activeCpuControl, "powerCapMaxMicroW", "power_cap_max_micro_w"))}`
                : "-"
            }
          />
          {showUncore ? (
            <StatRow
              name="Uncore Range"
              value={canControlUncore ? `${formatKHz(uncoreMin)} ~ ${formatKHz(uncoreMax)}` : "unsupported"}
            />
          ) : null}
        </div>
      </Section>
    </>
  );
}
