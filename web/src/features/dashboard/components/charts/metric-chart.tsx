"use client";

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

type MetricChartProps = {
  title: string;
  yLabel: string;
  data: Array<Record<string, number | string>>;
  lines: ChartLineDef[];
  yDomain?: [number | "auto" | "dataMin" | "dataMax", number | "auto" | "dataMin" | "dataMax"];
};

export function MetricChart({ title, yLabel, data, lines, yDomain }: MetricChartProps) {
  return (
    <div className="border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900">{title}</div>
      <div className="h-56 w-full px-2 py-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="2 2" />
            <XAxis dataKey="time" minTickGap={30} />
            <YAxis
              width={70}
              domain={yDomain ?? ["auto", "auto"]}
              label={{ value: yLabel, angle: -90, position: "insideLeft" }}
            />
            <Tooltip />
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
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
