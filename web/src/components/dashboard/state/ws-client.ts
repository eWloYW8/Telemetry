"use client";

import { useEffect, useRef, useState } from "react";

import { telemetry as telemetryProto } from "@/lib/proto/telemetry";

import type { NodeRuntime } from "../types";
import { buildProtoCommand, nextCommandID } from "./commands";
import {
  applyHistoryLimits,
  countHistoryPoints,
  defaultHistoryLimits,
  normalizeHistoryLimitSettings,
  pushHistoryBatchWithTotal,
  type HistoryLimitSettings,
  type HistoryMap,
} from "./metric-history";
import { markStaleNodes } from "./node-store";
import {
  loadDashboardUpdateIntervalMs,
  uiSettingsChangedEventName,
} from "./ui-settings";
import { decodeWSEventFromBytes } from "./ws-message-decode";
import {
  defaultMinSampleIntervalMs,
  defaultProcessMinSampleIntervalMs,
  normalizeMinSampleIntervalMs,
} from "./ws-sample-filter";
import type { WorkerDecodedEvent, WorkerInboundMessage, WorkerMetricEvent, WorkerNodeEvent } from "./ws-worker-protocol";

export const wsCategories = [
  "cpu_ultra_fast",
  "cpu_medium",
  "gpu_fast",
  "memory",
  "storage",
  "network",
  "infiniband",
  "process",
] as const;

const staleAfterNs = 8_000_000_000n;
const commandTimeoutMs = 15_000;
const historyLimitsStorageKey = "telemetry.history.limits.v1";
const minSampleIntervalStorageKey = "telemetry.min-sample-interval-ms.v1";
const processMinSampleIntervalStorageKey = "telemetry.process-min-sample-interval-ms.v1";

type CommandDispatchResult = {
  ok: boolean;
  message: string;
};

type PendingCommand = {
  commandType: string;
  resolve: (result: CommandDispatchResult) => void;
  timeoutID: number;
};

function mergeNodeState(
  prev: NodeRuntime[],
  nodeEvents: WorkerNodeEvent[],
  metricEvents: WorkerMetricEvent[],
): NodeRuntime[] {
  if (nodeEvents.length === 0 && metricEvents.length === 0) {
    return prev;
  }

  const byNodeId = new Map<string, NodeRuntime>();
  for (const node of prev) {
    byNodeId.set(node.nodeId, node);
  }

  for (const event of nodeEvents) {
    const current = byNodeId.get(event.nodeId);
    byNodeId.set(event.nodeId, {
      nodeId: event.nodeId,
      connected: event.connected,
      lastSeenUnixNano: event.lastSeenUnixNano,
      sourceIP: event.sourceIP || current?.sourceIP || "",
      registration: (event.registration ?? current?.registration ?? null) as Record<string, any> | null,
      latestRaw: {
        ...(current?.latestRaw ?? {}),
        ...event.latestRaw,
      },
    });
  }

  for (const event of metricEvents) {
    const current = byNodeId.get(event.nodeId);
    byNodeId.set(event.nodeId, {
      nodeId: event.nodeId,
      connected: true,
      lastSeenUnixNano: event.atNs,
      sourceIP: current?.sourceIP ?? "",
      registration: current?.registration ?? null,
      latestRaw: {
        ...(current?.latestRaw ?? {}),
        [event.category]: event.sample,
      },
    });
  }

  return Array.from(byNodeId.values()).sort((a, b) => a.nodeId.localeCompare(b.nodeId));
}

