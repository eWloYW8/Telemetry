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
import {
  defaultChartRenderMaxPoints,
  loadChartRenderMaxPoints,
  uiSettingsChangedEventName,
} from "../../state/ui-settings";
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
  currentValueFormatter?: (value: number, line: ChartLineDef) => string | null;
  connectNulls?: boolean;
};

type ChartDataRow = Record<string, number | string> & { __xMs: number };

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

function downsampleRows(rows: ChartDataRow[], maxPoints: number): ChartDataRow[] {
  if (rows.length <= maxPoints) return rows;
  if (maxPoints <= 2) return [rows[0], rows[rows.length - 1]];

  const next: ChartDataRow[] = [];
  const step = (rows.length - 1) / (maxPoints - 1);
  let lastIdx = -1;

  for (let i = 0; i < maxPoints; i += 1) {
    const idx = i === maxPoints - 1 ? rows.length - 1 : Math.round(i * step);
    if (idx === lastIdx) continue;
    next.push(rows[idx]);
    lastIdx = idx;
  }
  if (next[next.length - 1] !== rows[rows.length - 1]) {
    next.push(rows[rows.length - 1]);
  }
  return next;
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
  connectNulls = false,
}: MetricChartProps) {
  const storageKey = `telemetry.chart.window.${chartId}`;
  const [windowSec, setWindowSec] = useState<number>(defaultWindowSec);
  const [maxRenderPoints, setMaxRenderPoints] = useState<number>(defaultChartRenderMaxPoints);

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

  useEffect(() => {
    const sync = () => setMaxRenderPoints(loadChartRenderMaxPoints());
    sync();
    window.addEventListener(uiSettingsChangedEventName, sync);
    return () => window.removeEventListener(uiSettingsChangedEventName, sync);
  }, []);

  const { chartData, xDomain } = useMemo(() => {
    const fallbackLatest = BigInt(Date.now()) * 1_000_000n;
    if (data.length === 0) {
      const minTs = fallbackLatest - BigInt(windowSec) * 1_000_000_000n;
      return {
        chartData: [] as ChartDataRow[],
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
    const rows: ChartDataRow[] = filtered.map((x) => ({
      ...x.row,
      __xMs: Number(x.ts / 1_000_000n),
    }));

    return {
      chartData: downsampleRows(rows, maxRenderPoints),
      xDomain: [Number(minTs / 1_000_000n), Number(latest / 1_000_000n)] as [number, number],
    };
  }, [data, windowSec, maxRenderPoints]);

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

  const renderTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: readonly any[];
    label?: number | string;
  }) => {
    if (!active) return null;

    const row = (payload?.[0]?.payload ?? {}) as Record<string, number | string>;
    const hoveredXMs =
      typeof row.__xMs === "number"
        ? row.__xMs
        : typeof label === "number"
          ? label
          : Number(label ?? NaN);

    const ts = (() => {
      const rowTs = rowTsNs(row);
      if (rowTs > 0n) return rowTs;
      if (Number.isFinite(hoveredXMs)) {
        return BigInt(Math.trunc(hoveredXMs)) * 1_000_000n;
      }
      return 0n;
    })();

    const payloadByKey = new Map<string, any>();
    for (const p of payload ?? []) {
      payloadByKey.set(String(p.dataKey ?? ""), p);
    }

    const tooltipItems = lines.map((line) => {
      const existing = payloadByKey.get(line.key);
      if (existing) {
        const value = Number(existing.value ?? 0);
        if (Number.isFinite(value)) {
          return { key: line.key, label: line.label, color: line.color, value };
        }
      }

      let nearestValue: number | null = null;
      let nearestDelta = Number.POSITIVE_INFINITY;
      let latestX = Number.NEGATIVE_INFINITY;
      let latestValue: number | null = null;
      for (let i = 0; i < chartData.length; i += 1) {
        const x = Number(chartData[i]?.__xMs ?? NaN);
        if (!Number.isFinite(x)) continue;
        const raw = chartData[i]?.[line.key];
        const value = typeof raw === "number" ? raw : Number(raw);
        if (!Number.isFinite(value)) continue;

        if (x >= latestX) {
          latestX = x;
          latestValue = value;
        }

        if (!Number.isFinite(hoveredXMs)) continue;
        const delta = Math.abs(x - hoveredXMs);
        if (delta < nearestDelta) {
          nearestDelta = delta;
          nearestValue = value;
        }
      }

      return {
        key: line.key,
        label: line.label,
        color: line.color,
        value: nearestValue ?? latestValue,
      };
    });

    return (
      <div className="telemetry-panel min-w-[170px] p-2 shadow-md">
        <div className="mb-1 text-[11px] font-medium text-[var(--telemetry-text)]">
          {ts > 0n ? nsToPreciseLabel(ts) : "timestamp unavailable"}
        </div>
        <div className="space-y-0.5 text-[11px]">
          {tooltipItems.map((item, idx) => {
            return (
              <div key={`${item.key ?? idx}`} className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1 text-[var(--telemetry-muted-fg)]">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.label}
                </span>
                <span className="font-mono text-[var(--telemetry-text)]">
                  {item.value === null ? "-" : formatNumber(item.value, 3)}
                </span>
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

        for (const row of chartData) {
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
          for (let i = chartData.length - 1; i >= 0; i -= 1) {
            const raw = chartData[i]?.[line.key];
            const value = typeof raw === "number" ? raw : Number(raw);
            if (Number.isFinite(value)) {
              bestValue = value;
              break;
            }
          }
        }

        if (bestValue === null) return null;
        const text = currentValueFormatter ? currentValueFormatter(bestValue, line) : formatNumber(bestValue, 3);
        if (!text) return null;
        return { line, text };
      })
      .filter((item): item is { line: ChartLineDef; text: string } => item !== null);
  }, [showCurrentStatus, lines, chartData, currentValueFormatter]);

  return (
    <div className="telemetry-panel overflow-hidden">
      <div className="telemetry-panel-header flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <div className="telemetry-title">{title}</div>
            {currentStatusItems.length > 0 ? (
              <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[16px] tracking-tight">
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
            <SelectContent align="end" position="popper" side="bottom" sideOffset={4} collisionPadding={8}>
              {windowOptions.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="h-80 w-full px-2 py-2">
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
            <Tooltip
              content={renderTooltip}
              cursor={{ stroke: "var(--telemetry-border-strong)" }}
              wrapperStyle={{ zIndex: 40, pointerEvents: "none" }}
            />
            <Legend
              iconSize={8}
              wrapperStyle={{ fontSize: "11px", color: "var(--telemetry-muted-fg)", zIndex: 10 }}
              formatter={(value) => <span style={{ color: "var(--telemetry-muted-fg)" }}>{String(value)}</span>}
            />
            {lines.map((line) => (
              <Line
                key={line.key}
                type="linear"
                dataKey={line.key}
                name={line.label}
                stroke={line.color}
                strokeWidth={0.8}
                dot={false}
                connectNulls={connectNulls}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
