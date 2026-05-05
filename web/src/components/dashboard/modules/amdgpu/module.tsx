"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Gauge } from "lucide-react";

import { MetricChart } from "../../components/charts/metric-chart";
import { RichControlSlider } from "../../components/ui/rich-control-slider";
import type { RawHistorySample } from "../../types";
import { maxOr } from "../../utils/rates";
import { nsToTimeLabel } from "../../utils/time";
import { clamp, formatBytes, formatNumber, formatPowerMilliW } from "../../utils/units";
import { moduleMeta, numField, strField } from "../shared/data";
import { useThrottledEmitter } from "../shared/live-control";
import { Section, StatRow } from "../shared/section";

type AMDGPUModuleViewProps = {
  nodeId: string;
  gpuIndex: number;
  displayIndex: number;
  registration: Record<string, any> | null;
  latestRaw: Record<string, Record<string, any>>;
  historyByCategory: Record<string, RawHistorySample[]>;
  cmdPending: boolean;
  cmdMsg: string;
  sendCommand: (commandType: string, payload: Record<string, unknown>) => void;
};

const BYTES_PER_GB = 1024 * 1024 * 1024;

export function amdgpuIndexesFromRegistration(registration: Record<string, any> | null): number[] {
  const meta = moduleMeta(registration, "amdgpu");
  const list = ((meta?.static ?? []) as Array<Record<string, any>>)
    .slice()
    .sort((a, b) => numField(a, "index") - numField(b, "index"));
  return list.map((g) => numField(g, "index"));
}