export function useTelemetryWS() {
  const [wsConnected, setWsConnected] = useState(false);
  const [nodes, setNodes] = useState<NodeRuntime[]>([]);
  const [history, setHistory] = useState<HistoryMap>({});
  const [historyLimits, setHistoryLimitsState] = useState<HistoryLimitSettings>(
    normalizeHistoryLimitSettings(defaultHistoryLimits),
  );
  const [minSampleIntervalMs, setMinSampleIntervalMsState] = useState<number>(defaultMinSampleIntervalMs);
  const [processMinSampleIntervalMs, setProcessMinSampleIntervalMsState] = useState<number>(
    defaultProcessMinSampleIntervalMs,
  );

  const selectedNodeRef = useRef("");
  const socketRef = useRef<WebSocket | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const handleDecodedEventRef = useRef<(event: WorkerDecodedEvent) => void>(() => {});
  const pendingCommandsRef = useRef<Map<string, PendingCommand>>(new Map());
  const historyLimitsRef = useRef(historyLimits);
  const totalHistoryPointsRef = useRef(0);
  const minSampleIntervalMsRef = useRef(minSampleIntervalMs);
  const processMinSampleIntervalMsRef = useRef(processMinSampleIntervalMs);
  const fallbackLastAcceptedPointByStreamRef = useRef<Map<string, bigint>>(new Map());
  const decodeQueueRef = useRef<Array<WorkerNodeEvent | WorkerMetricEvent>>([]);
  const decodeFlushTimerRef = useRef<number | null>(null);
  const decodeBatchDelayMsRef = useRef<number>(20);

  useEffect(() => {
    historyLimitsRef.current = historyLimits;
  }, [historyLimits]);

  useEffect(() => {
    minSampleIntervalMsRef.current = minSampleIntervalMs;
  }, [minSampleIntervalMs]);

  useEffect(() => {
    processMinSampleIntervalMsRef.current = processMinSampleIntervalMs;
  }, [processMinSampleIntervalMs]);

  useEffect(() => {
    const sync = () => {
      decodeBatchDelayMsRef.current = loadDashboardUpdateIntervalMs();
    };
    sync();
    window.addEventListener(uiSettingsChangedEventName, sync);
    return () => window.removeEventListener(uiSettingsChangedEventName, sync);
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(historyLimitsStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<HistoryLimitSettings>;
      setHistoryLimitsState(normalizeHistoryLimitSettings(parsed));
    } catch {
      // ignore malformed persisted settings
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(historyLimitsStorageKey, JSON.stringify(historyLimits));
    } catch {
      // ignore localStorage errors
    }
  }, [historyLimits]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(minSampleIntervalStorageKey);
      if (!raw) return;
      setMinSampleIntervalMsState(normalizeMinSampleIntervalMs(raw));
    } catch {
      // ignore malformed persisted settings
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(minSampleIntervalStorageKey, String(minSampleIntervalMs));
    } catch {
      // ignore localStorage errors
    }
  }, [minSampleIntervalMs]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(processMinSampleIntervalStorageKey);
      if (!raw) return;
      setProcessMinSampleIntervalMsState(normalizeMinSampleIntervalMs(raw));
    } catch {
      // ignore malformed persisted settings
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(processMinSampleIntervalStorageKey, String(processMinSampleIntervalMs));
    } catch {
      // ignore localStorage errors
    }
  }, [processMinSampleIntervalMs]);

  const resolvePendingCommand = (commandID: string, result: CommandDispatchResult) => {
    const pending = pendingCommandsRef.current.get(commandID);
    if (!pending) return;
    window.clearTimeout(pending.timeoutID);
    pendingCommandsRef.current.delete(commandID);
    pending.resolve(result);
  };

  const failAllPendingCommands = (reason: string) => {
    const entries = Array.from(pendingCommandsRef.current.entries());
    for (const [commandID, pending] of entries) {
      window.clearTimeout(pending.timeoutID);
      pending.resolve({
        ok: false,
        message: `${pending.commandType}: ${reason}`,
      });
      pendingCommandsRef.current.delete(commandID);
    }
  };

  const flushDecodedQueue = () => {
    decodeFlushTimerRef.current = null;
    const queued = decodeQueueRef.current;
    if (queued.length === 0) return;

    decodeQueueRef.current = [];

    const nodeEvents: WorkerNodeEvent[] = [];
    const metricEvents: WorkerMetricEvent[] = [];

    for (const event of queued) {
      if (event.kind === "node") {
        nodeEvents.push(event);
      } else {
        metricEvents.push(event);
      }
    }

    if (metricEvents.length > 0) {
      setHistory((prev) => {
        const result = pushHistoryBatchWithTotal(
          prev,
          metricEvents.map((event) => ({
            nodeId: event.nodeId,
            category: event.category,
            sample: {
              atNs: event.atNs,
              sample: event.sample,
            },
          })),
          undefined,
          historyLimitsRef.current,
          totalHistoryPointsRef.current,
        );
        totalHistoryPointsRef.current = result.totalPoints;
        return result.history;
      });
    }

    if (nodeEvents.length > 0 || metricEvents.length > 0) {
      setNodes((prev) => mergeNodeState(prev, nodeEvents, metricEvents));
    }
  };

  const enqueueDecodeEvent = (event: WorkerNodeEvent | WorkerMetricEvent) => {
    decodeQueueRef.current.push(event);
    if (decodeFlushTimerRef.current !== null) return;
    decodeFlushTimerRef.current = window.setTimeout(flushDecodedQueue, decodeBatchDelayMsRef.current);
  };

  const handleDecodedEvent = (event: WorkerDecodedEvent) => {
    if (event.kind === "command_result") {
      resolvePendingCommand(event.commandID, {
        ok: event.success,
        message: event.success
          ? `${pendingCommandsRef.current.get(event.commandID)?.commandType ?? "command"}: success`
          : `${pendingCommandsRef.current.get(event.commandID)?.commandType ?? "command"}: ${event.error || "failed"}`,
      });
      return;
    }
    enqueueDecodeEvent(event);
  };
  handleDecodedEventRef.current = handleDecodedEvent;

  useEffect(() => {
    if (typeof Worker === "undefined") {
      return;
    }

    const worker = new Worker(new URL("./ws-message.worker.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerDecodedEvent>) => {
      try {
        handleDecodedEventRef.current(event.data);
      } catch {
        // ignore worker message errors
      }
    };

    const initMsg: WorkerInboundMessage = {
      type: "set-min-sample-interval",
      minSampleIntervalMs: minSampleIntervalMsRef.current,
      processMinSampleIntervalMs: processMinSampleIntervalMsRef.current,
    };
    worker.postMessage(initMsg);

    return () => {
      workerRef.current = null;
      worker.terminate();
    };
  }, []);

  useEffect(() => {
    const worker = workerRef.current;
    if (!worker) return;
    const msg: WorkerInboundMessage = {
      type: "set-min-sample-interval",
      minSampleIntervalMs,
      processMinSampleIntervalMs,
    };
    worker.postMessage(msg);
  }, [minSampleIntervalMs, processMinSampleIntervalMs]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const nowNs = BigInt(Date.now()) * 1_000_000n;
      setNodes((prev) => markStaleNodes(prev, nowNs, staleAfterNs));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsURL = `${wsProtocol}://${window.location.host}/api/ws/metrics`;

    let socket: WebSocket | null = null;
    let retryTimer: number | null = null;
    let closedByClient = false;

    const connect = () => {
      socket = new WebSocket(wsURL);
      socket.binaryType = "arraybuffer";
      socketRef.current = socket;

      socket.onopen = () => {
        setWsConnected(true);
        const ctrl = telemetryProto.v1.WSClientControl.create({
          op: "subscribe",
          categories: [...wsCategories],
        });
        socket?.send(telemetryProto.v1.WSClientControl.encode(ctrl).finish());
      };

      socket.onmessage = async (event: MessageEvent) => {
        try {
          let bytesBuffer: ArrayBuffer;
          if (event.data instanceof ArrayBuffer) {
            bytesBuffer = event.data;
          } else if (event.data instanceof Blob) {
            bytesBuffer = await event.data.arrayBuffer();
          } else {
            return;
          }

          const worker = workerRef.current;
          if (worker) {
            const workerMsg: WorkerInboundMessage = { type: "decode", bytes: bytesBuffer };
            worker.postMessage(workerMsg, [bytesBuffer]);
            return;
          }

          const decoded = decodeWSEventFromBytes(new Uint8Array(bytesBuffer), {
            minSampleIntervalMs: minSampleIntervalMsRef.current,
            processMinSampleIntervalMs: processMinSampleIntervalMsRef.current,
            lastAcceptedByPoint: fallbackLastAcceptedPointByStreamRef.current,
          });
          if (decoded) {
            handleDecodedEventRef.current(decoded);
          }
        } catch {
          // ignore decode errors
        }
      };

      socket.onerror = () => socket?.close();
      socket.onclose = () => {
        setWsConnected(false);
        failAllPendingCommands("websocket disconnected");
        if (!closedByClient) {
          retryTimer = window.setTimeout(connect, 1000);
        }
      };
    };

    connect();

    return () => {
      closedByClient = true;
      if (retryTimer !== null) {
        window.clearTimeout(retryTimer);
      }
      socketRef.current = null;
      failAllPendingCommands("websocket closed");
      socket?.close();

      if (decodeFlushTimerRef.current !== null) {
        window.clearTimeout(decodeFlushTimerRef.current);
        decodeFlushTimerRef.current = null;
      }
      decodeQueueRef.current = [];
    };
  }, []);

  const sendCommand = async (
    nodeId: string,
    commandType: string,
    payload: Record<string, unknown>,
  ): Promise<CommandDispatchResult> => {
    if (!nodeId) return { ok: false, message: `${commandType}: node not selected` };

    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return { ok: false, message: `${commandType}: websocket disconnected` };
    }

    const commandID = nextCommandID(nodeId);
    let command: Record<string, any>;
    try {
      command = buildProtoCommand(nodeId, commandType, payload, commandID) as Record<string, any>;
    } catch (err) {
      const message = err instanceof Error ? err.message : "invalid command payload";
      return { ok: false, message: `${commandType}: ${message}` };
    }

    const control = telemetryProto.v1.WSClientControl.create({
      op: "command",
      command: telemetryProto.v1.WSCommandRequest.create({
        nodeId,
        command,
      }),
    });

    return await new Promise<CommandDispatchResult>((resolve) => {
      const timeoutID = window.setTimeout(() => {
        resolvePendingCommand(commandID, {
          ok: false,
          message: `${commandType}: timeout`,
        });
      }, commandTimeoutMs);

      pendingCommandsRef.current.set(commandID, {
        commandType,
        resolve,
        timeoutID,
      });

      try {
        socket.send(telemetryProto.v1.WSClientControl.encode(control).finish());
      } catch (err) {
        const message = err instanceof Error ? err.message : "send failed";
        resolvePendingCommand(commandID, {
          ok: false,
          message: `${commandType}: ${message}`,
        });
      }
    });
  };

  return {
    wsConnected,
    nodes,
    history,
    historyLimits,
    minSampleIntervalMs,
    processMinSampleIntervalMs,
    setHistoryLimits: (nextLimits: Partial<HistoryLimitSettings>) => {
      const normalized = normalizeHistoryLimitSettings(nextLimits);
      setHistoryLimitsState(normalized);
      setHistory((prev) => {
        const next = applyHistoryLimits(prev, normalized);
        totalHistoryPointsRef.current = countHistoryPoints(next);
        return next;
      });
    },
    setMinSampleIntervalMs: (value: number) => {
      setMinSampleIntervalMsState(normalizeMinSampleIntervalMs(value));
    },
    setProcessMinSampleIntervalMs: (value: number) => {
      setProcessMinSampleIntervalMsState(normalizeMinSampleIntervalMs(value));
    },
    selectedNodeRef,
    sendCommand,
  };
}
