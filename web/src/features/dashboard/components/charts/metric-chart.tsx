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

export function MetricChart({ chartId, title, yLabel, data, lines, yDomain }: MetricChartProps) {
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
      <div className="rounded border border-slate-200 bg-white p-2 shadow">
        <div className="mb-1 text-[11px] font-medium text-slate-700">
          {ts > 0n ? nsToPreciseLabel(ts) : "timestamp unavailable"}
        </div>
        <div className="space-y-0.5 text-[11px]">
          {payload.map((p, idx) => {
            const value = Number(p.value ?? 0);
            return (
              <div key={`${p.dataKey ?? idx}`} className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                  {String(p.name ?? p.dataKey)}
                </span>
                <span className="font-mono">{formatNumber(value, 3)}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Window</span>
          <select
            className="h-7 rounded border border-slate-300 bg-white px-2 text-xs text-slate-700"
            value={String(windowSec)}
            onChange={(e) => setWindowSec(Number(e.target.value))}
          >
            {windowOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="h-56 w-full px-2 py-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="2 2" />
            <XAxis
              type="number"
              dataKey="__xMs"
              domain={xDomain}
              allowDataOverflow
              tickFormatter={formatXAxisTick}
              minTickGap={18}
            />
            <YAxis
              width={70}
              domain={yDomain ?? ["auto", "auto"]}
              tickFormatter={(value) => formatNumber(Number(value), 3)}
              label={{ value: yLabel, angle: -90, position: "insideLeft" }}
            />
            <Tooltip content={renderTooltip} />
            <Legend />
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
