"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  ChartLineDef,
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
    if (typeof value === "boolean") return value ? 1 : 0;
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

function formatIDRanges(ids: number[]): string {
  if (!ids || ids.length === 0) return "-";
  const sorted = Array.from(new Set(ids)).sort((a, b) => a - b);
  const segments: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i < sorted.length; i += 1) {
    const cur = sorted[i];
    if (cur === prev + 1) {
      prev = cur;
      continue;
    }
    segments.push(start === prev ? `${start}` : `${start}-${prev}`);
    start = cur;
    prev = cur;
  }
  segments.push(start === prev ? `${start}` : `${start}-${prev}`);
  return segments.join(", ");
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

const storageLinePalette = [
  "#0369a1",
  "#16a34a",
  "#9333ea",
  "#b45309",
  "#0f766e",
  "#dc2626",
  "#1d4ed8",
  "#a21caf",
];

export function DashboardShell() {
  const { wsConnected, nodes, history } = useTelemetryWS();

  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("memory");

  const [cmdPending, setCmdPending] = useState(false);
  const [cmdMsg, setCmdMsg] = useState("");

  const [cpuDeviceTab, setCpuDeviceTab] = useState("0");
  const [cpuRange, setCpuRange] = useState<[number, number]>([1_200_000, 3_500_000]);
  const [cpuGovernor, setCpuGovernor] = useState("performance");
  const [uncoreRange, setUncoreRange] = useState<[number, number]>([1_200_000, 3_500_000]);
  const [cpuPowerCap, setCpuPowerCap] = useState(120_000_000);

  const [gpuDeviceTab, setGpuDeviceTab] = useState("0");
  const [gpuSMRange, setGpuSMRange] = useState<[number, number]>([0, 0]);
  const [gpuMemRange, setGpuMemRange] = useState<[number, number]>([0, 0]);
  const [gpuPowerCap, setGpuPowerCap] = useState(120_000);

  const [procSortKey, setProcSortKey] = useState<ProcessSortKey>("pid");
  const [procSortDir, setProcSortDir] = useState<SortDir>("asc");

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
  const cpuUncoreNow = (cpuUltraRaw?.uncore ?? []) as Array<Record<string, any>>;
  const storageDisksRaw = (storageRaw?.disks ?? []) as Array<Record<string, any>>;
  const networkIfsRaw = (networkRaw?.interfaces ?? []) as Array<Record<string, any>>;
  const processRowsRaw = (processRaw?.processes ?? []) as Array<Record<string, any>>;

  const historyByCategory = history[selectedNodeId] ?? {};

  const cpuPackageIds = useMemo(() => {
    const ids = [
      ...cpuDevices.map((d) => numField(d, "packageId", "package_id")),
      ...cpuControls.map((c) => numField(c, "packageId", "package_id")),
    ].filter((v) => v >= 0);
    return Array.from(new Set(ids)).sort((a, b) => a - b);
  }, [cpuDevices, cpuControls]);

  const activeCpuPackageID = useMemo(() => {
    if (cpuPackageIds.length === 0) return -1;
    const v = Number(cpuDeviceTab);
    return cpuPackageIds.includes(v) ? v : cpuPackageIds[0];
  }, [cpuPackageIds, cpuDeviceTab]);

  const activeCpuDevice = useMemo(
    () => cpuDevices.find((d) => numField(d, "packageId", "package_id") === activeCpuPackageID) ?? null,
    [cpuDevices, activeCpuPackageID],
  );

  const activeCpuControl = useMemo(() => {
    if (activeCpuPackageID < 0) return null;
    return cpuControls.find((c) => numField(c, "packageId", "package_id") === activeCpuPackageID) ?? null;
  }, [cpuControls, activeCpuPackageID]);

  const cpuScaleMinBound = useMemo(() => {
    return (
      numField(
        activeCpuControl,
        "scalingHwMinKhz",
        "scaling_hw_min_khz",
        "scalingMinKhz",
        "scaling_min_khz",
      ) || 800_000
    );
  }, [activeCpuControl]);

  const cpuScaleMaxBound = useMemo(() => {
    return (
      numField(
        activeCpuControl,
        "scalingHwMaxKhz",
        "scaling_hw_max_khz",
        "scalingMaxKhz",
        "scaling_max_khz",
      ) || 5_000_000
    );
  }, [activeCpuControl]);

  const cpuGovernorOptions = useMemo(() => {
    const arr = (activeCpuControl?.availableGovernors ?? activeCpuControl?.available_governors ?? []) as string[];
    return arr.length > 0 ? arr : ["performance", "powersave"];
  }, [activeCpuControl]);

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
    if (cpuPackageIds.length === 0) return;
    if (!cpuPackageIds.includes(Number(cpuDeviceTab))) {
      setCpuDeviceTab(String(cpuPackageIds[0]));
    }
  }, [cpuPackageIds, cpuDeviceTab]);

  const uncoreControl = activeCpuControl;
  const activeUncoreMetric = useMemo(
    () => cpuUncoreNow.find((u) => numField(u, "packageId", "package_id") === activeCpuPackageID) ?? null,
    [cpuUncoreNow, activeCpuPackageID],
  );
  const uncoreRuntimeMin = numField(activeUncoreMetric, "minKhz", "min_khz");
  const uncoreRuntimeMax = numField(activeUncoreMetric, "maxKhz", "max_khz");
  const uncoreInitialMin = numField(activeUncoreMetric, "initialMinKhz", "initial_min_khz");
  const uncoreInitialMax = numField(activeUncoreMetric, "initialMaxKhz", "initial_max_khz");
  const uncoreMin = uncoreInitialMin || numField(uncoreControl, "uncoreMinKhz", "uncore_min_khz");
  const uncoreMax = uncoreInitialMax || numField(uncoreControl, "uncoreMaxKhz", "uncore_max_khz");
  const cpuSupportsUncore = numField(cpuStatic, "supportsIntelUncore", "supports_intel_uncore") > 0;
  const canControlUncore = uncoreMin > 0 && uncoreMax > uncoreMin;
  const uncoreSyncPackageRef = useRef<number>(-1);
  const uncoreSyncedRef = useRef(false);

  useEffect(() => {
    if (activeCpuPackageID < 0) return;
    if (uncoreSyncPackageRef.current !== activeCpuPackageID) {
      uncoreSyncPackageRef.current = activeCpuPackageID;
      uncoreSyncedRef.current = false;
    }
  }, [activeCpuPackageID]);

  useEffect(() => {
    if (!canControlUncore || uncoreSyncedRef.current) return;
    const runtimeMin = uncoreRuntimeMin > 0 ? uncoreRuntimeMin : uncoreMin;
    const runtimeMax = uncoreRuntimeMax > 0 ? uncoreRuntimeMax : uncoreMax;
    if (runtimeMax < runtimeMin || runtimeMin <= 0) return;
    const lo = clamp(runtimeMin, uncoreMin, uncoreMax);
    const hi = clamp(runtimeMax, uncoreMin, uncoreMax);
    const next: [number, number] = [Math.min(lo, hi), Math.max(lo, hi)];
    uncoreSyncedRef.current = true;
    if (next[0] !== uncoreRange[0] || next[1] !== uncoreRange[1]) {
      setUncoreRange(next);
    }
  }, [canControlUncore, uncoreRuntimeMin, uncoreRuntimeMax, uncoreMin, uncoreMax, uncoreRange]);

  useEffect(() => {
    if (!canControlUncore) return;
    const lo = clamp(uncoreRange[0], uncoreMin, uncoreMax);
    const hi = clamp(uncoreRange[1], uncoreMin, uncoreMax);
    const next: [number, number] = [Math.min(lo, hi), Math.max(lo, hi)];
    if (next[0] !== uncoreRange[0] || next[1] !== uncoreRange[1]) {
      setUncoreRange(next);
    }
  }, [canControlUncore, uncoreMin, uncoreMax, uncoreRange]);

  const powerControl = activeCpuControl;
  const cpuPowerMin = numField(powerControl, "powerCapMinMicroW", "power_cap_min_micro_w");
  const cpuPowerMax = numField(powerControl, "powerCapMaxMicroW", "power_cap_max_micro_w");
  const cpuPowerCurrent = numField(powerControl, "powerCapMicroW", "power_cap_micro_w");
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
  const cpuPowerSyncPackageRef = useRef<number>(-1);
  const cpuPowerSyncedRef = useRef(false);

  useEffect(() => {
    if (activeCpuPackageID < 0) return;
    if (cpuPowerSyncPackageRef.current !== activeCpuPackageID) {
      cpuPowerSyncPackageRef.current = activeCpuPackageID;
      cpuPowerSyncedRef.current = false;
      setCpuPowerCap((prev) => clamp(prev || cpuPowerSliderMin, cpuPowerSliderMin, cpuPowerSliderMax));
    }
  }, [activeCpuPackageID, cpuPowerSliderMin, cpuPowerSliderMax]);

  useEffect(() => {
    if (activeCpuPackageID < 0 || cpuPowerSyncedRef.current) return;
    if (cpuPowerCurrent <= 0) return;
    cpuPowerSyncedRef.current = true;
    setCpuPowerCap(clamp(cpuPowerCurrent, cpuPowerSliderMin, cpuPowerSliderMax));
  }, [activeCpuPackageID, cpuPowerCurrent, cpuPowerSliderMin, cpuPowerSliderMax]);

  useEffect(() => {
    setCpuPowerCap((prev) => {
      const next = clamp(prev, cpuPowerSliderMin, cpuPowerSliderMax);
      return Math.abs(next - prev) > 1 ? next : prev;
    });
  }, [cpuPowerSliderMin, cpuPowerSliderMax]);

  const gpuIndexes = gpuStatic.map((g) => numField(g, "index"));
  const activeGPUIndex = useMemo(() => {
    if (gpuIndexes.length === 0) return -1;
    const v = Number(gpuDeviceTab);
    return gpuIndexes.includes(v) ? v : gpuIndexes[0];
  }, [gpuIndexes, gpuDeviceTab]);
  const activeGPUStatic = gpuStatic.find((g) => numField(g, "index") === activeGPUIndex) ?? gpuStatic[0] ?? null;

  const gpuDevicesFast = (gpuFastRaw?.devices ?? []) as Array<Record<string, any>>;
  const activeGPUFast =
    gpuDevicesFast.find((g) => numField(g, "index") === activeGPUIndex) ?? gpuDevicesFast[0] ?? null;
  const gpuPowerMinRaw = numField(activeGPUStatic, "powerMinMilliwatt", "power_min_milliwatt");
  const gpuPowerMaxRaw = numField(activeGPUStatic, "powerMaxMilliwatt", "power_max_milliwatt");
  const gpuPowerCurrent = numField(activeGPUFast, "powerLimitMilliwatt", "power_limit_milliwatt");
  const gpuSMMinRaw = numField(activeGPUStatic, "smClockMinMhz", "sm_clock_min_mhz");
  const gpuSMMaxRaw = numField(activeGPUStatic, "smClockMaxMhz", "sm_clock_max_mhz");
  const gpuMemMinRaw = numField(activeGPUStatic, "memClockMinMhz", "mem_clock_min_mhz");
  const gpuMemMaxRaw = numField(activeGPUStatic, "memClockMaxMhz", "mem_clock_max_mhz");
  const gpuCanTuneSM = gpuSMMinRaw > 0 && gpuSMMaxRaw > gpuSMMinRaw;
  const gpuCanTuneMem = gpuMemMinRaw > 0 && gpuMemMaxRaw > gpuMemMinRaw;
  const gpuPowerMinBound = useMemo(() => {
    if (gpuPowerMinRaw > 0) return gpuPowerMinRaw;
    return 30_000;
  }, [gpuPowerMinRaw]);
  const gpuPowerMaxBound = useMemo(() => {
    if (gpuPowerMaxRaw > 0) return Math.max(gpuPowerMaxRaw, gpuPowerMinBound);
    if (gpuPowerCurrent > 0) return Math.max(gpuPowerCurrent, gpuPowerMinBound);
    return Math.max(450_000, gpuPowerMinBound);
  }, [gpuPowerMaxRaw, gpuPowerCurrent, gpuPowerMinBound]);
  const gpuPowerSyncDeviceRef = useRef<number>(-1);
  const gpuPowerSyncedRef = useRef(false);

  useEffect(() => {
    if (gpuIndexes.length === 0) return;
    if (!gpuIndexes.includes(Number(gpuDeviceTab))) setGpuDeviceTab(String(gpuIndexes[0]));
  }, [gpuIndexes, gpuDeviceTab]);

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

  useEffect(() => {
    if (activeTab.startsWith("cpu:") && activeCpuPackageID >= 0) {
      const key = `cpu:${activeCpuPackageID}`;
      if (activeTab !== key) setActiveTab(key);
    }
    if (activeTab.startsWith("gpu:") && activeGPUIndex >= 0) {
      const key = `gpu:${activeGPUIndex}`;
      if (activeTab !== key) setActiveTab(key);
    }
  }, [activeTab, activeCpuPackageID, activeGPUIndex]);

  useEffect(() => {
    if (!activeGPUStatic) return;
    if (gpuCanTuneSM) {
      const lo = clamp(gpuSMRange[0] || gpuSMMinRaw, gpuSMMinRaw, gpuSMMaxRaw);
      const hi = clamp(gpuSMRange[1] || gpuSMMaxRaw, gpuSMMinRaw, gpuSMMaxRaw);
      const next: [number, number] = [Math.min(lo, hi), Math.max(lo, hi)];
      if (next[0] !== gpuSMRange[0] || next[1] !== gpuSMRange[1]) setGpuSMRange(next);
    } else if (gpuSMRange[0] !== 0 || gpuSMRange[1] !== 0) {
      setGpuSMRange([0, 0]);
    }

    if (gpuCanTuneMem) {
      const lo = clamp(gpuMemRange[0] || gpuMemMinRaw, gpuMemMinRaw, gpuMemMaxRaw);
      const hi = clamp(gpuMemRange[1] || gpuMemMaxRaw, gpuMemMinRaw, gpuMemMaxRaw);
      const next: [number, number] = [Math.min(lo, hi), Math.max(lo, hi)];
      if (next[0] !== gpuMemRange[0] || next[1] !== gpuMemRange[1]) setGpuMemRange(next);
    } else if (gpuMemRange[0] !== 0 || gpuMemRange[1] !== 0) {
      setGpuMemRange([0, 0]);
    }
  }, [
    activeGPUStatic,
    gpuCanTuneSM,
    gpuCanTuneMem,
    gpuSMMinRaw,
    gpuSMMaxRaw,
    gpuMemMinRaw,
    gpuMemMaxRaw,
    gpuSMRange,
    gpuMemRange,
  ]);

  useEffect(() => {
    if (activeGPUIndex < 0) return;
    if (gpuPowerSyncDeviceRef.current !== activeGPUIndex) {
      gpuPowerSyncDeviceRef.current = activeGPUIndex;
      gpuPowerSyncedRef.current = false;
      setGpuPowerCap((prev) => clamp(prev || gpuPowerMinBound, gpuPowerMinBound, gpuPowerMaxBound));
    }
  }, [activeGPUIndex, gpuPowerMinBound, gpuPowerMaxBound]);

  useEffect(() => {
    if (activeGPUIndex < 0 || gpuPowerSyncedRef.current) return;
    const current = numField(activeGPUFast, "powerLimitMilliwatt", "power_limit_milliwatt");
    if (current <= 0) return;
    gpuPowerSyncedRef.current = true;
    setGpuPowerCap(clamp(current, gpuPowerMinBound, gpuPowerMaxBound));
  }, [activeGPUIndex, activeGPUFast, gpuPowerMinBound, gpuPowerMaxBound]);

  useEffect(() => {
    setGpuPowerCap((prev) => {
      const next = clamp(prev, gpuPowerMinBound, gpuPowerMaxBound);
      return Math.abs(next - prev) > 1 ? next : prev;
    });
  }, [gpuPowerMinBound, gpuPowerMaxBound]);

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
      .filter((core) => numField(core, "packageId", "package_id") === activeCpuPackageID)
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
  }, [cpuCores, dynamicPerCoreConfigByPackage, staticControlByPackage, tempByPackage, activeCpuPackageID]);

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
      const perPkg = cores.filter((c) => numField(c, "packageId", "package_id") === activeCpuPackageID);
      const utilAvg = perPkg.length > 0
        ? perPkg.reduce((acc, c) => acc + numField(c, "utilization") * 100, 0) / perPkg.length
        : 0;
      return { tsNs: item.atNs.toString(), time: nsToTimeLabel(item.atNs), utilPct: utilAvg };
    });
  }, [historyByCategory.cpu_medium, activeCpuPackageID]);

  const cpuFreqSeries = useMemo(() => {
    const list = historyByCategory.cpu_medium ?? [];
    return list.map((item) => {
      const payload = item.sample.cpuMediumMetrics ?? item.sample.cpu_medium_metrics ?? {};
      const cores = (payload.cores ?? []) as Array<Record<string, any>>;
      const perPkg = cores.filter((c) => numField(c, "packageId", "package_id") === activeCpuPackageID);
      const avgMHz = perPkg.length > 0
        ? perPkg.reduce((acc, c) => acc + numField(c, "scalingCurKhz", "scaling_cur_khz"), 0) / perPkg.length / 1000
        : 0;
      return { tsNs: item.atNs.toString(), time: nsToTimeLabel(item.atNs), avgMHz };
    });
  }, [historyByCategory.cpu_medium, activeCpuPackageID]);

  const cpuTempSeries = useMemo(() => {
    const list = historyByCategory.cpu_medium ?? [];
    return list.map((item) => {
      const payload = item.sample.cpuMediumMetrics ?? item.sample.cpu_medium_metrics ?? {};
      const temps = (payload.temperatures ?? []) as Array<Record<string, any>>;
      const temp = temps.find((t) => numField(t, "packageId", "package_id") === activeCpuPackageID) ?? null;
      return {
        tsNs: item.atNs.toString(),
        time: nsToTimeLabel(item.atNs),
        tempC: numField(temp, "milliC", "milli_c") / 1000,
      };
    });
  }, [historyByCategory.cpu_medium, activeCpuPackageID]);

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

      const curPkg = curRapl.find((c) => numField(c, "packageId", "package_id") === activeCpuPackageID);
      const prevPkg = curPkg ? prevByPkg.get(activeCpuPackageID) : null;
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
  }, [historyByCategory.cpu_ultra_fast, activeCpuPackageID]);

  const cpuUncoreSeries = useMemo(() => {
    const list = historyByCategory.cpu_ultra_fast ?? [];
    return list.map((item) => {
      const payload = item.sample.cpuUltraMetrics ?? item.sample.cpu_ultra_metrics ?? {};
      const uncore = (payload.uncore ?? []) as Array<Record<string, any>>;
      const pkg = uncore.find((u) => numField(u, "packageId", "package_id") === activeCpuPackageID) ?? null;
      const currentMHz = numField(pkg, "currentKhz", "current_khz") / 1000;
      return { tsNs: item.atNs.toString(), time: nsToTimeLabel(item.atNs), currentMHz };
    });
  }, [historyByCategory.cpu_ultra_fast, activeCpuPackageID]);
  const hasUncoreSample = useMemo(
    () => cpuUncoreSeries.some((row) => numField(row, "currentMHz") > 0),
    [cpuUncoreSeries],
  );
  const showUncore = cpuSupportsUncore || canControlUncore || hasUncoreSample;

  const gpuUtilSeries = useMemo(() => {
    const list = historyByCategory.gpu_fast ?? [];
    return list.map((item) => {
      const devices = ((item.sample.gpuFastMetrics ?? item.sample.gpu_fast_metrics ?? {}).devices ?? []) as Array<Record<string, any>>;
      const dev = devices.find((d) => numField(d, "index") === activeGPUIndex) ?? null;
      const gpuUtil = numField(dev, "utilizationGpu", "utilization_gpu");
      const memUtil = numField(dev, "utilizationMem", "utilization_mem");
      return { tsNs: item.atNs.toString(), time: nsToTimeLabel(item.atNs), gpuUtilPct: gpuUtil, memUtilPct: memUtil };
    });
  }, [historyByCategory.gpu_fast, activeGPUIndex]);

  const gpuPowerSeries = useMemo(() => {
    const list = historyByCategory.gpu_fast ?? [];
    return list.map((item) => {
      const devices = ((item.sample.gpuFastMetrics ?? item.sample.gpu_fast_metrics ?? {}).devices ?? []) as Array<Record<string, any>>;
      const dev = devices.find((d) => numField(d, "index") === activeGPUIndex) ?? null;
      const powerW = numField(dev, "powerUsageMilliwatt", "power_usage_milliwatt") / 1000;
      return { tsNs: item.atNs.toString(), time: nsToTimeLabel(item.atNs), powerW };
    });
  }, [historyByCategory.gpu_fast, activeGPUIndex]);

  const gpuClockSeries = useMemo(() => {
    const list = historyByCategory.gpu_fast ?? [];
    return list.map((item) => {
      const devices = ((item.sample.gpuFastMetrics ?? item.sample.gpu_fast_metrics ?? {}).devices ?? []) as Array<Record<string, any>>;
      const dev = devices.find((d) => numField(d, "index") === activeGPUIndex) ?? null;
      const smMHz = numField(dev, "graphicsClockMhz", "graphics_clock_mhz");
      const memMHz = numField(dev, "memoryClockMhz", "memory_clock_mhz");
      return { tsNs: item.atNs.toString(), time: nsToTimeLabel(item.atNs), smMHz, memMHz };
    });
  }, [historyByCategory.gpu_fast, activeGPUIndex]);

  const memorySeries = useMemo(() => {
    const list = historyByCategory.memory ?? [];
    return list.map((item) => {
      const m = item.sample.memoryMetrics ?? item.sample.memory_metrics ?? {};
      return {
        tsNs: item.atNs.toString(),
        time: nsToTimeLabel(item.atNs),
        usedGB: numField(m, "usedBytes", "used_bytes") / 1024 / 1024 / 1024,
        cachedGB: numField(m, "cachedBytes", "cached_bytes") / 1024 / 1024 / 1024,
      };
    });
  }, [historyByCategory.memory]);

  const networkInterfaceNames = useMemo(() => {
    const names = new Set<string>();
    for (const ifc of networkIfsRaw) {
      const name = strField(ifc, "name");
      if (name) names.add(name);
    }
    for (const item of historyByCategory.network ?? []) {
      const ifs = ((item.sample.networkMetrics ?? item.sample.network_metrics ?? {}).interfaces ?? []) as Array<Record<string, any>>;
      for (const itf of ifs) {
        const name = strField(itf, "name");
        if (name) names.add(name);
      }
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [networkIfsRaw, historyByCategory.network]);

  const networkRxLines = useMemo<ChartLineDef[]>(
    () =>
      networkInterfaceNames.map((name, idx) => ({
        key: `if_rx_mb_${idx}`,
        label: name,
        color: storageLinePalette[idx % storageLinePalette.length],
      })),
    [networkInterfaceNames],
  );

  const networkTxLines = useMemo<ChartLineDef[]>(
    () =>
      networkInterfaceNames.map((name, idx) => ({
        key: `if_tx_mb_${idx}`,
        label: name,
        color: storageLinePalette[idx % storageLinePalette.length],
      })),
    [networkInterfaceNames],
  );

  const networkPerIfSeries = useMemo(() => {
    const list = historyByCategory.network ?? [];
    if (networkInterfaceNames.length === 0) return [] as Array<Record<string, number | string>>;

    const ifIndex = new Map<string, number>();
    for (let i = 0; i < networkInterfaceNames.length; i += 1) {
      ifIndex.set(networkInterfaceNames[i], i);
    }

    const rows: Array<Record<string, number | string>> = [];
    for (let i = 1; i < list.length; i += 1) {
      const prev = list[i - 1];
      const cur = list[i];
      const prevIfs = ((prev.sample.networkMetrics ?? prev.sample.network_metrics ?? {}).interfaces ?? []) as Array<Record<string, any>>;
      const curIfs = ((cur.sample.networkMetrics ?? cur.sample.network_metrics ?? {}).interfaces ?? []) as Array<Record<string, any>>;

      const prevByName = new Map<string, Record<string, any>>();
      for (const p of prevIfs) prevByName.set(strField(p, "name"), p);

      const row: Record<string, number | string> = {
        tsNs: cur.atNs.toString(),
        time: nsToTimeLabel(cur.atNs),
      };
      for (const c of curIfs) {
        const name = strField(c, "name");
        const idx = ifIndex.get(name);
        if (idx === undefined) continue;
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
        if (rxRate !== null) row[`if_rx_mb_${idx}`] = rxRate / 1024 / 1024;
        if (txRate !== null) row[`if_tx_mb_${idx}`] = txRate / 1024 / 1024;
      }

      rows.push(row);
    }
    return rows;
  }, [historyByCategory.network, networkInterfaceNames]);

  const storageDiskNames = useMemo(() => {
    const names = new Set<string>();
    for (const disk of storageDisksRaw) {
      const name = strField(disk, "name");
      if (name) names.add(name);
    }
    for (const item of historyByCategory.storage ?? []) {
      const disks = ((item.sample.storageMetrics ?? item.sample.storage_metrics ?? {}).disks ?? []) as Array<Record<string, any>>;
      for (const d of disks) {
        const name = strField(d, "name");
        if (name) names.add(name);
      }
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [storageDisksRaw, historyByCategory.storage]);

  const storageReadThroughputLines = useMemo<ChartLineDef[]>(
    () =>
      storageDiskNames.map((name, idx) => ({
        key: `disk_read_mb_${idx}`,
        label: name,
        color: storageLinePalette[idx % storageLinePalette.length],
      })),
    [storageDiskNames],
  );

  const storageWriteThroughputLines = useMemo<ChartLineDef[]>(
    () =>
      storageDiskNames.map((name, idx) => ({
        key: `disk_write_mb_${idx}`,
        label: name,
        color: storageLinePalette[idx % storageLinePalette.length],
      })),
    [storageDiskNames],
  );

  const storageReadIopsLines = useMemo<ChartLineDef[]>(
    () =>
      storageDiskNames.map((name, idx) => ({
        key: `disk_read_iops_${idx}`,
        label: name,
        color: storageLinePalette[idx % storageLinePalette.length],
      })),
    [storageDiskNames],
  );

  const storageWriteIopsLines = useMemo<ChartLineDef[]>(
    () =>
      storageDiskNames.map((name, idx) => ({
        key: `disk_write_iops_${idx}`,
        label: name,
        color: storageLinePalette[idx % storageLinePalette.length],
      })),
    [storageDiskNames],
  );

  const storagePerDiskSeries = useMemo(() => {
    const list = historyByCategory.storage ?? [];
    if (storageDiskNames.length === 0) return [] as Array<Record<string, number | string>>;

    const diskIndex = new Map<string, number>();
    for (let i = 0; i < storageDiskNames.length; i += 1) {
      diskIndex.set(storageDiskNames[i], i);
    }

    const rows: Array<Record<string, number | string>> = [];
    for (let i = 1; i < list.length; i += 1) {
      const prev = list[i - 1];
      const cur = list[i];
      const prevDisks = ((prev.sample.storageMetrics ?? prev.sample.storage_metrics ?? {}).disks ?? []) as Array<Record<string, any>>;
      const curDisks = ((cur.sample.storageMetrics ?? cur.sample.storage_metrics ?? {}).disks ?? []) as Array<Record<string, any>>;

      const prevByName = new Map<string, Record<string, any>>();
      for (const p of prevDisks) prevByName.set(strField(p, "name"), p);

      const row: Record<string, number | string> = {
        tsNs: cur.atNs.toString(),
        time: nsToTimeLabel(cur.atNs),
      };

      for (const c of curDisks) {
        const name = strField(c, "name");
        const idx = diskIndex.get(name);
        if (idx === undefined) continue;
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
        if (readSectorsRate !== null) row[`disk_read_mb_${idx}`] = (readSectorsRate * 512) / 1024 / 1024;
        if (writeSectorsRate !== null) row[`disk_write_mb_${idx}`] = (writeSectorsRate * 512) / 1024 / 1024;
        if (readRate !== null) row[`disk_read_iops_${idx}`] = readRate;
        if (writeRate !== null) row[`disk_write_iops_${idx}`] = writeRate;
      }
      rows.push(row);
    }
    return rows;
  }, [historyByCategory.storage, storageDiskNames]);

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

  const activeCpuRapl = useMemo(
    () => cpuRapl.find((r) => numField(r, "packageId", "package_id") === activeCpuPackageID) ?? null,
    [cpuRapl, activeCpuPackageID],
  );

  const cpuChartSuffix = `${selectedNodeId || "node"}-pkg${activeCpuPackageID}`;
  const gpuChartSuffix = `${selectedNodeId || "node"}-gpu${activeGPUIndex}`;

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

  const storageRows = useMemo(
    () =>
      [...storageDisksRaw].sort((a, b) =>
        strField(a, "name").localeCompare(strField(b, "name")),
      ),
    [storageDisksRaw],
  );

  const networkRows = useMemo(
    () =>
      [...networkIfsRaw].sort((a, b) =>
        strField(a, "name").localeCompare(strField(b, "name")),
      ),
    [networkIfsRaw],
  );

  const onSortProcess = (key: ProcessSortKey) => {
    if (procSortKey === key) {
      setProcSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setProcSortKey(key);
    setProcSortDir(key === "command" || key === "user" || key === "state" ? "asc" : "desc");
  };

  const onChangeTopTab = (value: string) => {
    setActiveTab(value);
    if (value.startsWith("cpu:")) {
      const pkg = value.slice(4);
      if (pkg) setCpuDeviceTab(pkg);
      return;
    }
    if (value.startsWith("gpu:")) {
      const idx = value.slice(4);
      if (idx) setGpuDeviceTab(idx);
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
                <TabsTrigger value="memory" className="text-xs"><MemoryStick className="h-4 w-4" /> Memory</TabsTrigger>
                <TabsTrigger value="storage" className="text-xs"><HardDrive className="h-4 w-4" /> Storage</TabsTrigger>
                <TabsTrigger value="network" className="text-xs"><Network className="h-4 w-4" /> Network</TabsTrigger>
                <TabsTrigger value="process" className="text-xs"><Activity className="h-4 w-4" /> Process</TabsTrigger>
              </TabsList>

              <TabsContent value={`cpu:${activeCpuPackageID}`} className="mt-3 space-y-3">
                {activeCpuPackageID < 0 ? (
                  <Section title="CPU Device" icon={<Cpu className="h-4 w-4" />}>
                    <div className="text-sm text-slate-500">No CPU package discovered.</div>
                  </Section>
                ) : (
                  <>
                    <Section title={`CPU ${activeCpuPackageID} Static`} icon={<Cpu className="h-4 w-4" />}>
                      <div className="grid gap-2 md:grid-cols-2">
                        <StatRow name="Vendor" value={strField(activeCpuDevice, "vendor") || strField(cpuStatic, "vendor") || "-"} />
                        <StatRow name="Model" value={strField(activeCpuDevice, "model") || strField(cpuStatic, "model") || "-"} />
                        <StatRow name="Core Count" value={numField(activeCpuDevice, "coreCount", "core_count")} />
                        <StatRow name="Thread Count" value={numField(activeCpuDevice, "threadCount", "thread_count")} />
                        <StatRow name="Threads/Core" value={numField(cpuStatic, "threadsPerCore", "threads_per_core")} />
                        <StatRow name="Scale HW Min" value={formatKHz(numField(activeCpuControl, "scalingHwMinKhz", "scaling_hw_min_khz"))} />
                        <StatRow name="Scale HW Max" value={formatKHz(numField(activeCpuControl, "scalingHwMaxKhz", "scaling_hw_max_khz"))} />
                        <StatRow name="Core IDs" value={formatIDRanges((activeCpuDevice?.coreIds ?? activeCpuDevice?.core_ids ?? []) as number[])} />
                      </div>
                    </Section>

                    <Section title={`CPU ${activeCpuPackageID} Controls`} icon={<Thermometer className="h-4 w-4" />}>
                      <div className="grid gap-3 lg:grid-cols-2">
                        <div className="space-y-3 border border-slate-200 p-3">
                          <div className="text-sm font-medium">Scaling and Governor</div>
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
                                  packageId: activeCpuPackageID,
                                  minKhz: Math.round(cpuRange[0]),
                                  maxKhz: Math.round(cpuRange[1]),
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
                                  packageId: activeCpuPackageID,
                                  governor: cpuGovernor,
                                })
                              }
                            >
                              Apply Governor
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-3 border border-slate-200 p-3">
                          <div className="text-sm font-medium">{showUncore ? "Uncore and RAPL" : "RAPL"}</div>
                          {showUncore ? (
                            <div>
                              <div className="mb-1 text-xs text-slate-500">Uncore Range {formatKHz(uncoreRange[0])} ~ {formatKHz(uncoreRange[1])}</div>
                              <Slider
                                min={maxOr(uncoreMin, 1)}
                                max={maxOr(uncoreMax, 1)}
                                step={1000}
                                value={uncoreRange}
                                onValueChange={(v) => setUncoreRange([v[0] ?? uncoreRange[0], v[1] ?? uncoreRange[1]])}
                                disabled={!canControlUncore}
                              />
                            </div>
                          ) : null}

                          <div>
                            <div className="mb-1 text-xs text-slate-500">Power Cap {formatPowerMicroW(cpuPowerCap)}</div>
                            <Slider
                              min={cpuPowerSliderMin}
                              max={cpuPowerSliderMax}
                              step={1000}
                              value={[cpuPowerCap]}
                              onValueChange={(v) => setCpuPowerCap(v[0] ?? cpuPowerCap)}
                            />
                          </div>

                          <div className="flex gap-2">
                            {showUncore ? (
                              <Button
                                variant="outline"
                                disabled={cmdPending || !canControlUncore}
                                onClick={() => sendCommand("cpu_uncore_range", { packageId: activeCpuPackageID, minKhz: Math.round(uncoreRange[0]), maxKhz: Math.round(uncoreRange[1]) })}
                              >
                                Apply Uncore
                              </Button>
                            ) : null}
                            <Button
                              variant="outline"
                              disabled={cmdPending || activeCpuPackageID < 0}
                              onClick={() => sendCommand("cpu_power_cap", { packageId: activeCpuPackageID, microwatt: Math.round(clamp(cpuPowerCap, cpuPowerSliderMin, cpuPowerSliderMax)) })}
                            >
                              Apply Power Cap
                            </Button>
                          </div>
                        </div>
                      </div>

                      {cmdMsg ? <div className="mt-2 text-xs text-slate-600">{cmdMsg}</div> : null}
                    </Section>

                    <Section title={`CPU ${activeCpuPackageID} Per-Core Runtime`} icon={<Cpu className="h-4 w-4" />}>
                      <CpuCoreDenseTable rows={cpuCoreRows} />
                    </Section>

                    <div className="grid gap-3 lg:grid-cols-2">
                      <MetricChart chartId={`cpu-utilization-${cpuChartSuffix}`} title={`CPU ${activeCpuPackageID} Utilization`} yLabel="%" data={cpuUsageSeries} lines={[{ key: "utilPct", label: "Utilization", color: "#0f766e" }]} yDomain={[0, 100]} />
                      <MetricChart chartId={`cpu-frequency-${cpuChartSuffix}`} title={`CPU ${activeCpuPackageID} Frequency`} yLabel="MHz" data={cpuFreqSeries} lines={[{ key: "avgMHz", label: "Average", color: "#0369a1" }]} yDomain={[0, cpuScaleMaxBound / 1000]} />
                      {showUncore ? (
                        <MetricChart chartId={`cpu-uncore-frequency-${cpuChartSuffix}`} title={`CPU ${activeCpuPackageID} Uncore Frequency`} yLabel="MHz" data={cpuUncoreSeries} lines={[{ key: "currentMHz", label: "Uncore", color: "#15803d" }]} yDomain={[0, cpuUncoreMaxBound]} />
                      ) : null}
                      <MetricChart chartId={`cpu-temperature-${cpuChartSuffix}`} title={`CPU ${activeCpuPackageID} Temperature`} yLabel="C" data={cpuTempSeries} lines={[{ key: "tempC", label: "Temperature", color: "#dc2626" }]} yDomain={[0, cpuTempMaxBound]} />
                      <MetricChart chartId={`cpu-package-power-${cpuChartSuffix}`} title={`CPU ${activeCpuPackageID} Package Power`} yLabel="W" data={cpuPowerSeries} lines={[{ key: "powerW", label: "Power", color: "#7c3aed" }]} yDomain={[0, cpuPowerMaxBound]} />
                    </div>

                    <Section title={`CPU ${activeCpuPackageID} RAPL`} icon={<Thermometer className="h-4 w-4" />}>
                      <div className="grid gap-2 md:grid-cols-2">
                        <StatRow name="Energy" value={`${formatNumber(numField(activeCpuRapl, "energyMicroJ", "energy_micro_j") / 1_000_000)} J`} />
                        <StatRow name="Current Cap" value={formatPowerMicroW(numField(activeCpuRapl, "powerCapMicroW", "power_cap_micro_w"))} />
                        <StatRow
                          name="Cap Range"
                          value={
                            numField(activeCpuControl, "powerCapMinMicroW", "power_cap_min_micro_w") > 0 || numField(activeCpuControl, "powerCapMaxMicroW", "power_cap_max_micro_w") > 0
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
                )}
              </TabsContent>

              <TabsContent value={`gpu:${activeGPUIndex}`} className="mt-3 space-y-3">
                {activeGPUIndex < 0 ? (
                  <Section title="GPU Device" icon={<Gauge className="h-4 w-4" />}>
                    <div className="text-sm text-slate-500">No NVIDIA GPU discovered.</div>
                  </Section>
                ) : (
                  <>
                    <Section title={`GPU ${activeGPUIndex} Controls`} icon={<Gauge className="h-4 w-4" />}>
                      <div className="grid gap-3 lg:grid-cols-2">
                        <div className="space-y-3 border border-slate-200 p-3">
                          <div className="text-sm font-medium">Clock Range</div>
                          {gpuCanTuneSM ? (
                            <div>
                              <div className="mb-1 text-xs text-slate-500">SM Clock {formatNumber(gpuSMRange[0])} ~ {formatNumber(gpuSMRange[1])} MHz</div>
                              <Slider
                                min={maxOr(gpuSMMinRaw, 1)}
                                max={maxOr(gpuSMMaxRaw, 1)}
                                step={1}
                                value={gpuSMRange}
                                onValueChange={(v) => setGpuSMRange([v[0] ?? gpuSMRange[0], v[1] ?? gpuSMRange[1]])}
                              />
                            </div>
                          ) : null}

                          {gpuCanTuneMem ? (
                            <div>
                              <div className="mb-1 text-xs text-slate-500">Memory Clock {formatNumber(gpuMemRange[0])} ~ {formatNumber(gpuMemRange[1])} MHz</div>
                              <Slider
                                min={maxOr(gpuMemMinRaw, 1)}
                                max={maxOr(gpuMemMaxRaw, 1)}
                                step={1}
                                value={gpuMemRange}
                                onValueChange={(v) => setGpuMemRange([v[0] ?? gpuMemRange[0], v[1] ?? gpuMemRange[1]])}
                              />
                            </div>
                          ) : null}

                          {!gpuCanTuneSM && !gpuCanTuneMem ? (
                            <div className="text-xs text-slate-500">Clock range control unsupported on this GPU.</div>
                          ) : null}

                          <Button
                            disabled={cmdPending || (!gpuCanTuneSM && !gpuCanTuneMem)}
                            onClick={() =>
                              sendCommand("gpu_clock_range", {
                                gpuIndex: activeGPUIndex,
                                smMinMhz: gpuCanTuneSM ? Math.round(gpuSMRange[0]) : 0,
                                smMaxMhz: gpuCanTuneSM ? Math.round(gpuSMRange[1]) : 0,
                                memMinMhz: gpuCanTuneMem ? Math.round(gpuMemRange[0]) : 0,
                                memMaxMhz: gpuCanTuneMem ? Math.round(gpuMemRange[1]) : 0,
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
                              min={gpuPowerMinBound}
                              max={gpuPowerMaxBound}
                              step={1}
                              value={[gpuPowerCap]}
                              onValueChange={(v) => setGpuPowerCap(v[0] ?? gpuPowerCap)}
                            />
                          </div>

                          <Button
                            variant="outline"
                            disabled={cmdPending}
                            onClick={() =>
                              sendCommand("gpu_power_cap", {
                                gpuIndex: activeGPUIndex,
                                milliwatt: Math.round(clamp(gpuPowerCap, gpuPowerMinBound, gpuPowerMaxBound)),
                              })
                            }
                          >
                            Apply Power Cap
                          </Button>
                        </div>
                      </div>

                      {cmdMsg ? <div className="mt-2 text-xs text-slate-600">{cmdMsg}</div> : null}
                    </Section>

                    <Section title={`GPU ${activeGPUIndex} Static`} icon={<Gauge className="h-4 w-4" />}>
                      <div className="grid gap-2 md:grid-cols-2">
                        <StatRow name="Name" value={strField(activeGPUStatic, "name") || "-"} />
                        <StatRow name="UUID" value={strField(activeGPUStatic, "uuid") || "-"} />
                        <StatRow name="Memory Total" value={formatBytes(numField(activeGPUStatic, "memoryTotalBytes", "memory_total_bytes"))} />
                        <StatRow name="Power Range" value={`${formatPowerMilliW(numField(activeGPUStatic, "powerMinMilliwatt", "power_min_milliwatt"))} ~ ${formatPowerMilliW(numField(activeGPUStatic, "powerMaxMilliwatt", "power_max_milliwatt"))}`} />
                        <StatRow name="SM Range" value={`${numField(activeGPUStatic, "smClockMinMhz", "sm_clock_min_mhz")} ~ ${numField(activeGPUStatic, "smClockMaxMhz", "sm_clock_max_mhz")} MHz`} />
                        <StatRow name="MEM Range" value={`${numField(activeGPUStatic, "memClockMinMhz", "mem_clock_min_mhz")} ~ ${numField(activeGPUStatic, "memClockMaxMhz", "mem_clock_max_mhz")} MHz`} />
                      </div>
                    </Section>

                    <div className="grid gap-3 lg:grid-cols-2">
                      <MetricChart chartId={`gpu-utilization-${gpuChartSuffix}`} title={`GPU ${activeGPUIndex} Utilization`} yLabel="%" data={gpuUtilSeries} lines={[{ key: "gpuUtilPct", label: "GPU", color: "#0f766e" }, { key: "memUtilPct", label: "MEM", color: "#0ea5e9" }]} yDomain={[0, 100]} />
                      <MetricChart chartId={`gpu-power-${gpuChartSuffix}`} title={`GPU ${activeGPUIndex} Power`} yLabel="W" data={gpuPowerSeries} lines={[{ key: "powerW", label: "Power", color: "#9333ea" }]} yDomain={[0, maxOr(numField(activeGPUStatic, "powerMaxMilliwatt", "power_max_milliwatt") / 1000, 450)]} />
                      <MetricChart chartId={`gpu-clock-${gpuChartSuffix}`} title={`GPU ${activeGPUIndex} Clock`} yLabel="MHz" data={gpuClockSeries} lines={[{ key: "smMHz", label: "SM", color: "#b45309" }, { key: "memMHz", label: "MEM", color: "#2563eb" }]} yDomain={[0, maxOr(Math.max(numField(activeGPUStatic, "smClockMaxMhz", "sm_clock_max_mhz"), numField(activeGPUStatic, "memClockMaxMhz", "mem_clock_max_mhz")), 1000)]} />
                    </div>
                  </>
                )}
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
                  chartId="memory-usage"
                  title="Memory Usage"
                  yLabel="GB"
                  data={memorySeries}
                  lines={[{ key: "usedGB", label: "Used", color: "#b91c1c" }, { key: "cachedGB", label: "Cached", color: "#0f766e" }]}
                  yDomain={[0, maxOr(numField(memoryMeta?.static, "totalBytes", "total_bytes") / 1024 / 1024 / 1024, 1)]}
                />
              </TabsContent>

              <TabsContent value="storage" className="mt-3 space-y-3">
                <Section title="Storage Snapshot" icon={<HardDrive className="h-4 w-4" />}>
                  <div className="w-full overflow-x-auto rounded-lg border border-slate-200 text-[11px]">
                    <table className="w-full min-w-[900px] table-auto">
                      <thead className="sticky top-0 z-20 bg-slate-50">
                        <tr>
                          <th className="border-b border-slate-200 px-3 py-1 text-left font-medium uppercase tracking-wide text-slate-600">Disk</th>
                          <th className="border-b border-slate-200 px-3 py-1 text-left font-medium uppercase tracking-wide text-slate-600">Mount</th>
                          <th className="border-b border-slate-200 px-3 py-1 text-left font-medium uppercase tracking-wide text-slate-600">FS</th>
                          <th className="border-b border-slate-200 px-3 py-1 text-left font-medium uppercase tracking-wide text-slate-600">Total</th>
                          <th className="border-b border-slate-200 px-3 py-1 text-left font-medium uppercase tracking-wide text-slate-600">Used</th>
                          <th className="border-b border-slate-200 px-3 py-1 text-left font-medium uppercase tracking-wide text-slate-600">Free</th>
                          <th className="border-b border-slate-200 px-3 py-1 text-left font-medium uppercase tracking-wide text-slate-600">Usage %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {storageRows.map((d) => {
                          const used = numField(d, "usedBytes", "used_bytes");
                          const free = numField(d, "freeBytes", "free_bytes");
                          const total = used + free;
                          const staticInfo = ((storageMeta?.staticDisks ?? storageMeta?.static_disks ?? []) as Array<Record<string, any>>)
                            .find((s) => strField(s, "name") === strField(d, "name"));
                          return (
                            <tr key={`disk-${strField(d, "name")}`} className="hover:bg-slate-50">
                              <td className="px-3 py-0.5 whitespace-nowrap font-mono">{strField(d, "name") || "-"}</td>
                              <td className="max-w-[280px] overflow-hidden text-ellipsis px-3 py-0.5 whitespace-nowrap" title={strField(staticInfo, "mountpoint") || "-"}>
                                {strField(staticInfo, "mountpoint") || "-"}
                              </td>
                              <td className="px-3 py-0.5 whitespace-nowrap">{strField(staticInfo, "filesystem") || "-"}</td>
                              <td className="px-3 py-0.5 whitespace-nowrap font-mono">{formatBytes(total)}</td>
                              <td className="px-3 py-0.5 whitespace-nowrap font-mono">{formatBytes(used)}</td>
                              <td className="px-3 py-0.5 whitespace-nowrap font-mono">{formatBytes(free)}</td>
                              <td className="px-3 py-0.5 whitespace-nowrap font-mono">{total > 0 ? formatPercent((used * 100) / total) : "0 %"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Section>

                <div className="grid gap-3 lg:grid-cols-2">
                  <MetricChart chartId="storage-read-throughput" title="Disk Read Throughput" yLabel="MB/s" data={storagePerDiskSeries} lines={storageReadThroughputLines} yDomain={[0, "auto"]} />
                  <MetricChart chartId="storage-write-throughput" title="Disk Write Throughput" yLabel="MB/s" data={storagePerDiskSeries} lines={storageWriteThroughputLines} yDomain={[0, "auto"]} />
                  <MetricChart chartId="storage-read-iops" title="Disk Read IOPS" yLabel="ops/s" data={storagePerDiskSeries} lines={storageReadIopsLines} yDomain={[0, "auto"]} />
                  <MetricChart chartId="storage-write-iops" title="Disk Write IOPS" yLabel="ops/s" data={storagePerDiskSeries} lines={storageWriteIopsLines} yDomain={[0, "auto"]} />
                </div>
              </TabsContent>

              <TabsContent value="network" className="mt-3 space-y-3">
                <Section title="Network Snapshot" icon={<Network className="h-4 w-4" />}>
                  <div className="w-full overflow-x-auto rounded-lg border border-slate-200 text-[11px]">
                    <table className="w-full min-w-[780px] table-auto">
                      <thead className="sticky top-0 z-20 bg-slate-50">
                        <tr>
                          <th className="border-b border-slate-200 px-3 py-1 text-left font-medium uppercase tracking-wide text-slate-600">Interface</th>
                          <th className="border-b border-slate-200 px-3 py-1 text-left font-medium uppercase tracking-wide text-slate-600">IPs</th>
                          <th className="border-b border-slate-200 px-3 py-1 text-left font-medium uppercase tracking-wide text-slate-600">RX Bytes</th>
                          <th className="border-b border-slate-200 px-3 py-1 text-left font-medium uppercase tracking-wide text-slate-600">TX Bytes</th>
                          <th className="border-b border-slate-200 px-3 py-1 text-left font-medium uppercase tracking-wide text-slate-600">RX Packets</th>
                          <th className="border-b border-slate-200 px-3 py-1 text-left font-medium uppercase tracking-wide text-slate-600">TX Packets</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {networkRows.map((itf) => (
                          <tr key={`if-${strField(itf, "name")}`} className="hover:bg-slate-50">
                            <td className="px-3 py-0.5 whitespace-nowrap font-mono">{strField(itf, "name") || "-"}</td>
                            <td className="max-w-[360px] overflow-hidden text-ellipsis px-3 py-0.5 whitespace-nowrap" title={((itf.ips ?? []) as string[]).join(", ") || "-"}>
                              {((itf.ips ?? []) as string[]).join(", ") || "-"}
                            </td>
                            <td className="px-3 py-0.5 whitespace-nowrap font-mono">{formatBytes(numField(itf, "rxBytes", "rx_bytes"))}</td>
                            <td className="px-3 py-0.5 whitespace-nowrap font-mono">{formatBytes(numField(itf, "txBytes", "tx_bytes"))}</td>
                            <td className="px-3 py-0.5 whitespace-nowrap font-mono">{formatNumber(numField(itf, "rxPackets", "rx_packets"), 0)}</td>
                            <td className="px-3 py-0.5 whitespace-nowrap font-mono">{formatNumber(numField(itf, "txPackets", "tx_packets"), 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Section>

                <div className="grid gap-3 lg:grid-cols-2">
                  <MetricChart chartId="network-rx-bytes" title="Network RX Bytes" yLabel="MB/s" data={networkPerIfSeries} lines={networkRxLines} yDomain={[0, "auto"]} />
                  <MetricChart chartId="network-tx-bytes" title="Network TX Bytes" yLabel="MB/s" data={networkPerIfSeries} lines={networkTxLines} yDomain={[0, "auto"]} />
                </div>
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
