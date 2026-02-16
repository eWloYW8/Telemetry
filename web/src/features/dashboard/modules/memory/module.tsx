"use client";

import { useMemo } from "react";
import { MemoryStick } from "lucide-react";

import { MetricChart } from "../../components/charts/metric-chart";
import type { RawHistorySample } from "../../types";
import { maxOr } from "../../utils/rates";
import { nsToTimeLabel } from "../../utils/time";
import { formatBytes } from "../../utils/units";
import { moduleMeta, numField } from "../shared/data";
import { Section, StatRow } from "../shared/section";

type MemoryModuleViewProps = {
  registration: Record<string, any> | null;
  latestRaw: Record<string, Record<string, any>>;
  historyByCategory: Record<string, RawHistorySample[]>;
};

export function MemoryModuleView({ registration, latestRaw, historyByCategory }: MemoryModuleViewProps) {
  const memoryMeta = moduleMeta(registration, "memory");
  const memoryRaw = latestRaw.memory?.memoryMetrics ?? latestRaw.memory?.memory_metrics ?? null;

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

  return (
    <>
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
        lines={[
          { key: "usedGB", label: "Used", color: "#b91c1c" },
          { key: "cachedGB", label: "Cached", color: "#0f766e" },
        ]}
        yDomain={[0, maxOr(numField(memoryMeta?.static, "totalBytes", "total_bytes") / 1024 / 1024 / 1024, 1)]}
      />
    </>
  );
}
