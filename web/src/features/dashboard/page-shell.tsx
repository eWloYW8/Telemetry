"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Cpu, Gauge, HardDrive, MemoryStick, Network, Server, Thermometer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { MetricChart } from "./components/charts/metric-chart";
import { CpuCoreDenseTable } from "./components/cpu/core-dense-table";
import { NodeSidebar } from "./components/node/node-sidebar";
import { ProcessTable } from "./components/process/process-table";
import { postProtoCommand } from "./state/commands";
import { useTelemetryWS } from "./state/ws-client";
import type {
  CpuCoreDenseRow,
  ProcessRow,
  ProcessSortKey,
  SortDir,
  TabKey,
} from "./types";
import { deltaRate, maxOr } from "./utils/rates";
import { nsToTimeLabel, toBigIntNs } from "./utils/time";
import { clamp, formatBytes, formatKHz, formatNumber, formatPercent, formatPowerMicroW, formatPowerMilliW } from "./utils/units";

function numField(obj: Record<string, any> | null | undefined, ...keys: string[]): number {
  if (!obj) return 0;
  for (const key of keys) {
    const value = obj[key];
    if (value === undefined || value === null) continue;
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
      continue;
    }
    if (typeof value === "bigint") return Number(value);
    if (typeof value === "object") {
      const big = toBigIntNs(value);
      if (big !== 0n) return Number(big);
    }
  }
  return 0;
}

function strField(obj: Record<string, any> | null | undefined, ...keys: string[]): string {
  if (!obj) return "";
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null) return String(value);
  }
  return "";
}

function sampledAtNs(v: Record<string, any>, fallback: bigint): bigint {
  const sampled = toBigIntNs(v.sampledAtUnixNano ?? v.sampled_at_unix_nano);
  if (sampled > 0n) return sampled;
  return fallback;
}

function moduleMeta(registration: Record<string, any> | null | undefined, moduleName: string) {
  const modules = (registration?.modules ?? []) as Array<Record<string, any>>;
  for (const module of modules) {
    if (module.name !== moduleName) continue;
    if (module[moduleName]) return module[moduleName] as Record<string, any>;
    for (const key of ["cpu", "gpu", "memory", "storage", "network", "process"]) {
      if (module[key]) return module[key] as Record<string, any>;
    }
  }
  return null;
}

function Section({
  title,
  icon,
  right,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-slate-200 bg-white">
      <header className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          {icon}
          {title}
        </div>
        {right}
      </header>
      <div className="p-3">{children}</div>
    </section>
  );
}

function StatRow({ name, value }: { name: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[170px_1fr] gap-2 border-b border-slate-100 py-1 text-sm last:border-b-0">
      <div className="text-slate-500">{name}</div>
      <div className="font-medium text-slate-900">{value}</div>
    </div>
  );
}

