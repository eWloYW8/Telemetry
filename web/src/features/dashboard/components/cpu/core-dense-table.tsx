"use client";

import type { CpuCoreDenseRow } from "../../types";
import { formatKHz, formatNumber, formatPercent } from "../../utils/units";

type CpuCoreDenseTableProps = {
  rows: CpuCoreDenseRow[];
};

export function CpuCoreDenseTable({ rows }: CpuCoreDenseTableProps) {
  const utilBg = (utilPct: number): string => {
    const p = Math.max(0, Math.min(100, utilPct));
    const hue = 120 - p * 1.2;
    return `hsl(${hue} 70% 45%)`;
  };
  const tempClass = (tempC: number): string => {
    if (tempC >= 90) return "text-red-600";
    if (tempC >= 75) return "text-orange-600";
    if (tempC >= 60) return "text-amber-600";
    return "text-emerald-600";
  };

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-slate-200 text-[11px]">
      <table className="w-full min-w-[1000px] table-fixed">
        <colgroup>
          <col className="w-[6%]" />
          <col className="w-[7%]" />
          <col className="w-[12%]" />
          <col className="w-[13%]" />
          <col className="w-[13%]" />
          <col className="w-[13%]" />
          <col className="w-[13%]" />
          <col className="w-[13%]" />
          <col className="w-[10%]" />
        </colgroup>
        <thead className="sticky top-0 z-20 bg-slate-50">
          <tr>
            <th className="border-b border-slate-200 px-3 py-1 text-left font-medium uppercase tracking-wide text-slate-600">Pkg</th>
            <th className="border-b border-slate-200 px-3 py-1 text-left font-medium uppercase tracking-wide text-slate-600">Core</th>
            <th className="border-b border-slate-200 px-3 py-1 text-left font-medium uppercase tracking-wide text-slate-600">Util %</th>
            <th className="border-b border-slate-200 px-3 py-1 text-left font-medium uppercase tracking-wide text-slate-600">Current</th>
            <th className="border-b border-slate-200 px-3 py-1 text-left font-medium uppercase tracking-wide text-slate-600">Min</th>
            <th className="border-b border-slate-200 px-3 py-1 text-left font-medium uppercase tracking-wide text-slate-600">Max</th>
            <th className="border-b border-slate-200 px-3 py-1 text-left font-medium uppercase tracking-wide text-slate-600">Governor</th>
            <th className="border-b border-slate-200 px-3 py-1 text-left font-medium uppercase tracking-wide text-slate-600">Driver</th>
            <th className="border-b border-slate-200 px-3 py-1 text-left font-medium uppercase tracking-wide text-slate-600">Temp</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((r) => (
            <tr key={`${r.packageId}-${r.coreId}`} className="hover:bg-slate-50">
              <td className="px-3 py-0.5 font-mono whitespace-nowrap">{r.packageId}</td>
              <td className="px-3 py-0.5 font-mono whitespace-nowrap text-slate-500">{r.coreId}</td>
              <td className="px-3 py-0.5 whitespace-nowrap">
                <div
                  className="inline-flex min-w-[74px] items-center justify-end rounded px-1.5 py-[1px] font-mono text-white"
                  style={{ background: utilBg(r.utilPct) }}
                >
                  {formatPercent(r.utilPct)}
                </div>
              </td>
              <td className="px-3 py-0.5 font-mono whitespace-nowrap">{formatKHz(r.curKHz)}</td>
              <td className="px-3 py-0.5 font-mono whitespace-nowrap text-slate-600">{formatKHz(r.minKHz)}</td>
              <td className="px-3 py-0.5 font-mono whitespace-nowrap text-slate-600">{formatKHz(r.maxKHz)}</td>
              <td className="px-3 py-0.5 font-mono whitespace-nowrap overflow-hidden text-ellipsis" title={r.governor || "-"}>
                {r.governor || "-"}
              </td>
              <td className="px-3 py-0.5 font-mono whitespace-nowrap overflow-hidden text-ellipsis text-slate-500" title={r.driver || "-"}>
                {r.driver || "-"}
              </td>
              <td className={`px-3 py-0.5 font-mono whitespace-nowrap ${tempClass(r.tempC)}`}>
                {r.tempC > 0 ? `${formatNumber(r.tempC)} C` : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
