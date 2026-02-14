"use client";

import { useEffect, useRef, useState } from "react";

import { telemetry as telemetryProto } from "@/lib/proto/telemetry";

import type { NodeRuntime, RawHistorySample } from "../types";
import { toBigIntNs } from "../utils/time";
import { markStaleNodes, upsertNode } from "./node-store";
import type { HistoryMap } from "./metric-history";
import { pushHistory } from "./metric-history";

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

export function useTelemetryWS() {
  const [wsConnected, setWsConnected] = useState(false);
  const [nodes, setNodes] = useState<NodeRuntime[]>([]);
  const [history, setHistory] = useState<HistoryMap>({});

  const selectedNodeRef = useRef("");

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
      socket?.close();
    };
  }, []);

  return {
    wsConnected,
    nodes,
    history,
    selectedNodeRef,
  };
}
