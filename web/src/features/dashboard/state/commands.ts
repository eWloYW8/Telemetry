import { telemetry as telemetryProto } from "@/lib/proto/telemetry";

function encodeCommandPayload(commandType: string, payload: Record<string, unknown>): Uint8Array {
  switch (commandType) {
    case "cpu_scaling_range":
      return telemetryProto.module.cpu.v1.ScalingRangeCommand.encode(
        telemetryProto.module.cpu.v1.ScalingRangeCommand.create(payload),
      ).finish();
    case "cpu_governor":
      return telemetryProto.module.cpu.v1.GovernorCommand.encode(
        telemetryProto.module.cpu.v1.GovernorCommand.create(payload),
      ).finish();
    case "cpu_uncore_range":
      return telemetryProto.module.cpu.v1.UncoreRangeCommand.encode(
        telemetryProto.module.cpu.v1.UncoreRangeCommand.create(payload),
      ).finish();
    case "cpu_power_cap":
      return telemetryProto.module.cpu.v1.PowerCapCommand.encode(
        telemetryProto.module.cpu.v1.PowerCapCommand.create(payload),
      ).finish();
    case "gpu_clock_range":
      return telemetryProto.module.gpu.v1.ClockRangeCommand.encode(
        telemetryProto.module.gpu.v1.ClockRangeCommand.create(payload),
      ).finish();
    case "gpu_power_cap":
      return telemetryProto.module.gpu.v1.PowerCapCommand.encode(
        telemetryProto.module.gpu.v1.PowerCapCommand.create(payload),
      ).finish();
    case "process_signal":
      return telemetryProto.module.process.v1.SignalCommand.encode(
        telemetryProto.module.process.v1.SignalCommand.create(payload),
      ).finish();
    default:
      throw new Error(`unsupported command type: ${commandType}`);
  }
}

export async function postProtoCommand(
  nodeId: string,
  commandType: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; message: string }> {
  const body = encodeCommandPayload(commandType, payload);
  const wire = new Uint8Array(body.byteLength);
  wire.set(body);
  const resp = await fetch(`/api/nodes/${nodeId}/commands/${commandType}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-protobuf",
    },
    body: wire.buffer as ArrayBuffer,
  });

  if (!resp.ok) {
    return { ok: false, message: `${commandType}: ${resp.status}` };
  }

  return { ok: true, message: `${commandType}: success` };
}