export function DashboardShell() {
  const { wsConnected, nodes, history } = useTelemetryWS();

  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("cpu");

  const [cmdPending, setCmdPending] = useState(false);
  const [cmdMsg, setCmdMsg] = useState("");

  const [cpuPackageTarget, setCpuPackageTarget] = useState("all");
  const [cpuRange, setCpuRange] = useState<[number, number]>([1_200_000, 3_500_000]);
  const [cpuGovernor, setCpuGovernor] = useState("performance");
  const [uncorePackage, setUncorePackage] = useState(0);
  const [uncoreRange, setUncoreRange] = useState<[number, number]>([1_200_000, 3_500_000]);
  const [cpuPowerPackage, setCpuPowerPackage] = useState(0);
  const [cpuPowerCap, setCpuPowerCap] = useState(120_000_000);

  const [gpuIndex, setGpuIndex] = useState(0);
  const [gpuSMRange, setGpuSMRange] = useState<[number, number]>([0, 0]);
  const [gpuMemRange, setGpuMemRange] = useState<[number, number]>([0, 0]);
  const [gpuPowerCap, setGpuPowerCap] = useState(120_000);

  const [procSortKey, setProcSortKey] = useState<ProcessSortKey>("cpu");
  const [procSortDir, setProcSortDir] = useState<SortDir>("desc");

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
  const basic = (registration?.basic ?? null) as Record<string, any> | null;

  const cpuMeta = moduleMeta(registration, "cpu");
  const gpuMeta = moduleMeta(registration, "gpu");
  const memoryMeta = moduleMeta(registration, "memory");
  const storageMeta = moduleMeta(registration, "storage");

  const cpuStatic = (cpuMeta?.static ?? null) as Record<string, any> | null;
  const cpuDevices = (cpuMeta?.devices ?? []) as Array<Record<string, any>>;
  const cpuControls = ((cpuMeta?.packageControls ?? cpuMeta?.package_controls ?? []) as Array<Record<string, any>>)
    .slice()
    .sort((a, b) => numField(a, "packageId", "package_id") - numField(b, "packageId", "package_id"));

  const gpuStatic = ((gpuMeta?.static ?? []) as Array<Record<string, any>>)
    .slice()
    .sort((a, b) => numField(a, "index") - numField(b, "index"));

  const latestRaw = selectedNode?.latestRaw ?? {};
  const cpuMediumRaw = latestRaw.cpu_medium?.cpuMediumMetrics ?? latestRaw.cpu_medium?.cpu_medium_metrics ?? null;
  const cpuUltraRaw = latestRaw.cpu_ultra_fast?.cpuUltraMetrics ?? latestRaw.cpu_ultra_fast?.cpu_ultra_metrics ?? null;
  const gpuFastRaw = latestRaw.gpu_fast?.gpuFastMetrics ?? latestRaw.gpu_fast?.gpu_fast_metrics ?? null;
  const memoryRaw = latestRaw.memory?.memoryMetrics ?? latestRaw.memory?.memory_metrics ?? null;
  const storageRaw = latestRaw.storage?.storageMetrics ?? latestRaw.storage?.storage_metrics ?? null;
  const networkRaw = latestRaw.network?.networkMetrics ?? latestRaw.network?.network_metrics ?? null;
  const processRaw = latestRaw.process?.processMetrics ?? latestRaw.process?.process_metrics ?? null;

  const cpuCores = (cpuMediumRaw?.cores ?? []) as Array<Record<string, any>>;
  const cpuTemps = (cpuMediumRaw?.temperatures ?? []) as Array<Record<string, any>>;
  const cpuRapl = (cpuUltraRaw?.rapl ?? []) as Array<Record<string, any>>;
  const processRowsRaw = (processRaw?.processes ?? []) as Array<Record<string, any>>;

  const historyByCategory = history[selectedNodeId] ?? {};

  const cpuPackageIds = useMemo(() => {
    const ids = cpuControls
      .map((c) => numField(c, "packageId", "package_id"))
      .filter((v) => v >= 0);
    return Array.from(new Set(ids)).sort((a, b) => a - b);
  }, [cpuControls]);

  const activeCpuControl = useMemo(() => {
    if (cpuPackageIds.length === 0) return null;
    if (cpuPackageTarget === "all") return cpuControls[0] ?? null;
    return (
      cpuControls.find((c) => numField(c, "packageId", "package_id") === Number(cpuPackageTarget)) ??
      null
    );
  }, [cpuControls, cpuPackageIds, cpuPackageTarget]);

  const cpuScaleMinBound = useMemo(() => {
    if (cpuPackageTarget === "all") {
      const mins = cpuControls
        .map((c) =>
          numField(
            c,
            "scalingHwMinKhz",
            "scaling_hw_min_khz",
            "scalingMinKhz",
            "scaling_min_khz",
          ),
        )
        .filter((v) => v > 0);
      return mins.length > 0 ? Math.min(...mins) : 800_000;
    }
    return (
      numField(
        activeCpuControl,
        "scalingHwMinKhz",
        "scaling_hw_min_khz",
        "scalingMinKhz",
        "scaling_min_khz",
      ) || 800_000
    );
  }, [cpuControls, cpuPackageTarget, activeCpuControl]);

  const cpuScaleMaxBound = useMemo(() => {
    if (cpuPackageTarget === "all") {
      const maxs = cpuControls
        .map((c) =>
          numField(
            c,
            "scalingHwMaxKhz",
            "scaling_hw_max_khz",
            "scalingMaxKhz",
            "scaling_max_khz",
          ),
        )
        .filter((v) => v > 0);
      return maxs.length > 0 ? Math.max(...maxs) : 5_000_000;
    }
    return (
      numField(
        activeCpuControl,
        "scalingHwMaxKhz",
        "scaling_hw_max_khz",
        "scalingMaxKhz",
        "scaling_max_khz",
      ) || 5_000_000
    );
  }, [cpuControls, cpuPackageTarget, activeCpuControl]);

  const cpuGovernorOptions = useMemo(() => {
    if (cpuPackageTarget === "all") {
      const all = new Set<string>();
      for (const c of cpuControls) {
        const arr = (c.availableGovernors ?? c.available_governors ?? []) as string[];
        for (const g of arr) all.add(g);
      }
      return all.size > 0 ? Array.from(all).sort() : ["performance", "powersave"];
    }
    const arr = (activeCpuControl?.availableGovernors ?? activeCpuControl?.available_governors ?? []) as string[];
    return arr.length > 0 ? arr : ["performance", "powersave"];
  }, [cpuControls, cpuPackageTarget, activeCpuControl]);

  useEffect(() => {
    const lo = clamp(cpuRange[0], cpuScaleMinBound, cpuScaleMaxBound);
    const hi = clamp(cpuRange[1], cpuScaleMinBound, cpuScaleMaxBound);
    const next: [number, number] = [Math.min(lo, hi), Math.max(lo, hi)];
    if (next[0] !== cpuRange[0] || next[1] !== cpuRange[1]) {
      setCpuRange(next);
    }
  }, [cpuRange, cpuScaleMinBound, cpuScaleMaxBound]);

  useEffect(() => {
    if (!cpuGovernorOptions.includes(cpuGovernor)) {
      setCpuGovernor(cpuGovernorOptions[0]);
    }
  }, [cpuGovernorOptions, cpuGovernor]);

  useEffect(() => {
    if (cpuPackageIds.length === 0) {
      if (cpuPackageTarget !== "all") setCpuPackageTarget("all");
      return;
    }
    if (cpuPackageTarget !== "all" && !cpuPackageIds.includes(Number(cpuPackageTarget))) {
      setCpuPackageTarget("all");
    }
  }, [cpuPackageIds, cpuPackageTarget]);

  useEffect(() => {
    if (cpuControls.length === 0) return;
    const ids = cpuControls.map((c) => numField(c, "packageId", "package_id"));
    if (!ids.includes(uncorePackage)) setUncorePackage(ids[0]);
    if (!ids.includes(cpuPowerPackage)) setCpuPowerPackage(ids[0]);
  }, [cpuControls, uncorePackage, cpuPowerPackage]);

  const uncoreControl = cpuControls.find((c) => numField(c, "packageId", "package_id") === uncorePackage) ?? null;
  const uncoreMin = numField(uncoreControl, "uncoreMinKhz", "uncore_min_khz");
  const uncoreMax = numField(uncoreControl, "uncoreMaxKhz", "uncore_max_khz");

  useEffect(() => {
    if (uncoreMin <= 0 || uncoreMax <= 0 || uncoreMax < uncoreMin) return;
    const lo = clamp(uncoreRange[0], uncoreMin, uncoreMax);
    const hi = clamp(uncoreRange[1], uncoreMin, uncoreMax);
    const next: [number, number] = [Math.min(lo, hi), Math.max(lo, hi)];
    if (next[0] !== uncoreRange[0] || next[1] !== uncoreRange[1]) {
      setUncoreRange(next);
    }
  }, [uncoreMin, uncoreMax, uncoreRange]);

  const powerControl = cpuControls.find((c) => numField(c, "packageId", "package_id") === cpuPowerPackage) ?? null;
  const cpuPowerMin = numField(powerControl, "powerCapMinMicroW", "power_cap_min_micro_w");
  const cpuPowerMax = numField(powerControl, "powerCapMaxMicroW", "power_cap_max_micro_w");

  useEffect(() => {
    const current = numField(powerControl, "powerCapMicroW", "power_cap_micro_w");
    if (cpuPowerCap <= 0 && current > 0) {
      setCpuPowerCap(current);
    }
  }, [powerControl, cpuPowerCap]);

  const gpuIndexes = gpuStatic.map((g) => numField(g, "index"));
  const activeGPUStatic = gpuStatic.find((g) => numField(g, "index") === gpuIndex) ?? gpuStatic[0] ?? null;

  const gpuDevicesFast = (gpuFastRaw?.devices ?? []) as Array<Record<string, any>>;
  const activeGPUFast =
    gpuDevicesFast.find((g) => numField(g, "index") === gpuIndex) ?? gpuDevicesFast[0] ?? null;

  useEffect(() => {
    if (gpuIndexes.length === 0) return;
    if (!gpuIndexes.includes(gpuIndex)) setGpuIndex(gpuIndexes[0]);
  }, [gpuIndexes, gpuIndex]);

  useEffect(() => {
    if (!activeGPUStatic) return;
    const smMin = numField(activeGPUStatic, "smClockMinMhz", "sm_clock_min_mhz");
    const smMax = numField(activeGPUStatic, "smClockMaxMhz", "sm_clock_max_mhz");
    if (smMin > 0 && smMax >= smMin) {
      const lo = clamp(gpuSMRange[0] || smMin, smMin, smMax);
      const hi = clamp(gpuSMRange[1] || smMax, smMin, smMax);
      const next: [number, number] = [Math.min(lo, hi), Math.max(lo, hi)];
      if (next[0] !== gpuSMRange[0] || next[1] !== gpuSMRange[1]) setGpuSMRange(next);
    }

    const memMin = numField(activeGPUStatic, "memClockMinMhz", "mem_clock_min_mhz");
    const memMax = numField(activeGPUStatic, "memClockMaxMhz", "mem_clock_max_mhz");
    if (memMin > 0 && memMax >= memMin) {
      const lo = clamp(gpuMemRange[0] || memMin, memMin, memMax);
      const hi = clamp(gpuMemRange[1] || memMax, memMin, memMax);
      const next: [number, number] = [Math.min(lo, hi), Math.max(lo, hi)];
      if (next[0] !== gpuMemRange[0] || next[1] !== gpuMemRange[1]) setGpuMemRange(next);
    }

    const powerMin = numField(activeGPUStatic, "powerMinMilliwatt", "power_min_milliwatt") || 30_000;
    const powerMax = numField(activeGPUStatic, "powerMaxMilliwatt", "power_max_milliwatt") || 450_000;
    const powerCurrent = numField(activeGPUFast, "powerLimitMilliwatt", "power_limit_milliwatt") || gpuPowerCap;
    const nextPower = clamp(powerCurrent, powerMin, powerMax);
    if (nextPower !== gpuPowerCap) {
      setGpuPowerCap(nextPower);
    }
  }, [activeGPUStatic, activeGPUFast, gpuSMRange, gpuMemRange, gpuPowerCap]);

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
      .map((core) => {
        const packageId = numField(core, "packageId", "package_id");
        const dyn = dynamicPerCoreConfigByPackage.get(packageId) ?? null;
        const st = staticControlByPackage.get(packageId) ?? null;
        return {
          packageId,
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
          tempC: tempByPackage.get(packageId) ?? 0,
        };
      })
      .sort((a, b) => (a.packageId === b.packageId ? a.coreId - b.coreId : a.packageId - b.packageId));
  }, [cpuCores, dynamicPerCoreConfigByPackage, staticControlByPackage, tempByPackage]);

  const sendCommand = async (commandType: string, payload: Record<string, unknown>) => {
    if (!selectedNodeId) return;
    setCmdPending(true);
    setCmdMsg("");
    try {
      const result = await postProtoCommand(selectedNodeId, commandType, payload);
      setCmdMsg(result.message);
    } catch (err) {
      const message = err instanceof Error ? err.message : "request failed";
      setCmdMsg(`${commandType}: ${message}`);
    } finally {
      setCmdPending(false);
    }
  };

  const cpuUsageSeries = useMemo(() => {
    const list = historyByCategory.cpu_medium ?? [];
    return list.map((item) => {
      const payload = item.sample.cpuMediumMetrics ?? item.sample.cpu_medium_metrics ?? {};
      const cores = (payload.cores ?? []) as Array<Record<string, any>>;
      const utilAvg = cores.length > 0
        ? cores.reduce((acc, c) => acc + numField(c, "utilization") * 100, 0) / cores.length
        : 0;
      return { time: nsToTimeLabel(item.atNs), utilPct: utilAvg };
    });
  }, [historyByCategory.cpu_medium]);

  const cpuFreqSeries = useMemo(() => {
    const list = historyByCategory.cpu_medium ?? [];
    return list.map((item) => {
      const payload = item.sample.cpuMediumMetrics ?? item.sample.cpu_medium_metrics ?? {};
      const cores = (payload.cores ?? []) as Array<Record<string, any>>;
      const avgMHz = cores.length > 0
        ? cores.reduce((acc, c) => acc + numField(c, "scalingCurKhz", "scaling_cur_khz"), 0) / cores.length / 1000
        : 0;
      return { time: nsToTimeLabel(item.atNs), avgMHz };
    });
  }, [historyByCategory.cpu_medium]);

  const cpuTempSeries = useMemo(() => {
    const list = historyByCategory.cpu_medium ?? [];
    return list.map((item) => {
      const payload = item.sample.cpuMediumMetrics ?? item.sample.cpu_medium_metrics ?? {};
      const temps = (payload.temperatures ?? []) as Array<Record<string, any>>;
      const avgC = temps.length > 0
        ? temps.reduce((acc, t) => acc + numField(t, "milliC", "milli_c") / 1000, 0) / temps.length
        : 0;
      return { time: nsToTimeLabel(item.atNs), tempC: avgC };
    });
  }, [historyByCategory.cpu_medium]);

  const cpuPowerSeries = useMemo(() => {
    const list = historyByCategory.cpu_ultra_fast ?? [];
    const rows: Array<Record<string, number | string>> = [];
    for (let i = 1; i < list.length; i += 1) {
      const prev = list[i - 1];
      const cur = list[i];
      const prevRapl = ((prev.sample.cpuUltraMetrics ?? prev.sample.cpu_ultra_metrics ?? {}).rapl ?? []) as Array<Record<string, any>>;
      const curRapl = ((cur.sample.cpuUltraMetrics ?? cur.sample.cpu_ultra_metrics ?? {}).rapl ?? []) as Array<Record<string, any>>;

      const prevByPkg = new Map<number, Record<string, any>>();
      for (const p of prevRapl) {
        prevByPkg.set(numField(p, "packageId", "package_id"), p);
      }

      let totalPowerW = 0;
      for (const c of curRapl) {
        const pkg = numField(c, "packageId", "package_id");
        const p = prevByPkg.get(pkg);
        if (!p) continue;
        const curEnergy = numField(c, "energyMicroJ", "energy_micro_j");
        const prevEnergy = numField(p, "energyMicroJ", "energy_micro_j");
        const curTs = sampledAtNs(c, cur.atNs);
        const prevTs = sampledAtNs(p, prev.atNs);
        const rate = deltaRate(curEnergy, prevEnergy, curTs, prevTs);
        if (rate === null) continue;
        totalPowerW += rate / 1_000_000;
      }

      rows.push({ time: nsToTimeLabel(cur.atNs), powerW: totalPowerW });
    }
    return rows;
  }, [historyByCategory.cpu_ultra_fast]);

  const gpuUtilSeries = useMemo(() => {
    const list = historyByCategory.gpu_fast ?? [];
    return list.map((item) => {
      const devices = ((item.sample.gpuFastMetrics ?? item.sample.gpu_fast_metrics ?? {}).devices ?? []) as Array<Record<string, any>>;
      const n = devices.length || 1;
      const gpuUtil = devices.reduce((acc, d) => acc + numField(d, "utilizationGpu", "utilization_gpu"), 0) / n;
      const memUtil = devices.reduce((acc, d) => acc + numField(d, "utilizationMem", "utilization_mem"), 0) / n;
      return { time: nsToTimeLabel(item.atNs), gpuUtilPct: gpuUtil, memUtilPct: memUtil };
    });
  }, [historyByCategory.gpu_fast]);

  const gpuPowerSeries = useMemo(() => {
    const list = historyByCategory.gpu_fast ?? [];
    return list.map((item) => {
      const devices = ((item.sample.gpuFastMetrics ?? item.sample.gpu_fast_metrics ?? {}).devices ?? []) as Array<Record<string, any>>;
      const powerW = devices.reduce((acc, d) => acc + numField(d, "powerUsageMilliwatt", "power_usage_milliwatt"), 0) / 1000;
      return { time: nsToTimeLabel(item.atNs), powerW };
    });
  }, [historyByCategory.gpu_fast]);

  const gpuClockSeries = useMemo(() => {
    const list = historyByCategory.gpu_fast ?? [];
    return list.map((item) => {
      const devices = ((item.sample.gpuFastMetrics ?? item.sample.gpu_fast_metrics ?? {}).devices ?? []) as Array<Record<string, any>>;
      const n = devices.length || 1;
      const smMHz = devices.reduce((acc, d) => acc + numField(d, "graphicsClockMhz", "graphics_clock_mhz"), 0) / n;
      const memMHz = devices.reduce((acc, d) => acc + numField(d, "memoryClockMhz", "memory_clock_mhz"), 0) / n;
      return { time: nsToTimeLabel(item.atNs), smMHz, memMHz };
    });
  }, [historyByCategory.gpu_fast]);

  const memorySeries = useMemo(() => {
    const list = historyByCategory.memory ?? [];
    return list.map((item) => {
      const m = item.sample.memoryMetrics ?? item.sample.memory_metrics ?? {};
      return {
        time: nsToTimeLabel(item.atNs),
        usedGB: numField(m, "usedBytes", "used_bytes") / 1024 / 1024 / 1024,
        cachedGB: numField(m, "cachedBytes", "cached_bytes") / 1024 / 1024 / 1024,
      };
    });
  }, [historyByCategory.memory]);

  const networkSeries = useMemo(() => {
    const list = historyByCategory.network ?? [];
    const rows: Array<Record<string, number | string>> = [];
    for (let i = 1; i < list.length; i += 1) {
      const prev = list[i - 1];
      const cur = list[i];
      const prevIfs = ((prev.sample.networkMetrics ?? prev.sample.network_metrics ?? {}).interfaces ?? []) as Array<Record<string, any>>;
      const curIfs = ((cur.sample.networkMetrics ?? cur.sample.network_metrics ?? {}).interfaces ?? []) as Array<Record<string, any>>;

      const prevByName = new Map<string, Record<string, any>>();
      for (const p of prevIfs) prevByName.set(strField(p, "name"), p);

      let rxBpsTotal = 0;
      let txBpsTotal = 0;
      for (const c of curIfs) {
        const name = strField(c, "name");
        const p = prevByName.get(name);
        if (!p) continue;

        const curTs = sampledAtNs(c, cur.atNs);
        const prevTs = sampledAtNs(p, prev.atNs);
        const rxRate = deltaRate(
          numField(c, "rxBytes", "rx_bytes"),
          numField(p, "rxBytes", "rx_bytes"),
          curTs,
          prevTs,
        );
        const txRate = deltaRate(
          numField(c, "txBytes", "tx_bytes"),
          numField(p, "txBytes", "tx_bytes"),
          curTs,
          prevTs,
        );

        if (rxRate !== null) rxBpsTotal += rxRate;
        if (txRate !== null) txBpsTotal += txRate;
      }

      rows.push({
        time: nsToTimeLabel(cur.atNs),
        rxMBps: rxBpsTotal / 1024 / 1024,
        txMBps: txBpsTotal / 1024 / 1024,
      });
    }
    return rows;
  }, [historyByCategory.network]);

  const storageBwSeries = useMemo(() => {
    const list = historyByCategory.storage ?? [];
    const rows: Array<Record<string, number | string>> = [];
    for (let i = 1; i < list.length; i += 1) {
      const prev = list[i - 1];
      const cur = list[i];
      const prevDisks = ((prev.sample.storageMetrics ?? prev.sample.storage_metrics ?? {}).disks ?? []) as Array<Record<string, any>>;
      const curDisks = ((cur.sample.storageMetrics ?? cur.sample.storage_metrics ?? {}).disks ?? []) as Array<Record<string, any>>;

      const prevByName = new Map<string, Record<string, any>>();
      for (const p of prevDisks) prevByName.set(strField(p, "name"), p);

      let readBpsTotal = 0;
      let writeBpsTotal = 0;
      for (const c of curDisks) {
        const name = strField(c, "name");
        const p = prevByName.get(name);
        if (!p) continue;

        const curTs = sampledAtNs(c, cur.atNs);
        const prevTs = sampledAtNs(p, prev.atNs);
        const readSectorsRate = deltaRate(
          numField(c, "readSectors", "read_sectors"),
          numField(p, "readSectors", "read_sectors"),
          curTs,
          prevTs,
        );
        const writeSectorsRate = deltaRate(
          numField(c, "writeSectors", "write_sectors"),
          numField(p, "writeSectors", "write_sectors"),
          curTs,
          prevTs,
        );
        if (readSectorsRate !== null) readBpsTotal += readSectorsRate * 512;
        if (writeSectorsRate !== null) writeBpsTotal += writeSectorsRate * 512;
      }

      rows.push({
        time: nsToTimeLabel(cur.atNs),
        readMBps: readBpsTotal / 1024 / 1024,
        writeMBps: writeBpsTotal / 1024 / 1024,
      });
    }
    return rows;
  }, [historyByCategory.storage]);

  const storageIopsSeries = useMemo(() => {
    const list = historyByCategory.storage ?? [];
    const rows: Array<Record<string, number | string>> = [];
    for (let i = 1; i < list.length; i += 1) {
      const prev = list[i - 1];
      const cur = list[i];
      const prevDisks = ((prev.sample.storageMetrics ?? prev.sample.storage_metrics ?? {}).disks ?? []) as Array<Record<string, any>>;
      const curDisks = ((cur.sample.storageMetrics ?? cur.sample.storage_metrics ?? {}).disks ?? []) as Array<Record<string, any>>;

      const prevByName = new Map<string, Record<string, any>>();
      for (const p of prevDisks) prevByName.set(strField(p, "name"), p);

      let readIops = 0;
      let writeIops = 0;
      for (const c of curDisks) {
        const name = strField(c, "name");
        const p = prevByName.get(name);
        if (!p) continue;

        const curTs = sampledAtNs(c, cur.atNs);
        const prevTs = sampledAtNs(p, prev.atNs);
        const readRate = deltaRate(
          numField(c, "readIos", "read_ios"),
          numField(p, "readIos", "read_ios"),
          curTs,
          prevTs,
        );
        const writeRate = deltaRate(
          numField(c, "writeIos", "write_ios"),
          numField(p, "writeIos", "write_ios"),
          curTs,
          prevTs,
        );
        if (readRate !== null) readIops += readRate;
        if (writeRate !== null) writeIops += writeRate;
      }

      rows.push({ time: nsToTimeLabel(cur.atNs), readIOPS: readIops, writeIOPS: writeIops });
    }
    return rows;
  }, [historyByCategory.storage]);

  const cpuPowerMaxBound = useMemo(() => {
    const capW = cpuControls.reduce((acc, c) => {
      const v = numField(c, "powerCapMaxMicroW", "power_cap_max_micro_w");
      return acc + (v > 0 ? v / 1_000_000 : 0);
    }, 0);
    if (capW > 0) return capW;
    const sampleMax = cpuPowerSeries.reduce((acc, row) => Math.max(acc, numField(row, "powerW")), 0);
    return Math.max(sampleMax, 1);
  }, [cpuControls, cpuPowerSeries]);

  const cpuTempMaxBound = useMemo(() => {
    const sampleMax = cpuTempSeries.reduce((acc, row) => Math.max(acc, numField(row, "tempC")), 0);
    return Math.max(100, sampleMax * 1.1);
  }, [cpuTempSeries]);

  const processRows = useMemo<ProcessRow[]>(() => {
    const rows = processRowsRaw.map((p) => ({
      pid: numField(p, "pid"),
      ppid: numField(p, "ppid"),
      user: strField(p, "user") || "-",
      state: strField(p, "state") || "-",
      cpu: numField(p, "cpuPercent", "cpu_percent"),
      memory: numField(p, "memoryBytes", "memory_bytes"),
      command: strField(p, "command") || "-",
    }));

    return rows.sort((a, b) => {
      const sign = procSortDir === "asc" ? 1 : -1;
      switch (procSortKey) {
        case "pid":
          return (a.pid - b.pid) * sign;
        case "ppid":
          return (a.ppid - b.ppid) * sign;
        case "cpu":
          return (a.cpu - b.cpu) * sign;
        case "memory":
          return (a.memory - b.memory) * sign;
        case "user":
          return a.user.localeCompare(b.user) * sign;
        case "state":
          return a.state.localeCompare(b.state) * sign;
        case "command":
          return a.command.localeCompare(b.command) * sign;
        default:
          return 0;
      }
    });
  }, [processRowsRaw, procSortDir, procSortKey]);

  const onSortProcess = (key: ProcessSortKey) => {
    if (procSortKey === key) {
      setProcSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setProcSortKey(key);
    setProcSortDir(key === "command" || key === "user" || key === "state" ? "asc" : "desc");
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
            <Section
              title={`Node ${selectedNode.nodeId}`}
              icon={<Server className="h-4 w-4" />}
              right={
                <div className="flex items-center gap-2">
                  <Badge variant={selectedNode.connected ? "default" : "outline"}>
                    {selectedNode.connected ? "connected" : "stale"}
                  </Badge>
                  <Badge variant="secondary">/api</Badge>
                </div>
              }
            >
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <StatRow name="Hostname" value={strField(basic, "hostname") || "-"} />
                  <StatRow name="IP" value={((basic?.ips ?? []) as string[]).join(", ") || "-"} />
                  <StatRow name="OS / Kernel" value={`${strField(basic, "os") || "-"} / ${strField(basic, "kernel") || "-"}`} />
                </div>
                <div>
                  <StatRow name="Arch" value={strField(basic, "arch") || "-"} />
                  <StatRow
                    name="Hardware"
                    value={`${strField(basic, "hardwareVendor", "hardware_vendor") || "-"} ${strField(basic, "hardwareModel", "hardware_model") || ""}`.trim()}
                  />
                  <StatRow name="Last Seen" value={nsToTimeLabel(selectedNode.lastSeenUnixNano)} />
                </div>
              </div>
            </Section>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
              <TabsList className="grid w-full grid-cols-6 bg-white">
                <TabsTrigger value="cpu" className="text-xs"><Cpu className="h-4 w-4" /> CPU</TabsTrigger>
                <TabsTrigger value="gpu" className="text-xs"><Gauge className="h-4 w-4" /> GPU</TabsTrigger>
                <TabsTrigger value="memory" className="text-xs"><MemoryStick className="h-4 w-4" /> Memory</TabsTrigger>
                <TabsTrigger value="storage" className="text-xs"><HardDrive className="h-4 w-4" /> Storage</TabsTrigger>
                <TabsTrigger value="network" className="text-xs"><Network className="h-4 w-4" /> Network</TabsTrigger>
                <TabsTrigger value="process" className="text-xs"><Activity className="h-4 w-4" /> Process</TabsTrigger>
              </TabsList>

              <TabsContent value="cpu" className="mt-3 space-y-3">
                <Section title="CPU Static" icon={<Cpu className="h-4 w-4" />}>
                  <div className="grid gap-2 md:grid-cols-3">
                    <StatRow name="Vendor" value={strField(cpuStatic, "vendor") || "-"} />
                    <StatRow name="Model" value={strField(cpuStatic, "model") || "-"} />
                    <StatRow name="Packages" value={numField(cpuStatic, "packages")} />
                    <StatRow name="Physical Cores" value={numField(cpuStatic, "physicalCores", "physical_cores")} />
                    <StatRow name="Logical Cores" value={numField(cpuStatic, "logicalCores", "logical_cores")} />
                    <StatRow name="Threads/Core" value={numField(cpuStatic, "threadsPerCore", "threads_per_core")} />
                    <StatRow name="CPU Min" value={formatKHz(numField(cpuStatic, "cpuinfoMinKhz", "cpuinfo_min_khz"))} />
                    <StatRow name="CPU Max" value={formatKHz(numField(cpuStatic, "cpuinfoMaxKhz", "cpuinfo_max_khz"))} />
                    <StatRow
                      name="Capabilities"
                      value={`RAPL=${numField(cpuStatic, "supportsRapl", "supports_rapl") ? "yes" : "no"}, Uncore=${numField(cpuStatic, "supportsIntelUncore", "supports_intel_uncore") ? "yes" : "no"}`}
                    />
                  </div>

                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[760px] text-xs">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="border border-slate-200 px-2 py-1 text-left">Package</th>
                          <th className="border border-slate-200 px-2 py-1 text-left">Vendor</th>
                          <th className="border border-slate-200 px-2 py-1 text-left">Model</th>
                          <th className="border border-slate-200 px-2 py-1 text-left">Core IDs</th>
                          <th className="border border-slate-200 px-2 py-1 text-left">Core Count</th>
                          <th className="border border-slate-200 px-2 py-1 text-left">Thread Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cpuDevices.map((d, idx) => (
                          <tr key={`${numField(d, "packageId", "package_id")}-${idx}`}>
                            <td className="border border-slate-200 px-2 py-1">{numField(d, "packageId", "package_id")}</td>
                            <td className="border border-slate-200 px-2 py-1">{strField(d, "vendor") || "-"}</td>
                            <td className="border border-slate-200 px-2 py-1">{strField(d, "model") || "-"}</td>
                            <td className="border border-slate-200 px-2 py-1">{((d.coreIds ?? d.core_ids ?? []) as number[]).join(", ") || "-"}</td>
                            <td className="border border-slate-200 px-2 py-1">{numField(d, "coreCount", "core_count")}</td>
                            <td className="border border-slate-200 px-2 py-1">{numField(d, "threadCount", "thread_count")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Section>

                <Section title="CPU Controls" icon={<Thermometer className="h-4 w-4" />}>
                  <div className="grid gap-3 lg:grid-cols-2">
                    <div className="space-y-3 border border-slate-200 p-3">
                      <div className="text-sm font-medium">Scaling and Governor</div>
                      <div>
                        <div className="mb-1 text-xs text-slate-500">Package</div>
                        <Select value={cpuPackageTarget} onValueChange={setCpuPackageTarget}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Packages</SelectItem>
                            {cpuPackageIds.map((pkg) => (
                              <SelectItem key={pkg} value={String(pkg)}>Package {pkg}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <div className="mb-1 text-xs text-slate-500">Scaling Range {formatKHz(cpuRange[0])} ~ {formatKHz(cpuRange[1])}</div>
                        <Slider
                          min={cpuScaleMinBound}
                          max={cpuScaleMaxBound}
                          step={1000}
                          value={cpuRange}
                          onValueChange={(v) => setCpuRange([v[0] ?? cpuRange[0], v[1] ?? cpuRange[1]])}
                        />
                      </div>

                      <div>
                        <div className="mb-1 text-xs text-slate-500">Governor</div>
                        <Select value={cpuGovernor} onValueChange={setCpuGovernor}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {cpuGovernorOptions.map((g) => (
                              <SelectItem key={g} value={g}>{g}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          disabled={cmdPending}
                          onClick={() =>
                            sendCommand("cpu_scaling_range", {
                              minKhz: Math.round(cpuRange[0]),
                              maxKhz: Math.round(cpuRange[1]),
                              ...(cpuPackageTarget === "all" ? {} : { packageId: Number(cpuPackageTarget) }),
                            })
                          }
                        >
                          Apply Frequency
                        </Button>
                        <Button
                          variant="outline"
                          disabled={cmdPending}
                          onClick={() =>
                            sendCommand("cpu_governor", {
                              governor: cpuGovernor,
                              ...(cpuPackageTarget === "all" ? {} : { packageId: Number(cpuPackageTarget) }),
                            })
                          }
                        >
                          Apply Governor
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3 border border-slate-200 p-3">
                      <div className="text-sm font-medium">Uncore and RAPL</div>
                      <div>
                        <div className="mb-1 text-xs text-slate-500">Uncore Package</div>
                        <Select value={String(uncorePackage)} onValueChange={(v) => setUncorePackage(Number(v))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {cpuPackageIds.map((pkg) => (
                              <SelectItem key={pkg} value={String(pkg)}>Package {pkg}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <div className="mb-1 text-xs text-slate-500">Uncore Range {formatKHz(uncoreRange[0])} ~ {formatKHz(uncoreRange[1])}</div>
                        <Slider
                          min={maxOr(uncoreMin, 1)}
                          max={maxOr(uncoreMax, 1)}
                          step={1000}
                          value={uncoreRange}
                          onValueChange={(v) => setUncoreRange([v[0] ?? uncoreRange[0], v[1] ?? uncoreRange[1]])}
                        />
                      </div>

                      <div>
                        <div className="mb-1 text-xs text-slate-500">Power-Cap Package</div>
                        <Select value={String(cpuPowerPackage)} onValueChange={(v) => setCpuPowerPackage(Number(v))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {cpuPackageIds.map((pkg) => (
                              <SelectItem key={pkg} value={String(pkg)}>Package {pkg}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <div className="mb-1 text-xs text-slate-500">Power Cap {formatPowerMicroW(cpuPowerCap)}</div>
                        <Slider
                          min={maxOr(cpuPowerMin, 1_000_000)}
                          max={maxOr(cpuPowerMax, Math.max(cpuPowerCap, 400_000_000))}
                          step={1000}
                          value={[cpuPowerCap]}
                          onValueChange={(v) => setCpuPowerCap(v[0] ?? cpuPowerCap)}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          disabled={cmdPending}
                          onClick={() => sendCommand("cpu_uncore_range", { packageId: uncorePackage, minKhz: Math.round(uncoreRange[0]), maxKhz: Math.round(uncoreRange[1]) })}
                        >
                          Apply Uncore
                        </Button>
                        <Button
                          variant="outline"
                          disabled={cmdPending}
                          onClick={() => sendCommand("cpu_power_cap", { packageId: cpuPowerPackage, microwatt: Math.round(cpuPowerCap) })}
                        >
                          Apply Power Cap
                        </Button>
                      </div>
                    </div>
                  </div>

                  {cmdMsg ? <div className="mt-2 text-xs text-slate-600">{cmdMsg}</div> : null}
                </Section>

                <Section title="Per-Core Runtime (Dense)" icon={<Cpu className="h-4 w-4" />}>
                  <CpuCoreDenseTable rows={cpuCoreRows} />
                </Section>

                <div className="grid gap-3 lg:grid-cols-2">
                  <MetricChart title="CPU Utilization" yLabel="%" data={cpuUsageSeries} lines={[{ key: "utilPct", label: "Utilization", color: "#0f766e" }]} yDomain={[0, 100]} />
                  <MetricChart title="CPU Frequency" yLabel="MHz" data={cpuFreqSeries} lines={[{ key: "avgMHz", label: "Average", color: "#0369a1" }]} yDomain={[0, cpuScaleMaxBound / 1000]} />
                  <MetricChart title="CPU Temperature" yLabel="C" data={cpuTempSeries} lines={[{ key: "tempC", label: "Package Avg", color: "#dc2626" }]} yDomain={[0, cpuTempMaxBound]} />
                  <MetricChart title="CPU Package Power (RAPL delta)" yLabel="W" data={cpuPowerSeries} lines={[{ key: "powerW", label: "Power", color: "#7c3aed" }]} yDomain={[0, cpuPowerMaxBound]} />
                </div>

                <Section title="Current Package RAPL" icon={<Thermometer className="h-4 w-4" />}>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[620px] text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="border border-slate-200 px-2 py-1 text-left">Package</th>
                          <th className="border border-slate-200 px-2 py-1 text-left">Energy</th>
                          <th className="border border-slate-200 px-2 py-1 text-left">Current Cap</th>
                          <th className="border border-slate-200 px-2 py-1 text-left">Range</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cpuRapl.map((r) => {
                          const pkg = numField(r, "packageId", "package_id");
                          const control = staticControlByPackage.get(pkg);
                          return (
                            <tr key={`rapl-${pkg}`}>
                              <td className="border border-slate-200 px-2 py-1">{pkg}</td>
                              <td className="border border-slate-200 px-2 py-1">{formatNumber(numField(r, "energyMicroJ", "energy_micro_j") / 1_000_000)} J</td>
                              <td className="border border-slate-200 px-2 py-1">{formatPowerMicroW(numField(r, "powerCapMicroW", "power_cap_micro_w"))}</td>
                              <td className="border border-slate-200 px-2 py-1">
                                {numField(control, "powerCapMinMicroW", "power_cap_min_micro_w") > 0 || numField(control, "powerCapMaxMicroW", "power_cap_max_micro_w") > 0
                                  ? `${formatPowerMicroW(numField(control, "powerCapMinMicroW", "power_cap_min_micro_w"))} ~ ${formatPowerMicroW(numField(control, "powerCapMaxMicroW", "power_cap_max_micro_w"))}`
                                  : "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Section>
              </TabsContent>

              <TabsContent value="gpu" className="mt-3 space-y-3">
                <Section title="GPU Controls" icon={<Gauge className="h-4 w-4" />}>
                  <div className="grid gap-3 lg:grid-cols-2">
                    <div className="space-y-3 border border-slate-200 p-3">
                      <div className="text-sm font-medium">Clock Range</div>
                      <div>
                        <div className="mb-1 text-xs text-slate-500">GPU</div>
                        <Select value={String(gpuIndex)} onValueChange={(v) => setGpuIndex(Number(v))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {gpuStatic.map((g) => (
                              <SelectItem key={numField(g, "index")} value={String(numField(g, "index"))}>
                                GPU {numField(g, "index")} - {strField(g, "name") || "NVIDIA"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <div className="mb-1 text-xs text-slate-500">SM Clock {formatNumber(gpuSMRange[0])} ~ {formatNumber(gpuSMRange[1])} MHz</div>
                        <Slider
                          min={maxOr(numField(activeGPUStatic, "smClockMinMhz", "sm_clock_min_mhz"), 1)}
                          max={maxOr(numField(activeGPUStatic, "smClockMaxMhz", "sm_clock_max_mhz"), 1)}
                          step={1}
                          value={gpuSMRange}
                          onValueChange={(v) => setGpuSMRange([v[0] ?? gpuSMRange[0], v[1] ?? gpuSMRange[1]])}
                        />
                      </div>

                      <div>
                        <div className="mb-1 text-xs text-slate-500">Memory Clock {formatNumber(gpuMemRange[0])} ~ {formatNumber(gpuMemRange[1])} MHz</div>
                        <Slider
                          min={maxOr(numField(activeGPUStatic, "memClockMinMhz", "mem_clock_min_mhz"), 1)}
                          max={maxOr(numField(activeGPUStatic, "memClockMaxMhz", "mem_clock_max_mhz"), 1)}
                          step={1}
                          value={gpuMemRange}
                          onValueChange={(v) => setGpuMemRange([v[0] ?? gpuMemRange[0], v[1] ?? gpuMemRange[1]])}
                        />
                      </div>

                      <Button
                        disabled={cmdPending}
                        onClick={() =>
                          sendCommand("gpu_clock_range", {
                            gpuIndex,
                            smMinMhz: Math.round(gpuSMRange[0]),
                            smMaxMhz: Math.round(gpuSMRange[1]),
                            memMinMhz: Math.round(gpuMemRange[0]),
                            memMaxMhz: Math.round(gpuMemRange[1]),
                          })
                        }
                      >
                        Apply Clock Range
                      </Button>
                    </div>

                    <div className="space-y-3 border border-slate-200 p-3">
                      <div className="text-sm font-medium">Power Cap</div>
                      <div>
                        <div className="mb-1 text-xs text-slate-500">Power Cap {formatPowerMilliW(gpuPowerCap)}</div>
                        <Slider
                          min={maxOr(numField(activeGPUStatic, "powerMinMilliwatt", "power_min_milliwatt"), 30_000)}
                          max={maxOr(numField(activeGPUStatic, "powerMaxMilliwatt", "power_max_milliwatt"), 450_000)}
                          step={1}
                          value={[gpuPowerCap]}
                          onValueChange={(v) => setGpuPowerCap(v[0] ?? gpuPowerCap)}
                        />
                      </div>

                      <Button
                        variant="outline"
                        disabled={cmdPending}
                        onClick={() => sendCommand("gpu_power_cap", { gpuIndex, milliwatt: Math.round(gpuPowerCap) })}
                      >
                        Apply Power Cap
                      </Button>
                    </div>
                  </div>

                  {cmdMsg ? <div className="mt-2 text-xs text-slate-600">{cmdMsg}</div> : null}
                </Section>

                <Section title="GPU Static Devices" icon={<Gauge className="h-4 w-4" />}>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px] text-xs">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="border border-slate-200 px-2 py-1 text-left">Index</th>
                          <th className="border border-slate-200 px-2 py-1 text-left">Name</th>
                          <th className="border border-slate-200 px-2 py-1 text-left">UUID</th>
                          <th className="border border-slate-200 px-2 py-1 text-left">Memory Total</th>
                          <th className="border border-slate-200 px-2 py-1 text-left">Power Range</th>
                          <th className="border border-slate-200 px-2 py-1 text-left">SM Range</th>
                          <th className="border border-slate-200 px-2 py-1 text-left">MEM Range</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gpuStatic.map((g) => (
                          <tr key={`gpu-${numField(g, "index")}`}>
                            <td className="border border-slate-200 px-2 py-1">{numField(g, "index")}</td>
                            <td className="border border-slate-200 px-2 py-1">{strField(g, "name") || "-"}</td>
                            <td className="border border-slate-200 px-2 py-1">{strField(g, "uuid") || "-"}</td>
                            <td className="border border-slate-200 px-2 py-1">{formatBytes(numField(g, "memoryTotalBytes", "memory_total_bytes"))}</td>
                            <td className="border border-slate-200 px-2 py-1">{formatPowerMilliW(numField(g, "powerMinMilliwatt", "power_min_milliwatt"))} ~ {formatPowerMilliW(numField(g, "powerMaxMilliwatt", "power_max_milliwatt"))}</td>
                            <td className="border border-slate-200 px-2 py-1">{numField(g, "smClockMinMhz", "sm_clock_min_mhz")} ~ {numField(g, "smClockMaxMhz", "sm_clock_max_mhz")} MHz</td>
                            <td className="border border-slate-200 px-2 py-1">{numField(g, "memClockMinMhz", "mem_clock_min_mhz")} ~ {numField(g, "memClockMaxMhz", "mem_clock_max_mhz")} MHz</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Section>

                <div className="grid gap-3 lg:grid-cols-2">
                  <MetricChart title="GPU Utilization" yLabel="%" data={gpuUtilSeries} lines={[{ key: "gpuUtilPct", label: "GPU", color: "#0f766e" }, { key: "memUtilPct", label: "MEM", color: "#0ea5e9" }]} yDomain={[0, 100]} />
                  <MetricChart title="GPU Power" yLabel="W" data={gpuPowerSeries} lines={[{ key: "powerW", label: "Power", color: "#9333ea" }]} yDomain={[0, maxOr(numField(activeGPUStatic, "powerMaxMilliwatt", "power_max_milliwatt") / 1000, 450)]} />
                  <MetricChart title="GPU Clock" yLabel="MHz" data={gpuClockSeries} lines={[{ key: "smMHz", label: "SM", color: "#b45309" }, { key: "memMHz", label: "MEM", color: "#2563eb" }]} yDomain={[0, maxOr(Math.max(numField(activeGPUStatic, "smClockMaxMhz", "sm_clock_max_mhz"), numField(activeGPUStatic, "memClockMaxMhz", "mem_clock_max_mhz")), 1000)]} />
                </div>
              </TabsContent>

              <TabsContent value="memory" className="mt-3 space-y-3">
                <Section title="Memory Snapshot" icon={<MemoryStick className="h-4 w-4" />}>
                  <div className="grid gap-2 md:grid-cols-2">
                    <StatRow name="Total" value={formatBytes(numField(memoryMeta?.static, "totalBytes", "total_bytes"))} />
                    <StatRow name="Used" value={formatBytes(numField(memoryRaw, "usedBytes", "used_bytes"))} />
                    <StatRow name="Free" value={formatBytes(numField(memoryRaw, "freeBytes", "free_bytes"))} />
                    <StatRow name="Available" value={formatBytes(numField(memoryRaw, "availableBytes", "available_bytes"))} />
                    <StatRow name="Cached" value={formatBytes(numField(memoryRaw, "cachedBytes", "cached_bytes"))} />
                    <StatRow name="Buffers" value={formatBytes(numField(memoryRaw, "buffersBytes", "buffers_bytes"))} />
                  </div>
                </Section>

                <MetricChart
                  title="Memory Usage"
                  yLabel="GB"
                  data={memorySeries}
                  lines={[{ key: "usedGB", label: "Used", color: "#b91c1c" }, { key: "cachedGB", label: "Cached", color: "#0f766e" }]}
                  yDomain={[0, maxOr(numField(memoryMeta?.static, "totalBytes", "total_bytes") / 1024 / 1024 / 1024, 1)]}
                />
              </TabsContent>

              <TabsContent value="storage" className="mt-3 space-y-3">
                <Section title="Storage Snapshot" icon={<HardDrive className="h-4 w-4" />}>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-xs">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="border border-slate-200 px-2 py-1 text-left">Disk</th>
                          <th className="border border-slate-200 px-2 py-1 text-left">Mount</th>
                          <th className="border border-slate-200 px-2 py-1 text-left">FS</th>
                          <th className="border border-slate-200 px-2 py-1 text-left">Total</th>
                          <th className="border border-slate-200 px-2 py-1 text-left">Used</th>
                          <th className="border border-slate-200 px-2 py-1 text-left">Free</th>
                          <th className="border border-slate-200 px-2 py-1 text-left">Usage %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {((storageRaw?.disks ?? []) as Array<Record<string, any>>).map((d) => {
                          const used = numField(d, "usedBytes", "used_bytes");
                          const free = numField(d, "freeBytes", "free_bytes");
                          const total = used + free;
                          const staticInfo = ((storageMeta?.staticDisks ?? storageMeta?.static_disks ?? []) as Array<Record<string, any>>)
                            .find((s) => strField(s, "name") === strField(d, "name"));
                          return (
                            <tr key={`disk-${strField(d, "name")}`}>
                              <td className="border border-slate-200 px-2 py-1">{strField(d, "name") || "-"}</td>
                              <td className="border border-slate-200 px-2 py-1">{strField(staticInfo, "mountpoint") || "-"}</td>
                              <td className="border border-slate-200 px-2 py-1">{strField(staticInfo, "filesystem") || "-"}</td>
                              <td className="border border-slate-200 px-2 py-1">{formatBytes(total)}</td>
                              <td className="border border-slate-200 px-2 py-1">{formatBytes(used)}</td>
                              <td className="border border-slate-200 px-2 py-1">{formatBytes(free)}</td>
                              <td className="border border-slate-200 px-2 py-1">{total > 0 ? formatPercent((used * 100) / total) : "0 %"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Section>

                <div className="grid gap-3 lg:grid-cols-2">
                  <MetricChart title="Disk Throughput" yLabel="MB/s" data={storageBwSeries} lines={[{ key: "readMBps", label: "Read", color: "#0369a1" }, { key: "writeMBps", label: "Write", color: "#16a34a" }]} yDomain={[0, "auto"]} />
                  <MetricChart title="Disk IOPS" yLabel="ops/s" data={storageIopsSeries} lines={[{ key: "readIOPS", label: "Read", color: "#c2410c" }, { key: "writeIOPS", label: "Write", color: "#7e22ce" }]} yDomain={[0, "auto"]} />
                </div>
              </TabsContent>

              <TabsContent value="network" className="mt-3 space-y-3">
                <Section title="Network Snapshot" icon={<Network className="h-4 w-4" />}>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[780px] text-xs">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="border border-slate-200 px-2 py-1 text-left">Interface</th>
                          <th className="border border-slate-200 px-2 py-1 text-left">IPs</th>
                          <th className="border border-slate-200 px-2 py-1 text-left">RX Bytes</th>
                          <th className="border border-slate-200 px-2 py-1 text-left">TX Bytes</th>
                          <th className="border border-slate-200 px-2 py-1 text-left">RX Packets</th>
                          <th className="border border-slate-200 px-2 py-1 text-left">TX Packets</th>
                        </tr>
                      </thead>
                      <tbody>
                        {((networkRaw?.interfaces ?? []) as Array<Record<string, any>>).map((itf) => (
                          <tr key={`if-${strField(itf, "name")}`}>
                            <td className="border border-slate-200 px-2 py-1">{strField(itf, "name") || "-"}</td>
                            <td className="border border-slate-200 px-2 py-1">{((itf.ips ?? []) as string[]).join(", ") || "-"}</td>
                            <td className="border border-slate-200 px-2 py-1">{formatBytes(numField(itf, "rxBytes", "rx_bytes"))}</td>
                            <td className="border border-slate-200 px-2 py-1">{formatBytes(numField(itf, "txBytes", "tx_bytes"))}</td>
                            <td className="border border-slate-200 px-2 py-1">{formatNumber(numField(itf, "rxPackets", "rx_packets"), 0)}</td>
                            <td className="border border-slate-200 px-2 py-1">{formatNumber(numField(itf, "txPackets", "tx_packets"), 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Section>

                <MetricChart title="Network Throughput" yLabel="MB/s" data={networkSeries} lines={[{ key: "rxMBps", label: "RX", color: "#0f766e" }, { key: "txMBps", label: "TX", color: "#1d4ed8" }]} yDomain={[0, "auto"]} />
              </TabsContent>

              <TabsContent value="process" className="mt-3 space-y-3">
                <Section title="Process Table" icon={<Activity className="h-4 w-4" />}>
                  <div className="mb-2 text-xs text-slate-500">Ctld-style dense table: sticky header, sortable columns, one-line rows, horizontal scrolling, common signal actions.</div>
                  <ProcessTable
                    rows={processRows}
                    sortKey={procSortKey}
                    sortDir={procSortDir}
                    onSort={onSortProcess}
                    commandPending={cmdPending}
                    onSignal={(pid, signal) => sendCommand("process_signal", { pid, signal })}
                  />
                  {cmdMsg ? <div className="mt-2 text-xs text-slate-600">{cmdMsg}</div> : null}
                </Section>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
}
