"use client";

import { useEffect, useRef, useState } from "react";

import { telemetry as telemetryProto } from "@/lib/proto/telemetry";

import type { NodeRuntime, RawHistorySample } from "../types";
import { toBigIntNs } from "../utils/time";
import { markStaleNodes, upsertNode } from "./node-store";
import {
  applyHistoryLimits,
  defaultHistoryLimits,
  normalizeHistoryLimitSettings,
  pushHistory,
  type HistoryLimitSettings,
  type HistoryMap,
} from "./metric-history";
import { buildProtoCommand, nextCommandID } from "./commands";

export const wsCategories = [
  "cpu_ultra_fast",
  "cpu_medium",
  "gpu_fast",
  "memory",
  "storage",
  "network",
  "process",
] as const;

const staleAfterNs = 8_000_000_000n;
const commandTimeoutMs = 15_000;
const historyLimitsStorageKey = "telemetry.history.limits.v1";
const minSampleIntervalStorageKey = "telemetry.min-sample-interval-ms.v1";
const processMinSampleIntervalStorageKey = "telemetry.process-min-sample-interval-ms.v1";
const defaultMinSampleIntervalMs = 0;
const defaultProcessMinSampleIntervalMs = 0;
const minSampleIntervalMsMin = 0;
const minSampleIntervalMsMax = 60_000;
const sampleMetaKeys = new Set(["category", "atUnixNano", "at_unix_nano"]);
const identityHintKeys = [
  "coreId",
  "core_id",
  "packageId",
  "package_id",
  "gpuIndex",
  "gpu_index",
  "pid",
  "ppid",
  "uid",
  "gid",
  "name",
  "device",
  "disk",
  "iface",
  "interface",
  "mountpoint",
  "mountPoint",
  "filesystem",
  "fs",
] as const;

function normalizeMinSampleIntervalMs(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return defaultMinSampleIntervalMs;
  return Math.min(minSampleIntervalMsMax, Math.max(minSampleIntervalMsMin, Math.floor(num)));
}

function isPlainObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function itemIdentity(item: unknown, index: number): string {
  if (!isPlainObject(item)) return `idx:${index}`;

  const parts: string[] = [];
  for (const key of identityHintKeys) {
    const value = item[key];
    if (value === null || value === undefined) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      parts.push(`${key}=${String(value)}`);
    }
  }
  if (parts.length > 0) return parts.join("|");

  for (const [key, value] of Object.entries(item)) {
    if (!/(^id$|_id$|Id$|ID$)/.test(key)) continue;
    if (value === null || value === undefined) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return `${key}=${String(value)}`;
    }
  }

  return `idx:${index}`;
}

function shouldAcceptPoint(
  lastAcceptedByPoint: Map<string, bigint>,
  pointKey: string,
  atNs: bigint,
  minIntervalNs: bigint,
): boolean {
  const lastAccepted = lastAcceptedByPoint.get(pointKey);
  if (lastAccepted !== undefined && atNs - lastAccepted < minIntervalNs) {
    return false;
  }
  lastAcceptedByPoint.set(pointKey, atNs);
  return true;
}

function filterSampleByMinInterval(
  nodeId: string,
  category: string,
  sample: Record<string, any>,
  atNs: bigint,
  minIntervalMs: number,
  lastAcceptedByPoint: Map<string, bigint>,
): Record<string, any> | null {
  if (minIntervalMs <= 0) return sample;

  const minIntervalNs = BigInt(minIntervalMs) * 1_000_000n;
  // Process payload is a snapshot table. Filtering individual rows causes partial views.
  // Keep snapshot atomic: either accept whole sample or drop whole sample by interval.
  if (category === "process") {
    const snapshotKey = `${nodeId}\u0000${category}\u0000snapshot`;
    if (!shouldAcceptPoint(lastAcceptedByPoint, snapshotKey, atNs, minIntervalNs)) {
      return null;
    }
    return sample;
  }

  let acceptedPoints = 0;
  const nextSample: Record<string, any> = {};

  for (const [key, value] of Object.entries(sample)) {
    if (sampleMetaKeys.has(key)) {
      nextSample[key] = value;
    }
  }

  for (const [payloadKey, payloadValue] of Object.entries(sample)) {
    if (sampleMetaKeys.has(payloadKey)) continue;
    if (!isPlainObject(payloadValue)) continue;

    const nextPayload: Record<string, any> = { ...payloadValue };
    const arrayEntries = Object.entries(payloadValue).filter(([, value]) => Array.isArray(value));

    if (arrayEntries.length === 0) {
      const pointKey = `${nodeId}\u0000${category}\u0000${payloadKey}\u0000obj`;
      if (!shouldAcceptPoint(lastAcceptedByPoint, pointKey, atNs, minIntervalNs)) {
        continue;
      }
      acceptedPoints += 1;
      nextSample[payloadKey] = nextPayload;
      continue;
    }

    let payloadAccepted = 0;
    for (const [fieldKey, fieldValue] of arrayEntries) {
      const list = fieldValue as any[];
      const filtered: any[] = [];
      for (let i = 0; i < list.length; i += 1) {
        const id = itemIdentity(list[i], i);
        const pointKey = `${nodeId}\u0000${category}\u0000${payloadKey}.${fieldKey}\u0000${id}`;
        if (!shouldAcceptPoint(lastAcceptedByPoint, pointKey, atNs, minIntervalNs)) {
          continue;
        }
        filtered.push(list[i]);
      }
      nextPayload[fieldKey] = filtered;
      payloadAccepted += filtered.length;
    }

    if (payloadAccepted > 0) {
      acceptedPoints += payloadAccepted;
      nextSample[payloadKey] = nextPayload;
    }
  }

  if (acceptedPoints === 0) return null;
  return nextSample;
}

