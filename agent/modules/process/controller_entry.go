package process

import (
	"fmt"
	"syscall"

	"telemetry/agent/modules"
	processpb "telemetry/agent/modules/process/pb"
	"telemetry/api"
)

func (m *Module) ControllerEntries() []modules.ControllerEntry {
	if m == nil || m.controller == nil {
		return nil
	}
	return []modules.ControllerEntry{
		{
			Type: CommandProcessSignal,
			Controller: func(cmd *api.Command) error {
				payload, err := decodePayload[*processpb.SignalCommand](cmd)
				if err != nil {
					return err
				}
				sig := int(payload.GetSignal())
				if sig == 0 {
					sig = int(syscall.SIGTERM)
				}
				return m.controller.Signal(int(payload.GetPid()), sig)
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
