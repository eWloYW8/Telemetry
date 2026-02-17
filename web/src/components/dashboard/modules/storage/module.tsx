"use client";

import { useMemo } from "react";
import { HardDrive } from "lucide-react";

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
import { formatBytes, formatPercent } from "../../utils/units";
import { linePalette, moduleMeta, numField, sampledAtNs, strField } from "../shared/data";
import { Section } from "../shared/section";

type StorageModuleViewProps = {
  latestRaw: Record<string, Record<string, any>>;
  registration: Record<string, any> | null;
  historyByCategory: Record<string, RawHistorySample[]>;
};

export function StorageModuleView({ latestRaw, registration, historyByCategory }: StorageModuleViewProps) {
  const storageMeta = moduleMeta(registration, "storage");
  const storageRaw = latestRaw.storage?.storageMetrics ?? latestRaw.storage?.storage_metrics ?? null;
  const storageDisksRaw = (storageRaw?.disks ?? []) as Array<Record<string, any>>;

  const storageRows = useMemo(
    () => [...storageDisksRaw].sort((a, b) => strField(a, "name").localeCompare(strField(b, "name"))),
    [storageDisksRaw],
  );

  const storageDiskNames = useMemo(() => {
    const names = new Set<string>();
    for (const disk of storageDisksRaw) {
      const name = strField(disk, "name");
      if (name) names.add(name);
    }
    for (const item of historyByCategory.storage ?? []) {
      const disks = ((item.sample.storageMetrics ?? item.sample.storage_metrics ?? {}).disks ?? []) as Array<
        Record<string, any>
      >;
      for (const d of disks) {
        const name = strField(d, "name");
        if (name) names.add(name);
      }
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [storageDisksRaw, historyByCategory.storage]);

  const mkLines = (prefix: string): ChartLineDef[] =>
    storageDiskNames.map((name, idx) => ({
      key: `${prefix}_${idx}`,
      label: name,
      color: linePalette[idx % linePalette.length],
    }));

  const storageReadThroughputLines = useMemo(() => mkLines("disk_read_mb"), [storageDiskNames]);
  const storageWriteThroughputLines = useMemo(() => mkLines("disk_write_mb"), [storageDiskNames]);
  const storageReadIopsLines = useMemo(() => mkLines("disk_read_iops"), [storageDiskNames]);
  const storageWriteIopsLines = useMemo(() => mkLines("disk_write_iops"), [storageDiskNames]);

  const storagePerDiskSeries = useMemo(() => {
    const list = historyByCategory.storage ?? [];
    if (storageDiskNames.length === 0) return [] as Array<Record<string, number | string>>;

    const diskIndex = new Map<string, number>();
    for (let i = 0; i < storageDiskNames.length; i += 1) {
      diskIndex.set(storageDiskNames[i], i);
    }

    const rows: Array<Record<string, number | string>> = [];
    for (let i = 1; i < list.length; i += 1) {
      const prev = list[i - 1];
      const cur = list[i];
      const prevDisks = ((prev.sample.storageMetrics ?? prev.sample.storage_metrics ?? {}).disks ?? []) as Array<
        Record<string, any>
      >;
      const curDisks = ((cur.sample.storageMetrics ?? cur.sample.storage_metrics ?? {}).disks ?? []) as Array<
        Record<string, any>
      >;

      const prevByName = new Map<string, Record<string, any>>();
      for (const p of prevDisks) prevByName.set(strField(p, "name"), p);

      const row: Record<string, number | string> = {
        tsNs: cur.atNs.toString(),
        time: nsToTimeLabel(cur.atNs),
      };

      for (const c of curDisks) {
        const name = strField(c, "name");
        const idx = diskIndex.get(name);
        if (idx === undefined) continue;
        const p = prevByName.get(name);
        if (!p) continue;

        const curTs = sampledAtNs(c, cur.atNs);
        const prevTs = sampledAtNs(p, prev.atNs);
        const readSectorsRate = deltaRate(
          numField(c, "readSectors", "read_sectors"),
          numField(p, "readSectors", "read_sectors"),
          curTs,
          prevTs,
        );
        const writeSectorsRate = deltaRate(
          numField(c, "writeSectors", "write_sectors"),
          numField(p, "writeSectors", "write_sectors"),
          curTs,
          prevTs,
        );
        const readRate = deltaRate(
          numField(c, "readIos", "read_ios"),
          numField(p, "readIos", "read_ios"),
          curTs,
          prevTs,
        );
        const writeRate = deltaRate(
          numField(c, "writeIos", "write_ios"),
          numField(p, "writeIos", "write_ios"),
          curTs,
          prevTs,
        );
        if (readSectorsRate !== null) row[`disk_read_mb_${idx}`] = (readSectorsRate * 512) / 1024 / 1024;
        if (writeSectorsRate !== null) row[`disk_write_mb_${idx}`] = (writeSectorsRate * 512) / 1024 / 1024;
        if (readRate !== null) row[`disk_read_iops_${idx}`] = readRate;
        if (writeRate !== null) row[`disk_write_iops_${idx}`] = writeRate;
      }
      rows.push(row);
    }
    return rows;
  }, [historyByCategory.storage, storageDiskNames]);

  return (
    <>
      <Section title="Storage Snapshot" icon={<HardDrive className="h-4 w-4" />}>
        <DenseTableFrame>
          <DenseTable className="min-w-[900px] table-auto">
            <DenseTableHead>
              <tr>
                <DenseTableHeaderCell>Disk</DenseTableHeaderCell>
                <DenseTableHeaderCell>Mount</DenseTableHeaderCell>
                <DenseTableHeaderCell>FS</DenseTableHeaderCell>
                <DenseTableHeaderCell>Total</DenseTableHeaderCell>
                <DenseTableHeaderCell>Used</DenseTableHeaderCell>
                <DenseTableHeaderCell>Free</DenseTableHeaderCell>
                <DenseTableHeaderCell>Usage %</DenseTableHeaderCell>
              </tr>
            </DenseTableHead>
            <DenseTableBody>
              {storageRows.map((d) => {
                const used = numField(d, "usedBytes", "used_bytes");
                const free = numField(d, "freeBytes", "free_bytes");
                const total = used + free;
                const staticInfo = (
                  (storageMeta?.staticDisks ?? storageMeta?.static_disks ?? []) as Array<Record<string, any>>
                ).find((s) => strField(s, "name") === strField(d, "name"));
                return (
                  <DenseTableRow key={`disk-${strField(d, "name")}`}>
                    <DenseTableCell className="font-mono">{strField(d, "name") || "-"}</DenseTableCell>
                    <DenseTableCell
                      className="max-w-[280px] overflow-hidden text-ellipsis"
                      title={strField(staticInfo, "mountpoint") || "-"}
                    >
                      {strField(staticInfo, "mountpoint") || "-"}
                    </DenseTableCell>
                    <DenseTableCell>{strField(staticInfo, "filesystem") || "-"}</DenseTableCell>
                    <DenseTableCell className="font-mono">{formatBytes(total)}</DenseTableCell>
                    <DenseTableCell className="font-mono">{formatBytes(used)}</DenseTableCell>
                    <DenseTableCell className="font-mono">{formatBytes(free)}</DenseTableCell>
                    <DenseTableCell className="font-mono">
                      {total > 0 ? formatPercent((used * 100) / total) : "0 %"}
                    </DenseTableCell>
                  </DenseTableRow>
                );
              })}
            </DenseTableBody>
          </DenseTable>
        </DenseTableFrame>
      </Section>

      <div className="grid gap-3 lg:grid-cols-2">
        <MetricChart
          chartId="storage-read-throughput"
          title="Disk Read Throughput"
          yLabel="MB/s"
          data={storagePerDiskSeries}
          lines={storageReadThroughputLines}
          yDomain={[0, "auto"]}
        />
        <MetricChart
          chartId="storage-write-throughput"
          title="Disk Write Throughput"
          yLabel="MB/s"
          data={storagePerDiskSeries}
          lines={storageWriteThroughputLines}
          yDomain={[0, "auto"]}
        />
        <MetricChart
          chartId="storage-read-iops"
          title="Disk Read IOPS"
          yLabel="ops/s"
          data={storagePerDiskSeries}
          lines={storageReadIopsLines}
          yDomain={[0, "auto"]}
        />
        <MetricChart
          chartId="storage-write-iops"
          title="Disk Write IOPS"
          yLabel="ops/s"
          data={storagePerDiskSeries}
          lines={storageWriteIopsLines}
          yDomain={[0, "auto"]}
        />
      </div>
    </>
  );
}
