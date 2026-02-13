package gpu

import (
	"fmt"

	"telemetry/agent/modules"
	gpupb "telemetry/agent/modules/gpu/pb"
	"telemetry/api"
)

func (m *Module) ControllerEntries() []modules.ControllerEntry {
	if m == nil || m.controller == nil {
		return nil
	}
	return []modules.ControllerEntry{
		{
			Type: CommandSetClockRange,
			Controller: func(cmd *api.Command) error {
				payload, err := decodePayload[*gpupb.ClockRangeCommand](cmd)
				if err != nil {
					return err
				}
				return m.controller.SetClockRange(
					int(payload.GetGpuIndex()),
					payload.GetSmMinMhz(),
					payload.GetSmMaxMhz(),
					payload.GetMemMinMhz(),
					payload.GetMemMaxMhz(),
				)
			},
		},
		{
			Type: CommandSetPowerCap,
			Controller: func(cmd *api.Command) error {
				payload, err := decodePayload[*gpupb.PowerCapCommand](cmd)
				if err != nil {
					return err
				}
				return m.controller.SetPowerCap(int(payload.GetGpuIndex()), payload.GetMilliwatt())
			},
		},
	}
}

func decodePayload[T any](cmd *api.Command) (T, error) {
	var zero T
	if cmd == nil {
		return zero, fmt.Errorf("command is nil")
	}
	if cmd.Payload == nil {
		return zero, fmt.Errorf("missing command payload")
	}
	if payload, ok := cmd.Payload.(T); ok {
		return payload, nil
	}
	if payload, ok := cmd.Payload.(*T); ok && payload != nil {
		return *payload, nil
	}
	return zero, fmt.Errorf("unexpected payload type %T", cmd.Payload)
}
