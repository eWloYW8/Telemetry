"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Gauge } from "lucide-react";

import { Slider } from "@/components/ui/slider";

import { MetricChart } from "../../components/charts/metric-chart";
import type { RawHistorySample } from "../../types";
import { maxOr } from "../../utils/rates";
import { nsToTimeLabel } from "../../utils/time";
import { clamp, formatBytes, formatNumber, formatPowerMilliW } from "../../utils/units";
import { moduleMeta, numField, strField } from "../shared/data";
import { useThrottledEmitter } from "../shared/live-control";
import { Section, StatRow } from "../shared/section";

type GPUModuleViewProps = {
  nodeId: string;
  gpuIndex: number;
  registration: Record<string, any> | null;
  latestRaw: Record<string, Record<string, any>>;
  historyByCategory: Record<string, RawHistorySample[]>;
  cmdPending: boolean;
  cmdMsg: string;
  sendCommand: (commandType: string, payload: Record<string, unknown>) => void;
};

export function gpuIndexesFromRegistration(registration: Record<string, any> | null): number[] {
  const gpuMeta = moduleMeta(registration, "gpu");
  const gpuStatic = ((gpuMeta?.static ?? []) as Array<Record<string, any>>)
    .slice()
    .sort((a, b) => numField(a, "index") - numField(b, "index"));
  return gpuStatic.map((g) => numField(g, "index"));
}

