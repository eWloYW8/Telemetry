"use client";

import { useMemo } from "react";
import { Network } from "lucide-react";

import { MetricChart } from "../../components/charts/metric-chart";
import type { ChartLineDef, RawHistorySample } from "../../types";
import { deltaRate } from "../../utils/rates";
import { nsToTimeLabel } from "../../utils/time";
import { formatBytes, formatNumber } from "../../utils/units";
import { linePalette, numField, sampledAtNs, strField } from "../shared/data";
import { Section } from "../shared/section";

type NetworkModuleViewProps = {
  latestRaw: Record<string, Record<string, any>>;
  historyByCategory: Record<string, RawHistorySample[]>;
};

export function NetworkModuleView({ latestRaw, historyByCategory }: NetworkModuleViewProps) {
  const networkRaw = latestRaw.network?.networkMetrics ?? latestRaw.network?.network_metrics ?? null;
  const networkIfsRaw = (networkRaw?.interfaces ?? []) as Array<Record<string, any>>;

  const networkRows = useMemo(
    () => [...networkIfsRaw].sort((a, b) => strField(a, "name").localeCompare(strField(b, "name"))),
    [networkIfsRaw],
  );

  const networkInterfaceNames = useMemo(() => {
    const names = new Set<string>();
    for (const ifc of networkIfsRaw) {
      const name = strField(ifc, "name");
      if (name) names.add(name);
    }
    for (const item of historyByCategory.network ?? []) {
      const ifs = ((item.sample.networkMetrics ?? item.sample.network_metrics ?? {}).interfaces ?? []) as Array<
        Record<string, any>
      >;
      for (const itf of ifs) {
        const name = strField(itf, "name");
        if (name) names.add(name);
      }
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [networkIfsRaw, historyByCategory.network]);

  const mkLines = (prefix: string): ChartLineDef[] =>
    networkInterfaceNames.map((name, idx) => ({
      key: `${prefix}_${idx}`,
      label: name,
      color: linePalette[idx % linePalette.length],
    }));

  const networkRxLines = useMemo(() => mkLines("if_rx_mb"), [networkInterfaceNames]);
  const networkTxLines = useMemo(() => mkLines("if_tx_mb"), [networkInterfaceNames]);

  const networkPerIfSeries = useMemo(() => {
    const list = historyByCategory.network ?? [];
    if (networkInterfaceNames.length === 0) return [] as Array<Record<string, number | string>>;

    const ifIndex = new Map<string, number>();
    for (let i = 0; i < networkInterfaceNames.length; i += 1) {
      ifIndex.set(networkInterfaceNames[i], i);
    }

    const rows: Array<Record<string, number | string>> = [];
    for (let i = 1; i < list.length; i += 1) {
      const prev = list[i - 1];
      const cur = list[i];
      const prevIfs = ((prev.sample.networkMetrics ?? prev.sample.network_metrics ?? {}).interfaces ?? []) as Array<
        Record<string, any>
      >;
      const curIfs = ((cur.sample.networkMetrics ?? cur.sample.network_metrics ?? {}).interfaces ?? []) as Array<
        Record<string, any>
      >;

      const prevByName = new Map<string, Record<string, any>>();
      for (const p of prevIfs) prevByName.set(strField(p, "name"), p);

      const row: Record<string, number | string> = {
        tsNs: cur.atNs.toString(),
        time: nsToTimeLabel(cur.atNs),
      };
      for (const c of curIfs) {
        const name = strField(c, "name");
        const idx = ifIndex.get(name);
        if (idx === undefined) continue;
        const p = prevByName.get(name);
        if (!p) continue;

        const curTs = sampledAtNs(c, cur.atNs);
        const prevTs = sampledAtNs(p, prev.atNs);
        const rxRate = deltaRate(
          numField(c, "rxBytes", "rx_bytes"),
          numField(p, "rxBytes", "rx_bytes"),
          curTs,
          prevTs,
        );
        const txRate = deltaRate(
          numField(c, "txBytes", "tx_bytes"),
          numField(p, "txBytes", "tx_bytes"),
          curTs,
          prevTs,
        );
        if (rxRate !== null) row[`if_rx_mb_${idx}`] = rxRate / 1024 / 1024;
        if (txRate !== null) row[`if_tx_mb_${idx}`] = txRate / 1024 / 1024;
      }

      rows.push(row);
    }
    return rows;
  }, [historyByCategory.network, networkInterfaceNames]);

  return (
    <>
      <Section title="Network Snapshot" icon={<Network className="h-4 w-4" />}>
        <div className="w-full overflow-x-auto rounded-lg border border-slate-200 text-[11px]">
          <table className="w-full min-w-[780px] table-auto">
            <thead className="sticky top-0 z-20 bg-slate-50">
              <tr>
                <th className="border-b border-slate-200 px-3 py-1 text-left font-medium uppercase tracking-wide text-slate-600">
                  Interface
                </th>
                <th className="border-b border-slate-200 px-3 py-1 text-left font-medium uppercase tracking-wide text-slate-600">
                  IPs
                </th>
                <th className="border-b border-slate-200 px-3 py-1 text-left font-medium uppercase tracking-wide text-slate-600">
                  RX Bytes
                </th>
                <th className="border-b border-slate-200 px-3 py-1 text-left font-medium uppercase tracking-wide text-slate-600">
                  TX Bytes
                </th>
                <th className="border-b border-slate-200 px-3 py-1 text-left font-medium uppercase tracking-wide text-slate-600">
                  RX Packets
                </th>
                <th className="border-b border-slate-200 px-3 py-1 text-left font-medium uppercase tracking-wide text-slate-600">
                  TX Packets
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {networkRows.map((itf) => (
                <tr key={`if-${strField(itf, "name")}`} className="hover:bg-slate-50">
                  <td className="px-3 py-0.5 whitespace-nowrap font-mono">{strField(itf, "name") || "-"}</td>
                  <td
                    className="max-w-[360px] overflow-hidden text-ellipsis px-3 py-0.5 whitespace-nowrap"
                    title={((itf.ips ?? []) as string[]).join(", ") || "-"}
                  >
                    {((itf.ips ?? []) as string[]).join(", ") || "-"}
                  </td>
                  <td className="px-3 py-0.5 whitespace-nowrap font-mono">
                    {formatBytes(numField(itf, "rxBytes", "rx_bytes"))}
                  </td>
                  <td className="px-3 py-0.5 whitespace-nowrap font-mono">
                    {formatBytes(numField(itf, "txBytes", "tx_bytes"))}
                  </td>
                  <td className="px-3 py-0.5 whitespace-nowrap font-mono">
                    {formatNumber(numField(itf, "rxPackets", "rx_packets"), 0)}
                  </td>
                  <td className="px-3 py-0.5 whitespace-nowrap font-mono">
                    {formatNumber(numField(itf, "txPackets", "tx_packets"), 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <div className="grid gap-3 lg:grid-cols-2">
        <MetricChart
          chartId="network-rx-bytes"
          title="Network RX Bytes"
          yLabel="MB/s"
          data={networkPerIfSeries}
          lines={networkRxLines}
          yDomain={[0, "auto"]}
        />
        <MetricChart
          chartId="network-tx-bytes"
          title="Network TX Bytes"
          yLabel="MB/s"
          data={networkPerIfSeries}
          lines={networkTxLines}
          yDomain={[0, "auto"]}
        />
      </div>
    </>
  );
}
