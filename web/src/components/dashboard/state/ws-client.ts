"use client";

import { useEffect, useRef, useState } from "react";

import { telemetry as telemetryProto } from "@/lib/proto/telemetry";

import type { NodeRuntime, RawHistorySample } from "../types";
import { toBigIntNs } from "../utils/time";
import { markStaleNodes, upsertNode } from "./node-store";
import type { HistoryMap } from "./metric-history";
import { pushHistory } from "./metric-history";
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

  const selectedNodeRef = useRef("");
  const socketRef = useRef<WebSocket | null>(null);
  const pendingCommandsRef = useRef<Map<string, PendingCommand>>(new Map());

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

          const historyItem: RawHistorySample = {
            atNs,
            sample,
          };
          setHistory((prev) => pushHistory(prev, nodeId, category, historyItem));

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
                [category]: sample,
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
    selectedNodeRef,
    sendCommand,
  };
}