type CommandDispatchResult = {
  ok: boolean;
  message: string;
};

type PendingCommand = {
  commandType: string;
  resolve: (result: CommandDispatchResult) => void;
  timeoutID: number;
};

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
  const pendingCommandsRef = useRef<Map<string, PendingCommand>>(new Map());
  const historyLimitsRef = useRef(historyLimits);
  const minSampleIntervalMsRef = useRef(minSampleIntervalMs);
  const processMinSampleIntervalMsRef = useRef(processMinSampleIntervalMs);
  const lastAcceptedPointByStreamRef = useRef<Map<string, bigint>>(new Map());

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
          let bytes: Uint8Array;
          if (event.data instanceof ArrayBuffer) {
            bytes = new Uint8Array(event.data);
          } else if (event.data instanceof Blob) {
            bytes = new Uint8Array(await event.data.arrayBuffer());
          } else {
            return;
          }

          const msg = telemetryProto.v1.WSOutgoingMessage.decode(bytes) as Record<string, any>;

          if (msg.type === "command_result" && msg.commandResult) {
            const result = msg.commandResult as Record<string, any>;
            const commandID = String(result.commandId ?? "");
            const success = Boolean(result.success);
            const error = String(result.error ?? "");
            if (!commandID) return;
            resolvePendingCommand(commandID, {
              ok: success,
              message: success
                ? `${pendingCommandsRef.current.get(commandID)?.commandType ?? "command"}: success`
                : `${pendingCommandsRef.current.get(commandID)?.commandType ?? "command"}: ${error || "failed"}`,
            });
            return;
          }

          if (msg.type === "node" && msg.node) {
            const nodeMsg = msg.node as Record<string, any>;
            const nodeId = String(nodeMsg.nodeId ?? "");
            if (!nodeId) return;

            const latestRaw: Record<string, Record<string, any>> = {};
            const latestList = (nodeMsg.latest ?? []) as Array<Record<string, any>>;
            for (const sample of latestList) {
              const category = String(sample.category ?? "");
              if (!category) continue;
              latestRaw[category] = sample;
            }

            setNodes((prev) => {
              const current = prev.find((n) => n.nodeId === nodeId);
              return upsertNode(prev, {
                nodeId,
                connected: Boolean(nodeMsg.connected),
                lastSeenUnixNano: toBigIntNs(nodeMsg.lastSeenUnixNano),
                sourceIP: String(nodeMsg.sourceIp ?? current?.sourceIP ?? ""),
                registration: (nodeMsg.registration ?? current?.registration ?? null) as
                  | Record<string, any>
                  | null,
                latestRaw: {
                  ...(current?.latestRaw ?? {}),
                  ...latestRaw,
                },
              });
            });
            return;
          }

          if (msg.type !== "metric" || !msg.metric?.sample) {
            return;
          }

          const timed = msg.metric as Record<string, any>;
          const sample = timed.sample as Record<string, any>;
          const nodeId = String(timed.nodeId ?? "");
          const category = String(sample.category ?? "");
          const atNs = toBigIntNs(sample.atUnixNano);
          if (!nodeId || !category || atNs <= 0n) {
            return;
          }
          const minIntervalMs =
            category === "process" ? processMinSampleIntervalMsRef.current : minSampleIntervalMsRef.current;
          const filteredSample = filterSampleByMinInterval(
            nodeId,
            category,
            sample,
            atNs,
            minIntervalMs,
            lastAcceptedPointByStreamRef.current,
          );
          if (!filteredSample) {
            return;
          }

          const historyItem: RawHistorySample = {
            atNs,
            sample: filteredSample,
          };
          setHistory((prev) => pushHistory(prev, nodeId, category, historyItem, undefined, historyLimitsRef.current));

          setNodes((prev) => {
            const current = prev.find((n) => n.nodeId === nodeId);
            return upsertNode(prev, {
              nodeId,
              connected: true,
              lastSeenUnixNano: atNs,
              sourceIP: current?.sourceIP ?? "",
              registration: current?.registration ?? null,
              latestRaw: {
                ...(current?.latestRaw ?? {}),
                [category]: filteredSample,
              },
            });
          });
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
      setHistory((prev) => applyHistoryLimits(prev, normalized));
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
