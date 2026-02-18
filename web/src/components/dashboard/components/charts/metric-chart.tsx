"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { ChartLineDef } from "../../types";
import { nsToPreciseLabel, toBigIntNs } from "../../utils/time";
import { formatNumber } from "../../utils/units";

type MetricChartProps = {
  chartId: string;
  title: string;
  yLabel: string;
  data: Array<Record<string, number | string>>;
  lines: ChartLineDef[];
  yDomain?: [number | "auto" | "dataMin" | "dataMax", number | "auto" | "dataMin" | "dataMax"];
  showCurrentStatus?: boolean;
  currentValueFormatter?: (value: number, line: ChartLineDef) => string;
};

const windowOptions: Array<{ value: number; label: string }> = [
  { value: 1, label: "1s" },
  { value: 2, label: "2s" },
  { value: 5, label: "5s" },
  { value: 10, label: "10s" },
  { value: 30, label: "30s" },
  { value: 60, label: "1m" },
  { value: 120, label: "2m" },
  { value: 300, label: "5m" },
  { value: 600, label: "10m" },
  { value: 1800, label: "30m" },
  { value: 3600, label: "1h" },
];

const defaultWindowSec = 60;

function rowTsNs(row: Record<string, number | string>): bigint {
  return toBigIntNs((row.tsNs ?? row.ts_ns ?? 0) as string | number);
}

