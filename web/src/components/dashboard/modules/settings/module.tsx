"use client";

import { useEffect, useMemo, useState } from "react";
import { Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Section } from "../shared/section";
import {
  defaultHistoryLimits,
  normalizeHistoryLimitSettings,
  type HistoryLimitSettings,
} from "../../state/metric-history";

type SettingsModuleViewProps = {
  historyLimits: HistoryLimitSettings;
  minSampleIntervalMs: number;
  processMinSampleIntervalMs: number;
  onSaveHistoryLimits: (next: Partial<HistoryLimitSettings>) => void;
  onSaveMinSampleIntervalMs: (value: number) => void;
  onSaveProcessMinSampleIntervalMs: (value: number) => void;
};

export function SettingsModuleView({
  historyLimits,
  minSampleIntervalMs,
  processMinSampleIntervalMs,
  onSaveHistoryLimits,
  onSaveMinSampleIntervalMs,
  onSaveProcessMinSampleIntervalMs,
}: SettingsModuleViewProps) {
  const [perSeriesValue, setPerSeriesValue] = useState(String(historyLimits.perSeriesMaxPoints));
  const [totalValue, setTotalValue] = useState(String(historyLimits.totalMaxPoints));
  const [minSampleIntervalValue, setMinSampleIntervalValue] = useState(String(minSampleIntervalMs));
  const [processMinSampleIntervalValue, setProcessMinSampleIntervalValue] = useState(
    String(processMinSampleIntervalMs),
  );

  useEffect(() => {
    setPerSeriesValue(String(historyLimits.perSeriesMaxPoints));
    setTotalValue(String(historyLimits.totalMaxPoints));
  }, [historyLimits.perSeriesMaxPoints, historyLimits.totalMaxPoints]);

  useEffect(() => {
    setMinSampleIntervalValue(String(minSampleIntervalMs));
  }, [minSampleIntervalMs]);

  useEffect(() => {
    setProcessMinSampleIntervalValue(String(processMinSampleIntervalMs));
  }, [processMinSampleIntervalMs]);

  const normalizedPreview = useMemo(
    () =>
      normalizeHistoryLimitSettings({
        perSeriesMaxPoints: Number(perSeriesValue),
        totalMaxPoints: Number(totalValue),
      }),
    [perSeriesValue, totalValue],
  );

  return (
    <Section
      title="Settings"
      icon={<Settings2 className="h-4 w-4" />}
    >
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1">
            <div className="text-sm font-medium text-[var(--telemetry-text)]">Per Chart Max Points</div>
            <Input
              type="number"
              min={100}
              step={100}
              value={perSeriesValue}
              onChange={(e) => setPerSeriesValue(e.target.value)}
            />
          </label>
          <label className="space-y-1">
            <div className="text-sm font-medium text-[var(--telemetry-text)]">Total Max Points</div>
            <Input
              type="number"
              min={1000}
              step={1000}
              value={totalValue}
              onChange={(e) => setTotalValue(e.target.value)}
            />
          </label>
          <label className="space-y-1">
            <div className="text-sm font-medium text-[var(--telemetry-text)]">Min Sampling Interval (ms)</div>
            <Input
              type="number"
              min={0}
              step={10}
              value={minSampleIntervalValue}
              onChange={(e) => setMinSampleIntervalValue(e.target.value)}
            />
          </label>
          <label className="space-y-1">
            <div className="text-sm font-medium text-[var(--telemetry-text)]">Process Min Sampling Interval (ms)</div>
            <Input
              type="number"
              min={0}
              step={10}
              value={processMinSampleIntervalValue}
              onChange={(e) => setProcessMinSampleIntervalValue(e.target.value)}
            />
          </label>
        </div>

        <div className="rounded-md border border-[var(--telemetry-border)] bg-[var(--telemetry-surface-soft)] p-3 text-sm">
          <div className="font-medium text-[var(--telemetry-text)]">Effective Values</div>
          <div className="mt-1 text-[var(--telemetry-muted-fg)]">
            Per Chart Max Points: {normalizedPreview.perSeriesMaxPoints.toLocaleString()} points
          </div>
          <div className="text-[var(--telemetry-muted-fg)]">
            Total Max Points: {normalizedPreview.totalMaxPoints.toLocaleString()} points
          </div>
          <div className="text-[var(--telemetry-muted-fg)]">
            Min Sampling Interval: {Number(minSampleIntervalValue).toLocaleString()} ms
          </div>
          <div className="text-[var(--telemetry-muted-fg)]">
            Process Min Sampling Interval: {Number(processMinSampleIntervalValue).toLocaleString()} ms
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => {
              onSaveHistoryLimits({
                perSeriesMaxPoints: Number(perSeriesValue),
                totalMaxPoints: Number(totalValue),
              });
              onSaveMinSampleIntervalMs(Number(minSampleIntervalValue));
              onSaveProcessMinSampleIntervalMs(Number(processMinSampleIntervalValue));
            }}
          >
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const defaults = normalizeHistoryLimitSettings(defaultHistoryLimits);
              setPerSeriesValue(String(defaults.perSeriesMaxPoints));
              setTotalValue(String(defaults.totalMaxPoints));
              setMinSampleIntervalValue("0");
              setProcessMinSampleIntervalValue("0");
              onSaveHistoryLimits(defaults);
              onSaveMinSampleIntervalMs(0);
              onSaveProcessMinSampleIntervalMs(0);
            }}
          >
            Reset Defaults
          </Button>
        </div>
      </div>
    </Section>
  );
}