export function AMDGPUModuleView({
  nodeId,
  gpuIndex,
  displayIndex,
  registration,
  latestRaw,
  historyByCategory,
  cmdPending,
  cmdMsg,
  sendCommand,
}: AMDGPUModuleViewProps) {
  const meta = moduleMeta(registration, "amdgpu");
  const staticList = ((meta?.static ?? []) as Array<Record<string, any>>)
    .slice()
    .sort((a, b) => numField(a, "index") - numField(b, "index"));

  const activeStatic =
    staticList.find((g) => numField(g, "index") === gpuIndex) ?? staticList[0] ?? null;

  const fastRaw = latestRaw.amdgpu_fast?.gpuFastMetrics ?? latestRaw.amdgpu_fast?.gpu_fast_metrics ?? null;
  const devicesFast = (fastRaw?.devices ?? []) as Array<Record<string, any>>;
  const activeFast =
    devicesFast.find((g) => numField(g, "index") === gpuIndex) ?? devicesFast[0] ?? null;

  const powerMinRaw = numField(activeStatic, "powerMinMilliwatt", "power_min_milliwatt");
  const powerMaxRaw = numField(activeStatic, "powerMaxMilliwatt", "power_max_milliwatt");
  const powerCurrent = numField(activeFast, "powerLimitMilliwatt", "power_limit_milliwatt");

  const smMinRaw = numField(activeStatic, "smClockMinMhz", "sm_clock_min_mhz");
  const smMaxRaw = numField(activeStatic, "smClockMaxMhz", "sm_clock_max_mhz");
  const memMinRaw = numField(activeStatic, "memClockMinMhz", "mem_clock_min_mhz");
  const memMaxRaw = numField(activeStatic, "memClockMaxMhz", "mem_clock_max_mhz");

  const currentSMMin = numField(activeFast, "smClockMinMhz", "sm_clock_min_mhz");
  const currentSMMax = numField(activeFast, "smClockMaxMhz", "sm_clock_max_mhz");
  const currentSMClock = numField(activeFast, "graphicsClockMhz", "graphics_clock_mhz");
  const currentMemMin = numField(activeFast, "memClockMinMhz", "mem_clock_min_mhz");
  const currentMemMax = numField(activeFast, "memClockMaxMhz", "mem_clock_max_mhz");
  const currentMemClock = numField(activeFast, "memoryClockMhz", "memory_clock_mhz");
  const currentPowerUsage = numField(activeFast, "powerUsageMilliwatt", "power_usage_milliwatt");

  const smMinBound = maxOr(smMinRaw, 1);
  const smMaxBound = maxOr(smMaxRaw, smMinBound);
  const memMinBound = maxOr(memMinRaw, 1);
  const memMaxBound = maxOr(memMaxRaw, memMinBound);

  const canTuneSM = smMaxBound > smMinBound;
  const canTuneMem = memMaxBound > memMinBound;

  const powerMinBound = useMemo(() => {
    if (powerMinRaw > 0) return powerMinRaw;
    return 30_000;
  }, [powerMinRaw]);
  const powerMaxBound = useMemo(() => {
    if (powerMaxRaw > 0) return Math.max(powerMaxRaw, powerMinBound);
    if (powerCurrent > 0) return Math.max(powerCurrent, powerMinBound);
    return Math.max(450_000, powerMinBound);
  }, [powerMaxRaw, powerCurrent, powerMinBound]);

  const [smRange, setSMRange] = useState<[number, number]>([0, 0]);
  const [memRange, setMemRange] = useState<[number, number]>([0, 0]);
  const [powerCap, setPowerCap] = useState(120_000);

  const [isEditingClock, setIsEditingClock] = useState(false);
  const [isEditingPowerCap, setIsEditingPowerCap] = useState(false);
  const clockSyncBlockUntilRef = useRef(0);
  const powerCapSyncBlockUntilRef = useRef(0);

  const clockControl = useThrottledEmitter<{ sm: [number, number]; mem: [number, number] }>((range) => {
    sendCommand("amdgpu_clock_range", {
      gpuIndex,
      smMinMhz: canTuneSM ? Math.round(range.sm[0]) : 0,
      smMaxMhz: canTuneSM ? Math.round(range.sm[1]) : 0,
      memMinMhz: canTuneMem ? Math.round(range.mem[0]) : 0,
      memMaxMhz: canTuneMem ? Math.round(range.mem[1]) : 0,
    });
  }, 100);

  const powerCapControl = useThrottledEmitter<number>((value) => {
    sendCommand("amdgpu_power_cap", {
      gpuIndex,
      milliwatt: Math.round(clamp(value, powerMinBound, powerMaxBound)),
    });
  }, 100);

  useEffect(() => {
    if (isEditingClock) return;
    if (Date.now() < clockSyncBlockUntilRef.current) return;

    if (canTuneSM) {
      const backendMinRaw = currentSMMin > 0 ? currentSMMin : smMinBound;
      const backendMaxRaw = currentSMMax > 0 ? currentSMMax : smMaxBound;
      if (backendMaxRaw > 0) {
        const lo = clamp(Math.min(backendMinRaw, backendMaxRaw), smMinBound, smMaxBound);
        const hi = clamp(Math.max(backendMinRaw, backendMaxRaw), smMinBound, smMaxBound);
        setSMRange((prev) => (prev[0] === lo && prev[1] === hi ? prev : [lo, hi]));
      }
    } else {
      setSMRange([0, 0]);
    }

    if (canTuneMem) {
      const backendMinRaw = currentMemMin > 0 ? currentMemMin : memMinBound;
      const backendMaxRaw = currentMemMax > 0 ? currentMemMax : memMaxBound;
      if (backendMaxRaw > 0) {
        const lo = clamp(Math.min(backendMinRaw, backendMaxRaw), memMinBound, memMaxBound);
        const hi = clamp(Math.max(backendMinRaw, backendMaxRaw), memMinBound, memMaxBound);
        setMemRange((prev) => (prev[0] === lo && prev[1] === hi ? prev : [lo, hi]));
      }
    } else {
      setMemRange([0, 0]);
    }
  }, [
    isEditingClock,
    canTuneSM,
    canTuneMem,
    currentSMMin,
    currentSMMax,
    currentMemMin,
    currentMemMax,
    smMinBound,
    smMaxBound,
    memMinBound,
    memMaxBound,
    activeFast,
  ]);

  useEffect(() => {
    if (isEditingPowerCap) return;
    if (Date.now() < powerCapSyncBlockUntilRef.current) return;
    const next = clamp(powerCurrent > 0 ? powerCurrent : powerMinBound, powerMinBound, powerMaxBound);
    setPowerCap((prev) => (Math.abs(prev - next) < 1 ? prev : next));
  }, [isEditingPowerCap, powerCurrent, powerMinBound, powerMaxBound]);

  useEffect(() => {
    setIsEditingClock(false);
    setIsEditingPowerCap(false);
    setSMRange([0, 0]);
    setMemRange([0, 0]);
    clockSyncBlockUntilRef.current = 0;
    powerCapSyncBlockUntilRef.current = 0;
  }, [gpuIndex]);

  const utilSeries = useMemo(() => {
    const list = historyByCategory.amdgpu_fast ?? [];
    return list.map((item) => {
      const devices = ((item.sample.gpuFastMetrics ?? item.sample.gpu_fast_metrics ?? {}).devices ?? []) as Array<
        Record<string, any>
      >;
      const dev = devices.find((d) => numField(d, "index") === gpuIndex) ?? null;
      const gpuUtil = numField(dev, "utilizationGpu", "utilization_gpu");
      const memUtil = numField(dev, "utilizationMem", "utilization_mem");
      return {
        tsNs: item.atNs.toString(),
        time: nsToTimeLabel(item.atNs),
        gpuUtilPct: gpuUtil,
        memUtilPct: memUtil,
      };
    });
  }, [historyByCategory.amdgpu_fast, gpuIndex]);

  const powerSeries = useMemo(() => {
    const list = historyByCategory.amdgpu_fast ?? [];
    return list.map((item) => {
      const devices = ((item.sample.gpuFastMetrics ?? item.sample.gpu_fast_metrics ?? {}).devices ?? []) as Array<
        Record<string, any>
      >;
      const dev = devices.find((d) => numField(d, "index") === gpuIndex) ?? null;
      const powerW = numField(dev, "powerUsageMilliwatt", "power_usage_milliwatt") / 1000;
      return { tsNs: item.atNs.toString(), time: nsToTimeLabel(item.atNs), powerW };
    });
  }, [historyByCategory.amdgpu_fast, gpuIndex]);

  const clockSeries = useMemo(() => {
    const list = historyByCategory.amdgpu_fast ?? [];
    return list.map((item) => {
      const devices = ((item.sample.gpuFastMetrics ?? item.sample.gpu_fast_metrics ?? {}).devices ?? []) as Array<
        Record<string, any>
      >;
      const dev = devices.find((d) => numField(d, "index") === gpuIndex) ?? null;
      const smMHz = numField(dev, "graphicsClockMhz", "graphics_clock_mhz");
      const memMHz = numField(dev, "memoryClockMhz", "memory_clock_mhz");
      return { tsNs: item.atNs.toString(), time: nsToTimeLabel(item.atNs), smMHz, memMHz };
    });
  }, [historyByCategory.amdgpu_fast, gpuIndex]);

  const memorySeries = useMemo(() => {
    const list = historyByCategory.amdgpu_fast ?? [];
    return list.map((item) => {
      const devices = ((item.sample.gpuFastMetrics ?? item.sample.gpu_fast_metrics ?? {}).devices ?? []) as Array<
        Record<string, any>
      >;
      const dev = devices.find((d) => numField(d, "index") === gpuIndex) ?? null;
      const usedGB = numField(dev, "memoryUsedBytes", "memory_used_bytes") / BYTES_PER_GB;
      return { tsNs: item.atNs.toString(), time: nsToTimeLabel(item.atNs), usedGB };
    });
  }, [historyByCategory.amdgpu_fast, gpuIndex]);

  const memoryMaxBound = useMemo(() => {
    const totalGB = numField(activeStatic, "memoryTotalBytes", "memory_total_bytes") / BYTES_PER_GB;
    if (totalGB > 0) return totalGB;
    const sampleMax = memorySeries.reduce((acc, row) => Math.max(acc, numField(row, "usedGB")), 0);
    return maxOr(sampleMax, 1);
  }, [activeStatic, memorySeries]);

  const chartSuffix = `${nodeId || "node"}-amdgpu${gpuIndex}`;

  if (gpuIndex < 0) {
    return (
      <Section title="GPU Device" icon={<Gauge className="h-4 w-4" />}>
        <div className="text-sm text-[var(--telemetry-muted-fg)]">No AMD GPU discovered.</div>
      </Section>
    );
  }

  return (
    <>
      <Section title={`GPU ${displayIndex} Static`} icon={<Gauge className="h-4 w-4" />}>
        <div className="grid gap-2 md:grid-cols-2">
          <StatRow name="Name" value={strField(activeStatic, "name") || "-"} />
          <StatRow name="PCI" value={strField(activeStatic, "uuid") || "-"} />
          <StatRow
            name="Memory Total"
            value={formatBytes(numField(activeStatic, "memoryTotalBytes", "memory_total_bytes"))}
          />
          <StatRow
            name="Power Range"
            value={`${formatPowerMilliW(numField(activeStatic, "powerMinMilliwatt", "power_min_milliwatt"))} ~ ${formatPowerMilliW(numField(activeStatic, "powerMaxMilliwatt", "power_max_milliwatt"))}`}
          />
          <StatRow
            name="SM Range"
            value={`${numField(activeStatic, "smClockMinMhz", "sm_clock_min_mhz")} ~ ${numField(activeStatic, "smClockMaxMhz", "sm_clock_max_mhz")} MHz`}
          />
          <StatRow
            name="MEM Range"
            value={`${numField(activeStatic, "memClockMinMhz", "mem_clock_min_mhz")} ~ ${numField(activeStatic, "memClockMaxMhz", "mem_clock_max_mhz")} MHz`}
          />
        </div>
      </Section>

      <Section title={`GPU ${displayIndex} Controls`} icon={<Gauge className="h-4 w-4" />}>
        {canTuneSM ? (
          <div className="mb-1.5">
            <div className="mb-0.5 text-sm text-[var(--telemetry-muted-fg)]">
              SM Clock {formatNumber(smRange[0])} ~ {formatNumber(smRange[1])} MHz
            </div>
            <RichControlSlider
              min={smMinBound}
              max={smMaxBound}
              step={1}
              value={smRange}
              currentValue={currentSMClock > 0 ? currentSMClock : null}
              valueFormatter={(value) => `${formatNumber(value)} MHz`}
              tickFormatter={(value) => formatNumber(value, 0)}
              onValueChange={(v) => {
                const next: [number, number] = [
                  clamp(v[0] ?? smRange[0], smMinBound, smMaxBound),
                  clamp(v[1] ?? smRange[1], smMinBound, smMaxBound),
                ];
                const fixed: [number, number] = [Math.min(next[0], next[1]), Math.max(next[0], next[1])];
                setIsEditingClock(true);
                setSMRange(fixed);
                clockControl.send({ sm: fixed, mem: memRange });
              }}
              onValueCommit={(v) => {
                const next: [number, number] = [
                  clamp(v[0] ?? smRange[0], smMinBound, smMaxBound),
                  clamp(v[1] ?? smRange[1], smMinBound, smMaxBound),
                ];
                const fixed: [number, number] = [Math.min(next[0], next[1]), Math.max(next[0], next[1])];
                setSMRange(fixed);
                clockControl.flush({ sm: fixed, mem: memRange });
                clockSyncBlockUntilRef.current = Date.now() + 200;
                setIsEditingClock(false);
              }}
            />
          </div>
        ) : null}

        {canTuneMem ? (
          <div className="mb-1.5">
            <div className="mb-0.5 text-sm text-[var(--telemetry-muted-fg)]">
              Memory Clock {formatNumber(memRange[0])} ~ {formatNumber(memRange[1])} MHz
            </div>
            <RichControlSlider
              min={memMinBound}
              max={memMaxBound}
              step={1}
              value={memRange}
              currentValue={currentMemClock > 0 ? currentMemClock : null}
              valueFormatter={(value) => `${formatNumber(value)} MHz`}
              tickFormatter={(value) => formatNumber(value, 0)}
              onValueChange={(v) => {
                const next: [number, number] = [
                  clamp(v[0] ?? memRange[0], memMinBound, memMaxBound),
                  clamp(v[1] ?? memRange[1], memMinBound, memMaxBound),
                ];
                const fixed: [number, number] = [Math.min(next[0], next[1]), Math.max(next[0], next[1])];
                setIsEditingClock(true);
                setMemRange(fixed);
                clockControl.send({ sm: smRange, mem: fixed });
              }}
              onValueCommit={(v) => {
                const next: [number, number] = [
                  clamp(v[0] ?? memRange[0], memMinBound, memMaxBound),
                  clamp(v[1] ?? memRange[1], memMinBound, memMaxBound),
                ];
                const fixed: [number, number] = [Math.min(next[0], next[1]), Math.max(next[0], next[1])];
                setMemRange(fixed);
                clockControl.flush({ sm: smRange, mem: fixed });
                clockSyncBlockUntilRef.current = Date.now() + 200;
                setIsEditingClock(false);
              }}
            />
          </div>
        ) : null}

        <div className="mb-1.5">
          <div className="mb-0.5 text-sm text-[var(--telemetry-muted-fg)]">Power Cap {formatPowerMilliW(powerCap)}</div>
          <RichControlSlider
            min={powerMinBound}
            max={powerMaxBound}
            step={1}
            value={[powerCap]}
            currentValue={currentPowerUsage > 0 ? currentPowerUsage : null}
            valueFormatter={(value) => formatPowerMilliW(value)}
            tickFormatter={(value) => formatNumber(value / 1000, 0)}
            onValueChange={(v) => {
              const next = clamp(v[0] ?? powerCap, powerMinBound, powerMaxBound);
              setIsEditingPowerCap(true);
              setPowerCap(next);
              powerCapControl.send(next);
            }}
            onValueCommit={(v) => {
              const next = clamp(v[0] ?? powerCap, powerMinBound, powerMaxBound);
              setPowerCap(next);
              powerCapControl.flush(next);
              powerCapSyncBlockUntilRef.current = Date.now() + 200;
              setIsEditingPowerCap(false);
            }}
          />
        </div>

      </Section>

      <div className="grid gap-3 lg:grid-cols-2">
        <MetricChart
          chartId={`amdgpu-utilization-${chartSuffix}`}
          title={`GPU ${displayIndex} Utilization`}
          yLabel="%"
          data={utilSeries}
          lines={[
            { key: "gpuUtilPct", label: "GPU", color: "#0f766e" },
            { key: "memUtilPct", label: "MEM", color: "#0ea5e9" },
          ]}
          showCurrentStatus
          currentValueFormatter={(value) => `${formatNumber(value, 0)}%`}
          yDomain={[0, 100]}
        />
        <MetricChart
          chartId={`amdgpu-power-${chartSuffix}`}
          title={`GPU ${displayIndex} Power`}
          yLabel="W"
          data={powerSeries}
          lines={[{ key: "powerW", label: "Power", color: "#0e7490" }]}
          showCurrentStatus
          currentValueFormatter={(value) => `${formatNumber(value, 1)} W`}
          yDomain={[0, maxOr(numField(activeStatic, "powerMaxMilliwatt", "power_max_milliwatt") / 1000, 450)]}
        />
        <MetricChart
          chartId={`amdgpu-clock-${chartSuffix}`}
          title={`GPU ${displayIndex} Clock`}
          yLabel="MHz"
          data={clockSeries}
          lines={[
            { key: "smMHz", label: "SM", color: "#b45309" },
            { key: "memMHz", label: "MEM", color: "#2563eb" },
          ]}
          showCurrentStatus
          currentValueFormatter={(value) => `${formatNumber(value, 0)} MHz`}
          yDomain={[
            0,
            maxOr(
              Math.max(
                numField(activeStatic, "smClockMaxMhz", "sm_clock_max_mhz"),
                numField(activeStatic, "memClockMaxMhz", "mem_clock_max_mhz"),
              ),
              1000,
            ),
          ]}
        />
        <MetricChart
          chartId={`amdgpu-memory-usage-${chartSuffix}`}
          title={`GPU ${displayIndex} Memory Usage`}
          yLabel="GB"
          data={memorySeries}
          lines={[{ key: "usedGB", label: "Used", color: "#9333ea" }]}
          showCurrentStatus
          currentValueFormatter={(value) => `${formatNumber(value, 2)} GB`}
          yDomain={[0, memoryMaxBound]}
        />
      </div>
    </>
  );
}
