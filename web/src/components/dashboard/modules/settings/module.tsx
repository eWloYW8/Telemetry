"use client";

import { useEffect, useState } from "react";
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
  defaultChartRenderMaxPoints,
  defaultDashboardUpdateIntervalMs,
  defaultRichControlSliderGradientEnabled,
  loadChartRenderMaxPoints,
  loadDashboardUpdateIntervalMs,
  loadRichControlSliderGradientEnabled,
  normalizeChartRenderMaxPoints,
  normalizeDashboardUpdateIntervalMs,
  saveChartRenderMaxPoints,
  saveDashboardUpdateIntervalMs,
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

function GitHubSimpleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M12 .297C5.372.297 0 5.669 0 12.297c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.286-.01-1.04-.015-2.04-3.338.725-4.043-1.61-4.043-1.61-.546-1.385-1.333-1.753-1.333-1.753-1.09-.745.082-.729.082-.729 1.205.084 1.84 1.237 1.84 1.237 1.07 1.835 2.808 1.305 3.495.998.108-.776.42-1.305.764-1.605-2.666-.303-5.467-1.334-5.467-5.932 0-1.31.468-2.38 1.236-3.22-.124-.303-.536-1.523.117-3.176 0 0 1.008-.323 3.3 1.23.957-.266 1.983-.4 3.003-.405 1.02.005 2.046.139 3.004.405 2.29-1.553 3.297-1.23 3.297-1.23.655 1.653.243 2.873.12 3.176.77.84 1.235 1.91 1.235 3.22 0 4.61-2.806 5.625-5.48 5.922.432.372.816 1.103.816 2.222 0 1.606-.014 2.902-.014 3.297 0 .322.216.696.825.578C20.565 22.092 24 17.596 24 12.297 24 5.669 18.627.297 12 .297z" />
    </svg>
  );
}

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
  const [chartRenderMaxPointsValue, setChartRenderMaxPointsValue] = useState(String(defaultChartRenderMaxPoints));
  const [dashboardUpdateIntervalMsValue, setDashboardUpdateIntervalMsValue] = useState(
    String(defaultDashboardUpdateIntervalMs),
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

  useEffect(() => {
    setRichSliderGradientEnabled(loadRichControlSliderGradientEnabled());
    setChartRenderMaxPointsValue(String(loadChartRenderMaxPoints()));
    setDashboardUpdateIntervalMsValue(String(loadDashboardUpdateIntervalMs()));
  }, []);

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
          <label className="space-y-1">
            <div className="text-sm font-medium text-[var(--telemetry-text)]">Chart Max Render Points</div>
            <Input
              type="number"
              min={100}
              max={10000}
              step={50}
              value={chartRenderMaxPointsValue}
              onChange={(e) => setChartRenderMaxPointsValue(e.target.value)}
            />
          </label>
          <label className="space-y-1">
            <div className="text-sm font-medium text-[var(--telemetry-text)]">Dashboard Update Interval (ms)</div>
            <Input
              type="number"
              min={16}
              max={1000}
              step={10}
              value={dashboardUpdateIntervalMsValue}
              onChange={(e) => setDashboardUpdateIntervalMsValue(e.target.value)}
            />
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
              saveChartRenderMaxPoints(normalizeChartRenderMaxPoints(chartRenderMaxPointsValue));
              saveDashboardUpdateIntervalMs(normalizeDashboardUpdateIntervalMs(dashboardUpdateIntervalMsValue));
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
              setChartRenderMaxPointsValue(String(defaultChartRenderMaxPoints));
              setDashboardUpdateIntervalMsValue(String(defaultDashboardUpdateIntervalMs));
              onSaveHistoryLimits(defaults);
              onSaveMinSampleIntervalMs(0);
              onSaveProcessMinSampleIntervalMs(0);
              saveRichControlSliderGradientEnabled(defaultRichControlSliderGradientEnabled);
              saveChartRenderMaxPoints(defaultChartRenderMaxPoints);
              saveDashboardUpdateIntervalMs(defaultDashboardUpdateIntervalMs);
            }}
          >
            Reset Defaults
          </Button>
        </div>

        <div className="space-y-2 border-t border-[var(--telemetry-border-subtle)] pt-4">
          <Button size="sm" variant="outline" asChild>
            <a href="https://github.com/eWloYW8/Telemetry" target="_blank" rel="noreferrer">
              <GitHubSimpleIcon className="h-4 w-4" />
              View Telemetry on GitHub
            </a>
          </Button>
        </div>
      </div>
    </Section>
  );
}
