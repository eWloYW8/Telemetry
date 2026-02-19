"use client";

import { useMemo } from "react";
import { Network } from "lucide-react";

import { MetricChart } from "../../components/charts/metric-chart";
import {
  DenseTable,
  DenseTableBody,
  DenseTableCell,
  DenseTableFrame,
  DenseTableHead,
  DenseTableHeaderCell,
  DenseTableRow,
} from "../../components/ui/dense-table";
import type { ChartLineDef, RawHistorySample } from "../../types";
import { deltaRate } from "../../utils/rates";
import { nsToTimeLabel } from "../../utils/time";
import { formatBytes, formatNumber } from "../../utils/units";
import { linePalette, numField, sampledAtNs, strField } from "../shared/data";
import { Section } from "../shared/section";

type InfiniBandModuleViewProps = {
  latestRaw: Record<string, Record<string, any>>;
  historyByCategory: Record<string, RawHistorySample[]>;
};

export function InfiniBandModuleView({ latestRaw, historyByCategory }: InfiniBandModuleViewProps) {
  const infinibandRaw = latestRaw.infiniband?.infinibandMetrics ?? latestRaw.infiniband?.infiniband_metrics ?? null;
  const infinibandIfsRaw = (infinibandRaw?.interfaces ?? []) as Array<Record<string, any>>;

  const infinibandRows = useMemo(
    () => [...infinibandIfsRaw].sort((a, b) => strField(a, "name").localeCompare(strField(b, "name"))),
    [infinibandIfsRaw],
  );

  const infinibandInterfaceNames = useMemo(() => {
    const names = new Set<string>();
    for (const ifc of infinibandIfsRaw) {
      const name = strField(ifc, "name");
      if (name) names.add(name);
    }
    for (const item of historyByCategory.infiniband ?? []) {
      const ifs = ((item.sample.infinibandMetrics ?? item.sample.infiniband_metrics ?? {}).interfaces ?? []) as Array<
        Record<string, any>
      >;
      for (const itf of ifs) {
        const name = strField(itf, "name");
        if (name) names.add(name);
      }
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [historyByCategory.infiniband, infinibandIfsRaw]);

  const mkLines = (prefix: string): ChartLineDef[] =>
    infinibandInterfaceNames.map((name, idx) => ({
      key: `${prefix}_${idx}`,
      label: name,
      color: linePalette[idx % linePalette.length],
    }));

  const infinibandRxLines = useMemo(() => mkLines("ib_rx_mb"), [infinibandInterfaceNames]);
  const infinibandTxLines = useMemo(() => mkLines("ib_tx_mb"), [infinibandInterfaceNames]);

  const infinibandPerIfSeries = useMemo(() => {
    const list = historyByCategory.infiniband ?? [];
    if (infinibandInterfaceNames.length === 0) return [] as Array<Record<string, number | string>>;

    const ifIndex = new Map<string, number>();
    for (let i = 0; i < infinibandInterfaceNames.length; i += 1) {
      ifIndex.set(infinibandInterfaceNames[i], i);
    }

    const rows: Array<Record<string, number | string>> = [];
    for (let i = 1; i < list.length; i += 1) {
      const prev = list[i - 1];
      const cur = list[i];
      const prevIfs = ((prev.sample.infinibandMetrics ?? prev.sample.infiniband_metrics ?? {}).interfaces ?? []) as Array<
        Record<string, any>
      >;
      const curIfs = ((cur.sample.infinibandMetrics ?? cur.sample.infiniband_metrics ?? {}).interfaces ?? []) as Array<
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
        const rxRate = deltaRate(numField(c, "rxBytes", "rx_bytes"), numField(p, "rxBytes", "rx_bytes"), curTs, prevTs);
        const txRate = deltaRate(numField(c, "txBytes", "tx_bytes"), numField(p, "txBytes", "tx_bytes"), curTs, prevTs);
        if (rxRate !== null) row[`ib_rx_mb_${idx}`] = rxRate / 1024 / 1024;
        if (txRate !== null) row[`ib_tx_mb_${idx}`] = txRate / 1024 / 1024;
      }
      rows.push(row);
    }
    return rows;
  }, [historyByCategory.infiniband, infinibandInterfaceNames]);

  return (
    <>
      <Section title="InfiniBand Snapshot" icon={<Network className="h-4 w-4" />}>
        <DenseTableFrame>
          <DenseTable className="min-w-[1100px] table-auto">
            <DenseTableHead>
              <tr>
                <DenseTableHeaderCell>Interface</DenseTableHeaderCell>
                <DenseTableHeaderCell>IB Device</DenseTableHeaderCell>
                <DenseTableHeaderCell>Port</DenseTableHeaderCell>
                <DenseTableHeaderCell>Address</DenseTableHeaderCell>
                <DenseTableHeaderCell>State</DenseTableHeaderCell>
                <DenseTableHeaderCell>Physical</DenseTableHeaderCell>
                <DenseTableHeaderCell>Rate</DenseTableHeaderCell>
                <DenseTableHeaderCell>MTU</DenseTableHeaderCell>
                <DenseTableHeaderCell>RX Bytes</DenseTableHeaderCell>
                <DenseTableHeaderCell>TX Bytes</DenseTableHeaderCell>
              </tr>
            </DenseTableHead>
            <DenseTableBody>
              {infinibandRows.map((itf) => (
                <DenseTableRow key={`ib-if-${strField(itf, "name")}`}>
                  <DenseTableCell className="font-mono">{strField(itf, "name") || "-"}</DenseTableCell>
                  <DenseTableCell className="font-mono">{strField(itf, "ibDevice", "ib_device") || "-"}</DenseTableCell>
                  <DenseTableCell className="font-mono">
                    {numField(itf, "port") > 0 ? formatNumber(numField(itf, "port"), 0) : "-"}
                  </DenseTableCell>
                  <DenseTableCell className="font-mono">{strField(itf, "address") || "-"}</DenseTableCell>
                  <DenseTableCell>{strField(itf, "linkState", "link_state") || strField(itf, "operState", "oper_state") || "-"}</DenseTableCell>
                  <DenseTableCell>{strField(itf, "physicalState", "physical_state") || "-"}</DenseTableCell>
                  <DenseTableCell>{strField(itf, "rate") || "-"}</DenseTableCell>
                  <DenseTableCell className="font-mono">
                    {numField(itf, "mtu") > 0 ? formatNumber(numField(itf, "mtu"), 0) : "-"}
                  </DenseTableCell>
                  <DenseTableCell className="font-mono">{formatBytes(numField(itf, "rxBytes", "rx_bytes"))}</DenseTableCell>
                  <DenseTableCell className="font-mono">{formatBytes(numField(itf, "txBytes", "tx_bytes"))}</DenseTableCell>
                </DenseTableRow>
              ))}
            </DenseTableBody>
          </DenseTable>
        </DenseTableFrame>
      </Section>

      <div className="grid gap-3 lg:grid-cols-2">
        <MetricChart
          chartId="infiniband-rx-bytes"
          title="InfiniBand RX Bytes"
          yLabel="MB/s"
          data={infinibandPerIfSeries}
          lines={infinibandRxLines}
          yDomain={[0, "auto"]}
        />
        <MetricChart
          chartId="infiniband-tx-bytes"
          title="InfiniBand TX Bytes"
          yLabel="MB/s"
          data={infinibandPerIfSeries}
          lines={infinibandTxLines}
          yDomain={[0, "auto"]}
        />
      </div>
    </>
  );
}
