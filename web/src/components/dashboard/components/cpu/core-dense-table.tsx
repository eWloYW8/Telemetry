"use client";

import {
  DenseTable,
  DenseTableBody,
  DenseTableCell,
  DenseTableFrame,
  DenseTableHead,
  DenseTableHeaderCell,
  DenseTableRow,
} from "../ui/dense-table";
import type { CpuCoreDenseRow } from "../../types";
import { formatKHz, formatNumber, formatPercent } from "../../utils/units";

type CpuCoreDenseTableProps = {
  rows: CpuCoreDenseRow[];
};

export function CpuCoreDenseTable({ rows }: CpuCoreDenseTableProps) {
  const utilBg = (utilPct: number): string => {
    const p = Math.max(0, Math.min(100, utilPct));
    const hue = 120 - p * 1.2;
    return `hsl(${hue} 70% 42%)`;
  };

  const tempClass = (tempC: number): string => {
    if (tempC >= 90) return "text-[var(--telemetry-danger)]";
    if (tempC >= 75) return "text-[var(--telemetry-warning)]";
    if (tempC >= 60) return "text-[var(--telemetry-accent)]";
    return "text-[var(--telemetry-success)]";
  };

  return (
    <DenseTableFrame>
      <DenseTable className="min-w-[1000px] table-fixed">
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
        <DenseTableHead>
          <tr>
            <DenseTableHeaderCell>Pkg</DenseTableHeaderCell>
            <DenseTableHeaderCell>Core</DenseTableHeaderCell>
            <DenseTableHeaderCell>Util %</DenseTableHeaderCell>
            <DenseTableHeaderCell>Current</DenseTableHeaderCell>
            <DenseTableHeaderCell>Min</DenseTableHeaderCell>
            <DenseTableHeaderCell>Max</DenseTableHeaderCell>
            <DenseTableHeaderCell>Governor</DenseTableHeaderCell>
            <DenseTableHeaderCell>Driver</DenseTableHeaderCell>
            <DenseTableHeaderCell>Temp</DenseTableHeaderCell>
          </tr>
        </DenseTableHead>
        <DenseTableBody>
          {rows.map((r) => (
            <DenseTableRow key={`${r.packageId}-${r.coreId}`}>
              <DenseTableCell className="font-mono">{r.packageId}</DenseTableCell>
              <DenseTableCell className="font-mono text-[var(--telemetry-muted-fg)]">{r.coreId}</DenseTableCell>
              <DenseTableCell>
                <div
                  className="inline-flex min-w-[74px] items-center justify-end rounded px-1.5 py-[1px] font-mono text-white"
                  style={{ background: utilBg(r.utilPct) }}
                >
                  {formatPercent(r.utilPct)}
                </div>
              </DenseTableCell>
              <DenseTableCell className="font-mono">{formatKHz(r.curKHz)}</DenseTableCell>
              <DenseTableCell className="font-mono text-[var(--telemetry-muted-fg)]">{formatKHz(r.minKHz)}</DenseTableCell>
              <DenseTableCell className="font-mono text-[var(--telemetry-muted-fg)]">{formatKHz(r.maxKHz)}</DenseTableCell>
              <DenseTableCell className="overflow-hidden text-ellipsis font-mono" title={r.governor || "-"}>
                {r.governor || "-"}
              </DenseTableCell>
              <DenseTableCell
                className="overflow-hidden text-ellipsis font-mono text-[var(--telemetry-muted-fg)]"
                title={r.driver || "-"}
              >
                {r.driver || "-"}
              </DenseTableCell>
              <DenseTableCell className={`font-mono ${tempClass(r.tempC)}`}>
                {r.tempC > 0 ? `${formatNumber(r.tempC)} C` : "-"}
              </DenseTableCell>
            </DenseTableRow>
          ))}
        </DenseTableBody>
      </DenseTable>
    </DenseTableFrame>
  );
}
