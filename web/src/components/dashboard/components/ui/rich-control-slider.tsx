"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

import { cn } from "@/lib/utils";

type RichControlSliderProps = {
  className?: string;
  sliderClassName?: string;
  value?: number[];
  defaultValue?: number[];
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  currentValue?: number | null;
  valueFormatter?: (value: number) => string;
  tickFormatter?: (value: number) => string;
  majorTickStep?: number;
  minorTicksPerMajor?: number;
  showValueBadges?: boolean;
  onValueChange?: (value: number[]) => void;
  onValueCommit?: (value: number[]) => void;
};

function clampNumber(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function niceStep(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  const scaled = value / power;
  if (scaled <= 1) return power;
  if (scaled <= 2) return 2 * power;
  if (scaled <= 5) return 5 * power;
  return 10 * power;
}

function roundByStep(value: number, step: number): number {
  const digits = Math.max(0, Math.min(6, -Math.floor(Math.log10(step)) + 1));
  return Number(value.toFixed(digits));
}

function normalizeValues(input: number[], count: number, min: number, max: number, step: number): number[] {
  const safeStep = step > 0 ? step : 1;
  const align = (raw: number) => {
    const clamped = clampNumber(raw, min, max);
    const snapped = min + Math.round((clamped - min) / safeStep) * safeStep;
    return roundByStep(clampNumber(snapped, min, max), safeStep);
  };

  const prepared = input.length > 0 ? input.slice(0, count).map(align) : [align(min)];
  while (prepared.length < count) {
    prepared.push(prepared[prepared.length - 1] ?? align(min));
  }

  if (prepared.length > 1) prepared.sort((a, b) => a - b);
  return prepared;
}

export function RichControlSlider({
  className,
  sliderClassName,
  value,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  currentValue = null,
  valueFormatter,
  tickFormatter,
  majorTickStep,
  minorTicksPerMajor = 4,
  showValueBadges = true,
  onValueChange,
  onValueCommit,
}: RichControlSliderProps) {
  const count = Math.max(1, Array.isArray(value) && value.length > 0 ? value.length : (defaultValue?.length ?? 1));
  const isControlled = Array.isArray(value);

  const [innerValues, setInnerValues] = useState<number[]>(() =>
    normalizeValues(defaultValue ?? value ?? [min], count, min, max, step),
  );

  useEffect(() => {
    if (isControlled) return;
    setInnerValues((prev) => normalizeValues(prev, count, min, max, step));
  }, [isControlled, count, min, max, step]);

  const values = useMemo(
    () => normalizeValues((isControlled ? value : innerValues) ?? [min], count, min, max, step),
    [isControlled, value, innerValues, count, min, max, step],
  );

  const trackRef = useRef<HTMLDivElement | null>(null);
  const moveHandlerRef = useRef<((ev: PointerEvent) => void) | null>(null);
  const upHandlerRef = useRef<((ev: PointerEvent) => void) | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [trackWidth, setTrackWidth] = useState(0);

  const range = max > min ? max - min : 1;
  const toPercent = (raw: number) => ((clampNumber(raw, min, max) - min) / range) * 100;
  const valueFromClientX = (clientX: number): number => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return min;
    const ratio = clampNumber((clientX - rect.left) / rect.width, 0, 1);
    return min + ratio * (max - min);
  };

  const renderTick = (raw: number) => (tickFormatter ? tickFormatter(raw) : String(Math.round(raw)));
  const renderInline = (raw: number) =>
    tickFormatter ? tickFormatter(raw) : valueFormatter ? valueFormatter(raw) : String(Math.round(raw));

  const majorStep = useMemo(() => {
    if (majorTickStep && Number.isFinite(majorTickStep) && majorTickStep > 0) return majorTickStep;
    return niceStep((max - min) / 10);
  }, [majorTickStep, min, max]);

  const majorTicks = useMemo(() => {
    if (max <= min) return [min];
    const ticks = [min];
    for (let tick = min + majorStep; tick < max; tick += majorStep) {
      const next = roundByStep(tick, majorStep);
      if (next > min && next < max) ticks.push(next);
      if (ticks.length >= 60) break;
    }
    ticks.push(max);
    return Array.from(new Set(ticks)).sort((a, b) => a - b);
  }, [min, max, majorStep]);

  const minorTicks = useMemo(() => {
    if (majorTicks.length < 2) return [] as number[];
    const partitions = Math.max(2, Math.min(8, Math.floor(minorTicksPerMajor)));
    const ticks: number[] = [];
    for (let i = 0; i < majorTicks.length - 1; i += 1) {
      const start = majorTicks[i];
      const end = majorTicks[i + 1];
      const width = end - start;
      if (width <= 0) continue;
      const minorStep = width / partitions;
      for (let j = 1; j < partitions; j += 1) {
        const raw = start + minorStep * j;
        if (raw > min && raw < max) ticks.push(roundByStep(raw, minorStep));
      }
      if (ticks.length >= 140) break;
    }
    return Array.from(new Set(ticks)).sort((a, b) => a - b);
  }, [majorTicks, min, max, minorTicksPerMajor]);

  const majorLabelStride = useMemo(() => Math.max(1, Math.ceil(majorTicks.length / 14)), [majorTicks.length]);
  const estimateTickLabelWidthPx = (text: string) => Math.max(16, text.length * 6.1 + 4);
  const onlyShowBoundaryTickLabels = (() => {
    if (majorTicks.length <= 2 || trackWidth <= 0) return false;

    let prevRight = -Infinity;
    for (let index = 0; index < majorTicks.length; index += 1) {
      const tick = majorTicks[index];
      const shouldShowByStride =
        majorTicks.length <= 14 || index === 0 || index === majorTicks.length - 1 || index % majorLabelStride === 0;
      if (!shouldShowByStride) continue;

      const center = ((clampNumber(tick, min, max) - min) / range) * trackWidth;
      const label = renderTick(tick);
      const half = estimateTickLabelWidthPx(label) / 2;
      const left = center - half;
      const right = center + half;
      if (left <= prevRight + 2) return true;
      prevRight = Math.max(prevRight, right);
    }
    return false;
  })();

  const updateValues = (thumbIndex: number, rawValue: number, commit: boolean) => {
    const next = values.slice();
    next[thumbIndex] = rawValue;

    if (next.length > 1) {
      if (thumbIndex > 0) next[thumbIndex] = Math.max(next[thumbIndex], next[thumbIndex - 1]);
      if (thumbIndex < next.length - 1) next[thumbIndex] = Math.min(next[thumbIndex], next[thumbIndex + 1]);
    }

    const normalized = normalizeValues(next, count, min, max, step);
    if (!isControlled) setInnerValues(normalized);
    onValueChange?.(normalized);
    if (commit) onValueCommit?.(normalized);
  };

  const stopDragging = () => {
    setIsDragging(false);
    if (moveHandlerRef.current) {
      window.removeEventListener("pointermove", moveHandlerRef.current);
      moveHandlerRef.current = null;
    }
    if (upHandlerRef.current) {
      window.removeEventListener("pointerup", upHandlerRef.current);
      upHandlerRef.current = null;
    }
  };

  useEffect(() => stopDragging, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const update = () => setTrackWidth(el.getBoundingClientRect().width || 0);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const startDragging = (thumbIndex: number, clientX: number) => {
    if (disabled) return;
    stopDragging();
    setIsDragging(true);

    updateValues(thumbIndex, valueFromClientX(clientX), false);

    const onMove = (ev: PointerEvent) => {
      updateValues(thumbIndex, valueFromClientX(ev.clientX), false);
    };
    const onUp = (ev: PointerEvent) => {
      updateValues(thumbIndex, valueFromClientX(ev.clientX), true);
      stopDragging();
    };

    moveHandlerRef.current = onMove;
    upHandlerRef.current = onUp;
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const onTrackPointerDown = (clientX: number) => {
    if (disabled) return;
    const nextRaw = valueFromClientX(clientX);
    let thumbIndex = 0;
    if (values.length > 1) {
      let distance = Math.abs(values[0] - nextRaw);
      for (let i = 1; i < values.length; i += 1) {
        const d = Math.abs(values[i] - nextRaw);
        if (d < distance) {
          distance = d;
          thumbIndex = i;
        }
      }
    }
    startDragging(thumbIndex, clientX);
  };

  const onThumbKeyDown = (index: number, ev: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const base = ev.shiftKey ? step * 10 : step;
    let nextRaw = values[index];

    if (ev.key === "ArrowLeft" || ev.key === "ArrowDown") nextRaw -= base;
    else if (ev.key === "ArrowRight" || ev.key === "ArrowUp") nextRaw += base;
    else if (ev.key === "PageDown") nextRaw -= step * 10;
    else if (ev.key === "PageUp") nextRaw += step * 10;
    else if (ev.key === "Home") nextRaw = min;
    else if (ev.key === "End") nextRaw = max;
    else return;

    ev.preventDefault();
    updateValues(index, nextRaw, true);
  };

  const hasCurrentMarker = Number.isFinite(currentValue) && currentValue !== null;
  const thumbTargetPercents = useMemo(() => values.map((entry) => toPercent(entry)), [values, min, max]);
  const currentTargetPercent = useMemo(
    () => (hasCurrentMarker ? toPercent(currentValue as number) : null),
    [hasCurrentMarker, currentValue, min, max],
  );
  const [thumbDisplayPercents, setThumbDisplayPercents] = useState<number[]>(thumbTargetPercents);
  const [currentDisplayPercent, setCurrentDisplayPercent] = useState<number | null>(currentTargetPercent);
  const thumbDisplayRef = useRef<number[]>(thumbTargetPercents);
  const currentDisplayRef = useRef<number | null>(currentTargetPercent);

  useEffect(() => {
    thumbDisplayRef.current = thumbDisplayPercents;
  }, [thumbDisplayPercents]);

  useEffect(() => {
    currentDisplayRef.current = currentDisplayPercent;
  }, [currentDisplayPercent]);

  useEffect(() => {
    let raf = 0;
    const alphaThumb = 0.9;
    const alphaCurrent = 0.5;
    const epsilon = 0.005;

    const tick = () => {
      let needNext = false;

      const baseThumb =
        thumbDisplayRef.current.length === thumbTargetPercents.length
          ? thumbDisplayRef.current
          : thumbTargetPercents;
      const nextThumb = isDragging
        ? thumbTargetPercents
        : baseThumb.map((entry, index) => {
            const target = thumbTargetPercents[index] ?? entry;
            const delta = target - entry;
            if (Math.abs(delta) <= epsilon) return target;
            needNext = true;
            return entry + delta * alphaThumb;
          });

      let thumbChanged = nextThumb.length !== thumbDisplayRef.current.length;
      if (!thumbChanged) {
        for (let i = 0; i < nextThumb.length; i += 1) {
          if (Math.abs(nextThumb[i] - thumbDisplayRef.current[i]) > 1e-6) {
            thumbChanged = true;
            break;
          }
        }
      }
      if (thumbChanged) {
        thumbDisplayRef.current = nextThumb;
        setThumbDisplayPercents(nextThumb);
      }

      let nextCurrent: number | null = null;
      if (currentTargetPercent !== null) {
        const base = currentDisplayRef.current ?? currentTargetPercent;
        const delta = currentTargetPercent - base;
        if (Math.abs(delta) <= epsilon) {
          nextCurrent = currentTargetPercent;
        } else {
          needNext = true;
          nextCurrent = base + delta * alphaCurrent;
        }
      }
      if (nextCurrent !== currentDisplayRef.current) {
        currentDisplayRef.current = nextCurrent;
        setCurrentDisplayPercent(nextCurrent);
      }

      if (needNext) raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [thumbTargetPercents, currentTargetPercent, isDragging]);

  const hasRange = values.length > 1;
  const showBadges = showValueBadges;
  const thumbTone = (index: number) => {
    if (hasRange && index === 0) return "bg-blue-500 ring-blue-200";
    return "bg-red-500 ring-red-200";
  };
  const thumbTextTone = (index: number) => {
    if (hasRange && index === 0) return "text-blue-700 dark:text-blue-300";
    return "text-red-700 dark:text-red-300";
  };
  const estimateLabelWidthPx = (text: string) => Math.max(28, text.length * 6.4 + 6);
  const thumbLabelOffsetByIndex = (() => {
    const offsets = new Map<number, number>();
    if (!showBadges || !hasRange || values.length < 2 || trackWidth <= 0) return offsets;

    const leftIndex = 0;
    const rightIndex = values.length - 1;
    const leftText = renderInline(values[leftIndex]);
    const rightText = renderInline(values[rightIndex]);
    const leftHalf = estimateLabelWidthPx(leftText) / 2;
    const rightHalf = estimateLabelWidthPx(rightText) / 2;
    const leftPx = (toPercent(values[leftIndex]) / 100) * trackWidth;
    const rightPx = (toPercent(values[rightIndex]) / 100) * trackWidth;
    const gap = 6;
    const baselineDistance = rightPx - leftPx;
    const requiredDistance = leftHalf + rightHalf + gap;
    let need = Math.max(0, requiredDistance - baselineDistance);
    if (need <= 0) return offsets;
    const leftCap = Math.max(0, leftPx - leftHalf - 2);
    const rightCap = Math.max(0, trackWidth - (rightPx + rightHalf) - 2);

    // Relative offsets are computed from no-squeeze baseline centers.
    const idealEach = need / 2;
    let shiftLeft = Math.min(idealEach, leftCap);
    let shiftRight = Math.min(idealEach, rightCap);
    need -= shiftLeft + shiftRight;

    if (need > 0) {
      const leftRemain = Math.max(0, leftCap - shiftLeft);
      const rightRemain = Math.max(0, rightCap - shiftRight);
      if (rightRemain >= leftRemain) {
        const addRight = Math.min(need, rightRemain);
        shiftRight += addRight;
        need -= addRight;
        if (need > 0) {
          const addLeft = Math.min(need, leftRemain);
          shiftLeft += addLeft;
          need -= addLeft;
        }
      } else {
        const addLeft = Math.min(need, leftRemain);
        shiftLeft += addLeft;
        need -= addLeft;
        if (need > 0) {
          const addRight = Math.min(need, rightRemain);
          shiftRight += addRight;
          need -= addRight;
        }
      }
    }

    if (shiftLeft > 0) offsets.set(leftIndex, -shiftLeft);
    if (shiftRight > 0) offsets.set(rightIndex, shiftRight);
    return offsets;
  })();

  const shouldHideCurrentLabel = (() => {
    if (!hasCurrentMarker || !showBadges || trackWidth <= 0) return false;
    const currentText = renderInline(currentValue as number);
    const currentPx = (toPercent(currentValue as number) / 100) * trackWidth;
    const currentHalf = estimateLabelWidthPx(currentText) / 2;
    for (let index = 0; index < values.length; index += 1) {
      const entry = values[index];
      const thumbText = renderInline(entry);
      const thumbShift = thumbLabelOffsetByIndex.get(index) ?? 0;
      const thumbPx = (toPercent(entry) / 100) * trackWidth + thumbShift;
      const thumbHalf = estimateLabelWidthPx(thumbText) / 2;
      if (Math.abs(currentPx - thumbPx) <= currentHalf + thumbHalf + 4) return true;
    }
    return false;
  })();

  return (
    <div className={cn("relative h-12", className, sliderClassName)}>
      <div className="absolute inset-y-0 left-3 right-3">
      <div
        ref={trackRef}
        className={cn(
          "absolute w-full h-2 bg-gray-200 rounded-full top-1/2 -translate-y-1/2",
          disabled && "opacity-60",
        )}
        onPointerDown={(ev) => {
          ev.preventDefault();
          onTrackPointerDown(ev.clientX);
        }}
      />

      {minorTicks.map((tick) => (
        <div
          key={`minor-${tick}`}
          className="absolute w-px h-1.5 bg-gray-300 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${toPercent(tick)}%`, top: "50%" }}
        />
      ))}

      {majorTicks.map((tick, index) => (
        <div
          key={`major-${tick}`}
          className="absolute w-px h-2 bg-gray-400 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${toPercent(tick)}%`, top: "50%" }}
        >
          {index === 0 ||
          index === majorTicks.length - 1 ||
          (!onlyShowBoundaryTickLabels &&
            (majorTicks.length <= 14 || index % majorLabelStride === 0)) ? (
            <div className="absolute -top-5 -translate-x-1/2 text-[10px] text-gray-500">{renderTick(tick)}</div>
          ) : null}
        </div>
      ))}

      {hasCurrentMarker ? (
        <div
          className="absolute w-3 h-3 bg-yellow-500 rounded-full -translate-x-1/2 -translate-y-1/2 ring-2 ring-yellow-200 pointer-events-none"
          style={{ left: `${currentDisplayPercent ?? currentTargetPercent ?? 0}%`, top: "50%" }}
        >
          {showBadges && !shouldHideCurrentLabel ? (
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-semibold text-yellow-700 dark:text-yellow-300">
              {renderInline(currentValue as number)}
            </div>
          ) : null}
        </div>
      ) : null}

      {values.map((entry, index) => {
        return (
          <button
            key={`${index}-${entry}`}
            type="button"
            role="slider"
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={entry}
            aria-disabled={disabled}
            disabled={disabled}
            className={cn(
              "absolute w-3 h-3 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-sm ring-2 transition cursor-move",
              thumbTone(index),
              disabled && "cursor-not-allowed opacity-60",
            )}
            style={{ left: `${thumbDisplayPercents[index] ?? thumbTargetPercents[index] ?? toPercent(entry)}%`, top: "50%" }}
            onPointerDown={(ev) => {
              ev.preventDefault();
              ev.stopPropagation();
              startDragging(index, ev.clientX);
            }}
            onKeyDown={(ev) => onThumbKeyDown(index, ev)}
          >
            {showBadges ? (
              <span
                className={cn(
                  "absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-semibold transition-[left] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  thumbTextTone(index),
                )}
                style={{ left: `calc(50% + ${thumbLabelOffsetByIndex.get(index) ?? 0}px)` }}
              >
                {renderInline(entry)}
              </span>
            ) : null}
          </button>
        );
      })}
      </div>
    </div>
  );
}
