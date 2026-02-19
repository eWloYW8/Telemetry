"use client";

export const richControlSliderGradientEnabledStorageKey = "telemetry.rich-control-slider.gradient-enabled.v1";
export const defaultRichControlSliderGradientEnabled = true;
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
