"use client";

import { useCallback, useEffect, useRef } from "react";

export function useThrottledEmitter<T>(emit: (value: T) => void, intervalMs = 100) {
  const emitRef = useRef(emit);
  const lastSentAtRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const pendingRef = useRef<T | undefined>(undefined);

  useEffect(() => {
    emitRef.current = emit;
  }, [emit]);

  const clearPendingTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const emitNow = useCallback((value: T) => {
    emitRef.current(value);
    lastSentAtRef.current = Date.now();
  }, []);

  const send = useCallback(
    (value: T) => {
      pendingRef.current = value;
      const elapsed = Date.now() - lastSentAtRef.current;
      if (elapsed >= intervalMs) {
        clearPendingTimer();
        const ready = pendingRef.current;
        pendingRef.current = undefined;
        if (ready !== undefined) emitNow(ready);
        return;
      }
      if (timerRef.current !== null) return;
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        const ready = pendingRef.current;
        pendingRef.current = undefined;
        if (ready !== undefined) emitNow(ready);
      }, intervalMs - elapsed);
    },
    [intervalMs, clearPendingTimer, emitNow],
  );

  const flush = useCallback(
    (value?: T) => {
      if (value !== undefined) {
        pendingRef.current = value;
      }
      clearPendingTimer();
      const ready = pendingRef.current;
      pendingRef.current = undefined;
      if (ready !== undefined) emitNow(ready);
    },
    [clearPendingTimer, emitNow],
  );

  useEffect(() => {
    return () => {
      clearPendingTimer();
      pendingRef.current = undefined;
    };
  }, [clearPendingTimer]);

  return { send, flush };
}