export function MetricChart({
  chartId,
  title,
  yLabel,
  data,
  lines,
  yDomain,
  showCurrentStatus = false,
  currentValueFormatter,
}: MetricChartProps) {
  const storageKey = `telemetry.chart.window.${chartId}`;
  const [windowSec, setWindowSec] = useState<number>(defaultWindowSec);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = Number(raw);
      if (!Number.isFinite(parsed)) return;
      if (!windowOptions.some((o) => o.value === parsed)) return;
      setWindowSec(parsed);
    } catch {
      // ignore localStorage errors
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, String(windowSec));
    } catch {
      // ignore localStorage errors
    }
  }, [storageKey, windowSec]);

  const { chartData, xDomain } = useMemo(() => {
    const fallbackLatest = BigInt(Date.now()) * 1_000_000n;
    if (data.length === 0) {
      const minTs = fallbackLatest - BigInt(windowSec) * 1_000_000_000n;
      return {
        chartData: [] as Array<Record<string, number | string>>,
        xDomain: [Number(minTs / 1_000_000n), Number(fallbackLatest / 1_000_000n)] as [number, number],
      };
    }

    let latest = 0n;
    const withTs = data.map((row) => {
      const ts = rowTsNs(row);
      if (ts > latest) latest = ts;
      return { row, ts };
    });
    if (latest <= 0n) {
      latest = fallbackLatest;
    }
    const minTs = latest - BigInt(windowSec) * 1_000_000_000n;
    const filtered = withTs.filter((x) => x.ts > 0n && x.ts >= minTs && x.ts <= latest);
    const rows = filtered.map((x) => ({
      ...x.row,
      __xMs: Number(x.ts / 1_000_000n),
    }));

    return {
      chartData: rows,
      xDomain: [Number(minTs / 1_000_000n), Number(latest / 1_000_000n)] as [number, number],
    };
  }, [data, windowSec]);

  const formatXAxisTick = (value: number): string => {
    const d = new Date(value);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    const milli = String(d.getMilliseconds()).padStart(3, "0");
    if (windowSec <= 10) {
      return `${mm}:${ss}.${milli}`;
    }
    return `${hh}:${mm}:${ss}`;
  };

  const renderTooltip = ({ active, payload }: { active?: boolean; payload?: readonly any[] }) => {
    if (!active || !payload || payload.length === 0) return null;
    const row = (payload[0]?.payload ?? {}) as Record<string, number | string>;
    const ts = rowTsNs(row);
    return (
      <div className="telemetry-panel min-w-[170px] p-2 shadow-md">
        <div className="mb-1 text-[11px] font-medium text-[var(--telemetry-text)]">
          {ts > 0n ? nsToPreciseLabel(ts) : "timestamp unavailable"}
        </div>
        <div className="space-y-0.5 text-[11px]">
          {payload.map((p, idx) => {
            const value = Number(p.value ?? 0);
            return (
              <div key={`${p.dataKey ?? idx}`} className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1 text-[var(--telemetry-muted-fg)]">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                  {String(p.name ?? p.dataKey)}
                </span>
                <span className="font-mono text-[var(--telemetry-text)]">{formatNumber(value, 3)}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const currentStatusItems = useMemo(() => {
    if (!showCurrentStatus) return [] as Array<{ line: ChartLineDef; text: string }>;
    return lines
      .map((line) => {
        let bestTs = -1n;
        let bestValue: number | null = null;

        for (const row of data) {
          const ts = rowTsNs(row);
          if (ts <= 0n) continue;
          const raw = row[line.key];
          const value = typeof raw === "number" ? raw : Number(raw);
          if (!Number.isFinite(value)) continue;
          if (ts >= bestTs) {
            bestTs = ts;
            bestValue = value;
          }
        }

        if (bestValue === null) {
          for (let i = data.length - 1; i >= 0; i -= 1) {
            const raw = data[i]?.[line.key];
            const value = typeof raw === "number" ? raw : Number(raw);
            if (Number.isFinite(value)) {
              bestValue = value;
              break;
            }
          }
        }

        if (bestValue === null) return null;
        const text = currentValueFormatter ? currentValueFormatter(bestValue, line) : formatNumber(bestValue, 3);
        return { line, text };
      })
      .filter((item): item is { line: ChartLineDef; text: string } => item !== null);
  }, [showCurrentStatus, lines, data, currentValueFormatter]);

  return (
    <div className="telemetry-panel overflow-hidden">
      <div className="telemetry-panel-header flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <div className="telemetry-title">{title}</div>
            {currentStatusItems.length > 0 ? (
              <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[14px] tracking-tight">
                {currentStatusItems.map((item) => (
                  <span key={`${chartId}-${item.line.key}`} className="inline-flex items-center gap-1">
                    {currentStatusItems.length > 1 ? (
                      <span style={{ color: item.line.color }}>{item.line.label}:</span>
                    ) : null}
                    <span className="text-[var(--telemetry-text)]">{item.text}</span>
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="telemetry-muted">Window</span>
          <Select value={String(windowSec)} onValueChange={(value) => setWindowSec(Number(value))}>
            <SelectTrigger size="sm" className="h-7 w-[84px] bg-[var(--telemetry-surface-soft)] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {windowOptions.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="h-56 w-full px-2 py-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid stroke="var(--telemetry-border-subtle)" strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="__xMs"
              domain={xDomain}
              allowDataOverflow
              tickFormatter={formatXAxisTick}
              minTickGap={18}
              tick={{ fill: "var(--telemetry-muted-fg)", fontSize: 11 }}
              axisLine={{ stroke: "var(--telemetry-border)" }}
              tickLine={{ stroke: "var(--telemetry-border)" }}
            />
            <YAxis
              width={70}
              domain={yDomain ?? ["auto", "auto"]}
              tickFormatter={(value) => formatNumber(Number(value), 3)}
              tick={{ fill: "var(--telemetry-muted-fg)", fontSize: 11 }}
              axisLine={{ stroke: "var(--telemetry-border)" }}
              tickLine={{ stroke: "var(--telemetry-border)" }}
              label={{ value: yLabel, angle: -90, position: "insideLeft", fill: "var(--telemetry-muted-fg)", fontSize: 11 }}
            />
            <Tooltip content={renderTooltip} cursor={{ stroke: "var(--telemetry-border-strong)" }} />
            <Legend
              iconSize={8}
              wrapperStyle={{ fontSize: "11px", color: "var(--telemetry-muted-fg)" }}
              formatter={(value) => <span style={{ color: "var(--telemetry-muted-fg)" }}>{String(value)}</span>}
            />
            {lines.map((line) => (
              <Line
                key={line.key}
                type="linear"
                dataKey={line.key}
                name={line.label}
                stroke={line.color}
                strokeWidth={2}
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
