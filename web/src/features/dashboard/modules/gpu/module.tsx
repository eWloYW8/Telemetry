"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Gauge } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

import { MetricChart } from "../../components/charts/metric-chart";
import type { RawHistorySample } from "../../types";
import { maxOr } from "../../utils/rates";
import { nsToTimeLabel } from "../../utils/time";
import { clamp, formatBytes, formatNumber, formatPowerMilliW } from "../../utils/units";
import { moduleMeta, numField, strField } from "../shared/data";
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

  useEffect(() => {
    if (!activeGPUStatic) return;
    if (gpuCanTuneSM) {
      setGpuSMRange((prev) => {
        const lo = clamp(prev[0] || gpuSMMinRaw, gpuSMMinRaw, gpuSMMaxRaw);
        const hi = clamp(prev[1] || gpuSMMaxRaw, gpuSMMinRaw, gpuSMMaxRaw);
        return [Math.min(lo, hi), Math.max(lo, hi)];
      });
    } else {
      setGpuSMRange([0, 0]);
    }

    if (gpuCanTuneMem) {
      setGpuMemRange((prev) => {
        const lo = clamp(prev[0] || gpuMemMinRaw, gpuMemMinRaw, gpuMemMaxRaw);
        const hi = clamp(prev[1] || gpuMemMaxRaw, gpuMemMinRaw, gpuMemMaxRaw);
        return [Math.min(lo, hi), Math.max(lo, hi)];
      });
    } else {
      setGpuMemRange([0, 0]);
    }
  }, [activeGPUStatic, gpuCanTuneSM, gpuCanTuneMem, gpuSMMinRaw, gpuSMMaxRaw, gpuMemMinRaw, gpuMemMaxRaw]);

  const gpuPowerSyncDeviceRef = useRef<number>(-1);
  const gpuPowerSyncedRef = useRef(false);

  useEffect(() => {
    if (gpuIndex < 0) return;
    if (gpuPowerSyncDeviceRef.current !== gpuIndex) {
      gpuPowerSyncDeviceRef.current = gpuIndex;
      gpuPowerSyncedRef.current = false;
      setGpuPowerCap((prev) => clamp(prev || gpuPowerMinBound, gpuPowerMinBound, gpuPowerMaxBound));
    }
  }, [gpuIndex, gpuPowerMinBound, gpuPowerMaxBound]);

  useEffect(() => {
    if (gpuIndex < 0 || gpuPowerSyncedRef.current) return;
    if (gpuPowerCurrent <= 0) return;
    gpuPowerSyncedRef.current = true;
    setGpuPowerCap(clamp(gpuPowerCurrent, gpuPowerMinBound, gpuPowerMaxBound));
  }, [gpuIndex, gpuPowerCurrent, gpuPowerMinBound, gpuPowerMaxBound]);

  useEffect(() => {
    setGpuPowerCap((prev) => clamp(prev, gpuPowerMinBound, gpuPowerMaxBound));
  }, [gpuPowerMinBound, gpuPowerMaxBound]);

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
                  onValueChange={(v) => setGpuSMRange([v[0] ?? gpuSMRange[0], v[1] ?? gpuSMRange[1]])}
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
                  gpuIndex,
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
                  gpuIndex,
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
