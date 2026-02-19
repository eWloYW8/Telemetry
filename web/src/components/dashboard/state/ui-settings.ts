"use client";

export const richControlSliderGradientEnabledStorageKey = "telemetry.rich-control-slider.gradient-enabled.v1";
export const chartRenderMaxPointsStorageKey = "telemetry.chart.render-max-points.v1";
export const dashboardUpdateIntervalMsStorageKey = "telemetry.dashboard.update-interval-ms.v1";
export const defaultRichControlSliderGradientEnabled = true;
export const defaultChartRenderMaxPoints = 10000;
export const defaultDashboardUpdateIntervalMs = 20;
export const uiSettingsChangedEventName = "telemetry:ui-settings-changed";

export function normalizeRichControlSliderGradientEnabled(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "false" || normalized === "0" || normalized === "off" || normalized === "no") return false;
    if (normalized === "true" || normalized === "1" || normalized === "on" || normalized === "yes") return true;
  }
  return defaultRichControlSliderGradientEnabled;
}

export function loadRichControlSliderGradientEnabled(): boolean {
  if (typeof window === "undefined") return defaultRichControlSliderGradientEnabled;
  try {
    const raw = window.localStorage.getItem(richControlSliderGradientEnabledStorageKey);
    if (raw === null) return defaultRichControlSliderGradientEnabled;
    return normalizeRichControlSliderGradientEnabled(raw);
  } catch {
    return defaultRichControlSliderGradientEnabled;
  }
}

export function saveRichControlSliderGradientEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(richControlSliderGradientEnabledStorageKey, String(enabled));
  } catch {
    // ignore localStorage errors
  }
  window.dispatchEvent(new CustomEvent(uiSettingsChangedEventName));
}

export function normalizeChartRenderMaxPoints(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return defaultChartRenderMaxPoints;
  return Math.min(10000, Math.max(100, Math.floor(parsed)));
}

export function loadChartRenderMaxPoints(): number {
  if (typeof window === "undefined") return defaultChartRenderMaxPoints;
  try {
    const raw = window.localStorage.getItem(chartRenderMaxPointsStorageKey);
    if (raw === null) return defaultChartRenderMaxPoints;
    return normalizeChartRenderMaxPoints(raw);
  } catch {
    return defaultChartRenderMaxPoints;
  }
}

export function saveChartRenderMaxPoints(points: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(chartRenderMaxPointsStorageKey, String(normalizeChartRenderMaxPoints(points)));
  } catch {
    // ignore localStorage errors
  }
  window.dispatchEvent(new CustomEvent(uiSettingsChangedEventName));
}

export function normalizeDashboardUpdateIntervalMs(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return defaultDashboardUpdateIntervalMs;
  return Math.min(1000, Math.max(16, Math.floor(parsed)));
}

export function loadDashboardUpdateIntervalMs(): number {
  if (typeof window === "undefined") return defaultDashboardUpdateIntervalMs;
  try {
    const raw = window.localStorage.getItem(dashboardUpdateIntervalMsStorageKey);
    if (raw === null) return defaultDashboardUpdateIntervalMs;
    return normalizeDashboardUpdateIntervalMs(raw);
  } catch {
    return defaultDashboardUpdateIntervalMs;
  }
}

export function saveDashboardUpdateIntervalMs(intervalMs: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      dashboardUpdateIntervalMsStorageKey,
      String(normalizeDashboardUpdateIntervalMs(intervalMs)),
    );
  } catch {
    // ignore localStorage errors
  }
  window.dispatchEvent(new CustomEvent(uiSettingsChangedEventName));
}