export function GPUModuleView({
  nodeId,
  gpuIndex,
  registration,
  latestRaw,
  historyByCategory,
  cmdPending,
  cmdMsg,
  sendCommand,
}: GPUModuleViewProps) {
  const gpuMeta = moduleMeta(registration, "gpu");
  const gpuStatic = ((gpuMeta?.static ?? []) as Array<Record<string, any>>)
    .slice()
    .sort((a, b) => numField(a, "index") - numField(b, "index"));

  const activeGPUStatic =
    gpuStatic.find((g) => numField(g, "index") === gpuIndex) ?? gpuStatic[0] ?? null;

  const gpuFastRaw = latestRaw.gpu_fast?.gpuFastMetrics ?? latestRaw.gpu_fast?.gpu_fast_metrics ?? null;
  const gpuDevicesFast = (gpuFastRaw?.devices ?? []) as Array<Record<string, any>>;
  const activeGPUFast =
    gpuDevicesFast.find((g) => numField(g, "index") === gpuIndex) ?? gpuDevicesFast[0] ?? null;

  const gpuPowerMinRaw = numField(activeGPUStatic, "powerMinMilliwatt", "power_min_milliwatt");
  const gpuPowerMaxRaw = numField(activeGPUStatic, "powerMaxMilliwatt", "power_max_milliwatt");
  const gpuPowerCurrent = numField(activeGPUFast, "powerLimitMilliwatt", "power_limit_milliwatt");

  const gpuSMMinRaw = numField(activeGPUStatic, "smClockMinMhz", "sm_clock_min_mhz");
  const gpuSMMaxRaw = numField(activeGPUStatic, "smClockMaxMhz", "sm_clock_max_mhz");
  const gpuMemMinRaw = numField(activeGPUStatic, "memClockMinMhz", "mem_clock_min_mhz");
  const gpuMemMaxRaw = numField(activeGPUStatic, "memClockMaxMhz", "mem_clock_max_mhz");

  const gpuCurrentSMMin = numField(
    activeGPUFast,
    "smClockMinMhz",
    "sm_clock_min_mhz",
  );
  const gpuCurrentSMMax = numField(
    activeGPUFast,
    "smClockMaxMhz",
    "sm_clock_max_mhz",
  );
  const gpuCurrentMemMin = numField(activeGPUFast, "memClockMinMhz", "mem_clock_min_mhz");
  const gpuCurrentMemMax = numField(activeGPUFast, "memClockMaxMhz", "mem_clock_max_mhz");
  const gpuCurrentSMClock = numField(activeGPUFast, "graphicsClockMhz", "graphics_clock_mhz");
  const gpuCurrentMemClock = numField(activeGPUFast, "memoryClockMhz", "memory_clock_mhz");

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

  const [gpuSMRange, setGpuSMRange] = useState<[number, number]>([0, 0]);
  const [gpuMemRange, setGpuMemRange] = useState<[number, number]>([0, 0]);
  const [gpuPowerCap, setGpuPowerCap] = useState(120_000);

  const [isEditingClock, setIsEditingClock] = useState(false);
  const [isEditingPowerCap, setIsEditingPowerCap] = useState(false);
  const clockSyncBlockUntilRef = useRef(0);
  const powerCapSyncBlockUntilRef = useRef(0);

  const clockControl = useThrottledEmitter<{ sm: [number, number]; mem: [number, number] }>((range) => {
    sendCommand("gpu_clock_range", {
      gpuIndex,
      smMinMhz: gpuCanTuneSM ? Math.round(range.sm[0]) : 0,
      smMaxMhz: gpuCanTuneSM ? Math.round(range.sm[1]) : 0,
      memMinMhz: gpuCanTuneMem ? Math.round(range.mem[0]) : 0,
      memMaxMhz: gpuCanTuneMem ? Math.round(range.mem[1]) : 0,
    });
  }, 100);

  const powerCapControl = useThrottledEmitter<number>((value) => {
    sendCommand("gpu_power_cap", {
      gpuIndex,
      milliwatt: Math.round(clamp(value, gpuPowerMinBound, gpuPowerMaxBound)),
    });
  }, 100);

  useEffect(() => {
    if (isEditingClock) return;
    if (Date.now() < clockSyncBlockUntilRef.current) return;

    if (gpuCanTuneSM) {
      let backendMinRaw = 0;
      let backendMaxRaw = 0;
      if (gpuCurrentSMMin > 0 && gpuCurrentSMMax > 0) {
        backendMinRaw = gpuCurrentSMMin;
        backendMaxRaw = gpuCurrentSMMax;
      } else if (gpuCurrentSMClock > 0) {
        backendMinRaw = gpuCurrentSMClock;
        backendMaxRaw = gpuCurrentSMClock;
      }
      if (backendMinRaw > 0 && backendMaxRaw > 0) {
        const lo = clamp(Math.min(backendMinRaw, backendMaxRaw), gpuSMMinRaw, gpuSMMaxRaw);
        const hi = clamp(Math.max(backendMinRaw, backendMaxRaw), gpuSMMinRaw, gpuSMMaxRaw);
        setGpuSMRange((prev) => (prev[0] === lo && prev[1] === hi ? prev : [lo, hi]));
      }
    } else {
      setGpuSMRange([0, 0]);
    }

    if (gpuCanTuneMem) {
      let backendMinRaw = 0;
      let backendMaxRaw = 0;
      if (gpuCurrentMemMin > 0 && gpuCurrentMemMax > 0) {
        backendMinRaw = gpuCurrentMemMin;
        backendMaxRaw = gpuCurrentMemMax;
      } else if (gpuCurrentMemClock > 0) {
        backendMinRaw = gpuCurrentMemClock;
        backendMaxRaw = gpuCurrentMemClock;
      }
      if (backendMinRaw > 0 && backendMaxRaw > 0) {
        const lo = clamp(Math.min(backendMinRaw, backendMaxRaw), gpuMemMinRaw, gpuMemMaxRaw);
        const hi = clamp(Math.max(backendMinRaw, backendMaxRaw), gpuMemMinRaw, gpuMemMaxRaw);
        setGpuMemRange((prev) => (prev[0] === lo && prev[1] === hi ? prev : [lo, hi]));
      }
    } else {
      setGpuMemRange([0, 0]);
    }
  }, [
    isEditingClock,
    gpuCanTuneSM,
    gpuCanTuneMem,
    gpuCurrentSMMin,
    gpuCurrentSMMax,
    gpuCurrentMemMin,
    gpuCurrentMemMax,
    gpuCurrentSMClock,
    gpuCurrentMemClock,
    gpuSMMinRaw,
    gpuSMMaxRaw,
    gpuMemMinRaw,
    gpuMemMaxRaw,
    activeGPUFast,
  ]);

  useEffect(() => {
    if (isEditingPowerCap) return;
    if (Date.now() < powerCapSyncBlockUntilRef.current) return;
    const next = clamp(gpuPowerCurrent > 0 ? gpuPowerCurrent : gpuPowerMinBound, gpuPowerMinBound, gpuPowerMaxBound);
    setGpuPowerCap((prev) => (Math.abs(prev - next) < 1 ? prev : next));
  }, [isEditingPowerCap, gpuPowerCurrent, gpuPowerMinBound, gpuPowerMaxBound]);

  useEffect(() => {
    setIsEditingClock(false);
    setIsEditingPowerCap(false);
    setGpuSMRange([0, 0]);
    setGpuMemRange([0, 0]);
    clockSyncBlockUntilRef.current = 0;
    powerCapSyncBlockUntilRef.current = 0;
  }, [gpuIndex]);

  const gpuUtilSeries = useMemo(() => {
    const list = historyByCategory.gpu_fast ?? [];
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
  }, [historyByCategory.gpu_fast, gpuIndex]);

  const gpuPowerSeries = useMemo(() => {
    const list = historyByCategory.gpu_fast ?? [];
    return list.map((item) => {
      const devices = ((item.sample.gpuFastMetrics ?? item.sample.gpu_fast_metrics ?? {}).devices ?? []) as Array<
        Record<string, any>
      >;
      const dev = devices.find((d) => numField(d, "index") === gpuIndex) ?? null;
      const powerW = numField(dev, "powerUsageMilliwatt", "power_usage_milliwatt") / 1000;
      return { tsNs: item.atNs.toString(), time: nsToTimeLabel(item.atNs), powerW };
    });
  }, [historyByCategory.gpu_fast, gpuIndex]);

  const gpuClockSeries = useMemo(() => {
    const list = historyByCategory.gpu_fast ?? [];
    return list.map((item) => {
      const devices = ((item.sample.gpuFastMetrics ?? item.sample.gpu_fast_metrics ?? {}).devices ?? []) as Array<
        Record<string, any>
      >;
      const dev = devices.find((d) => numField(d, "index") === gpuIndex) ?? null;
      const smMHz = numField(dev, "graphicsClockMhz", "graphics_clock_mhz");
      const memMHz = numField(dev, "memoryClockMhz", "memory_clock_mhz");
      return { tsNs: item.atNs.toString(), time: nsToTimeLabel(item.atNs), smMHz, memMHz };
    });
  }, [historyByCategory.gpu_fast, gpuIndex]);

  const gpuChartSuffix = `${nodeId || "node"}-gpu${gpuIndex}`;

  if (gpuIndex < 0) {
    return (
      <Section title="GPU Device" icon={<Gauge className="h-4 w-4" />}>
        <div className="text-sm text-slate-500">No NVIDIA GPU discovered.</div>
      </Section>
    );
  }

  return (
    <>
      <Section title={`GPU ${gpuIndex} Static`} icon={<Gauge className="h-4 w-4" />}>
        <div className="grid gap-2 md:grid-cols-2">
          <StatRow name="Name" value={strField(activeGPUStatic, "name") || "-"} />
          <StatRow name="UUID" value={strField(activeGPUStatic, "uuid") || "-"} />
          <StatRow
            name="Memory Total"
            value={formatBytes(numField(activeGPUStatic, "memoryTotalBytes", "memory_total_bytes"))}
          />
          <StatRow
            name="Power Range"
            value={`${formatPowerMilliW(numField(activeGPUStatic, "powerMinMilliwatt", "power_min_milliwatt"))} ~ ${formatPowerMilliW(numField(activeGPUStatic, "powerMaxMilliwatt", "power_max_milliwatt"))}`}
          />
          <StatRow
            name="SM Range"
            value={`${numField(activeGPUStatic, "smClockMinMhz", "sm_clock_min_mhz")} ~ ${numField(activeGPUStatic, "smClockMaxMhz", "sm_clock_max_mhz")} MHz`}
          />
          <StatRow
            name="MEM Range"
            value={`${numField(activeGPUStatic, "memClockMinMhz", "mem_clock_min_mhz")} ~ ${numField(activeGPUStatic, "memClockMaxMhz", "mem_clock_max_mhz")} MHz`}
          />
        </div>
      </Section>

      <Section title={`GPU ${gpuIndex} Controls`} icon={<Gauge className="h-4 w-4" />}>
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="space-y-3 border border-slate-200 p-3">
            <div className="text-sm font-medium">Clock Range</div>
            {gpuCanTuneSM ? (
              <div>
                <div className="mb-1 text-xs text-slate-500">
                  SM Clock {formatNumber(gpuSMRange[0])} ~ {formatNumber(gpuSMRange[1])} MHz
                </div>
                <Slider
                  min={maxOr(gpuSMMinRaw, 1)}
                  max={maxOr(gpuSMMaxRaw, 1)}
                  step={1}
                  value={gpuSMRange}
                  onValueChange={(v) => {
                    const next: [number, number] = [
                      clamp(v[0] ?? gpuSMRange[0], gpuSMMinRaw, gpuSMMaxRaw),
                      clamp(v[1] ?? gpuSMRange[1], gpuSMMinRaw, gpuSMMaxRaw),
                    ];
                    const fixed: [number, number] = [Math.min(next[0], next[1]), Math.max(next[0], next[1])];
                    setIsEditingClock(true);
                    setGpuSMRange(fixed);
                    clockControl.send({ sm: fixed, mem: gpuMemRange });
                  }}
                  onValueCommit={(v) => {
                    const next: [number, number] = [
                      clamp(v[0] ?? gpuSMRange[0], gpuSMMinRaw, gpuSMMaxRaw),
                      clamp(v[1] ?? gpuSMRange[1], gpuSMMinRaw, gpuSMMaxRaw),
                    ];
                    const fixed: [number, number] = [Math.min(next[0], next[1]), Math.max(next[0], next[1])];
                    setGpuSMRange(fixed);
                    clockControl.flush({ sm: fixed, mem: gpuMemRange });
                    clockSyncBlockUntilRef.current = Date.now() + 200;
                    setIsEditingClock(false);
                  }}
                />
              </div>
            ) : null}

            {gpuCanTuneMem ? (
              <div>
                <div className="mb-1 text-xs text-slate-500">
                  Memory Clock {formatNumber(gpuMemRange[0])} ~ {formatNumber(gpuMemRange[1])} MHz
                </div>
                <Slider
                  min={maxOr(gpuMemMinRaw, 1)}
                  max={maxOr(gpuMemMaxRaw, 1)}
                  step={1}
                  value={gpuMemRange}
                  onValueChange={(v) => {
                    const next: [number, number] = [
                      clamp(v[0] ?? gpuMemRange[0], gpuMemMinRaw, gpuMemMaxRaw),
                      clamp(v[1] ?? gpuMemRange[1], gpuMemMinRaw, gpuMemMaxRaw),
                    ];
                    const fixed: [number, number] = [Math.min(next[0], next[1]), Math.max(next[0], next[1])];
                    setIsEditingClock(true);
                    setGpuMemRange(fixed);
                    clockControl.send({ sm: gpuSMRange, mem: fixed });
                  }}
                  onValueCommit={(v) => {
                    const next: [number, number] = [
                      clamp(v[0] ?? gpuMemRange[0], gpuMemMinRaw, gpuMemMaxRaw),
                      clamp(v[1] ?? gpuMemRange[1], gpuMemMinRaw, gpuMemMaxRaw),
                    ];
                    const fixed: [number, number] = [Math.min(next[0], next[1]), Math.max(next[0], next[1])];
                    setGpuMemRange(fixed);
                    clockControl.flush({ sm: gpuSMRange, mem: fixed });
                    clockSyncBlockUntilRef.current = Date.now() + 200;
                    setIsEditingClock(false);
                  }}
                />
              </div>
            ) : null}

            {!gpuCanTuneSM && !gpuCanTuneMem ? (
              <div className="text-xs text-slate-500">Clock range control unsupported on this GPU.</div>
            ) : null}
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
                onValueChange={(v) => {
                  const next = clamp(v[0] ?? gpuPowerCap, gpuPowerMinBound, gpuPowerMaxBound);
                  setIsEditingPowerCap(true);
                  setGpuPowerCap(next);
                  powerCapControl.send(next);
                }}
                onValueCommit={(v) => {
                  const next = clamp(v[0] ?? gpuPowerCap, gpuPowerMinBound, gpuPowerMaxBound);
                  setGpuPowerCap(next);
                  powerCapControl.flush(next);
                  powerCapSyncBlockUntilRef.current = Date.now() + 200;
                  setIsEditingPowerCap(false);
                }}
              />
            </div>
          </div>
        </div>

        {cmdMsg ? <div className="mt-2 text-xs text-slate-600">{cmdMsg}</div> : null}
      </Section>

      <div className="grid gap-3 lg:grid-cols-2">
        <MetricChart
          chartId={`gpu-utilization-${gpuChartSuffix}`}
          title={`GPU ${gpuIndex} Utilization`}
          yLabel="%"
          data={gpuUtilSeries}
          lines={[
            { key: "gpuUtilPct", label: "GPU", color: "#0f766e" },
            { key: "memUtilPct", label: "MEM", color: "#0ea5e9" },
          ]}
          yDomain={[0, 100]}
        />
        <MetricChart
          chartId={`gpu-power-${gpuChartSuffix}`}
          title={`GPU ${gpuIndex} Power`}
          yLabel="W"
          data={gpuPowerSeries}
          lines={[{ key: "powerW", label: "Power", color: "#9333ea" }]}
          yDomain={[0, maxOr(numField(activeGPUStatic, "powerMaxMilliwatt", "power_max_milliwatt") / 1000, 450)]}
        />
        <MetricChart
          chartId={`gpu-clock-${gpuChartSuffix}`}
          title={`GPU ${gpuIndex} Clock`}
          yLabel="MHz"
          data={gpuClockSeries}
          lines={[
            { key: "smMHz", label: "SM", color: "#b45309" },
            { key: "memMHz", label: "MEM", color: "#2563eb" },
          ]}
          yDomain={[
            0,
            maxOr(
              Math.max(
                numField(activeGPUStatic, "smClockMaxMhz", "sm_clock_max_mhz"),
                numField(activeGPUStatic, "memClockMaxMhz", "mem_clock_max_mhz"),
              ),
              1000,
            ),
          ]}
        />
      </div>
    </>
  );
}
