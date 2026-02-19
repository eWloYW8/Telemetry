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
import {
  defaultRichControlSliderGradientEnabled,
  loadRichControlSliderGradientEnabled,
  saveRichControlSliderGradientEnabled,
} from "../../state/ui-settings";

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
  const [richSliderGradientEnabled, setRichSliderGradientEnabled] = useState(defaultRichControlSliderGradientEnabled);

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

  useEffect(() => {
    setRichSliderGradientEnabled(loadRichControlSliderGradientEnabled());
  }, []);

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
          <label className="space-y-1">
            <div className="text-sm font-medium text-[var(--telemetry-text)]">RichControlSlider Gradient</div>
            <div className="flex h-10 items-center rounded-md border border-input bg-background px-3">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--telemetry-accent)]"
                checked={richSliderGradientEnabled}
                onChange={(e) => setRichSliderGradientEnabled(e.target.checked)}
              />
              <span className="ml-2 text-sm text-[var(--telemetry-text)]">Enable Gradient</span>
            </div>
          </label>
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
              saveRichControlSliderGradientEnabled(richSliderGradientEnabled);
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
              setRichSliderGradientEnabled(defaultRichControlSliderGradientEnabled);
              onSaveHistoryLimits(defaults);
              onSaveMinSampleIntervalMs(0);
              onSaveProcessMinSampleIntervalMs(0);
              saveRichControlSliderGradientEnabled(defaultRichControlSliderGradientEnabled);
            }}
          >
            Reset Defaults
          </Button>
        </div>
      </div>
    </Section>
  );
}
