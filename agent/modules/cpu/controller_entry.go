package cpu

import (
	"fmt"

	"github.com/eWloYW8/Telemetry/agent/modules"
	cpupb "github.com/eWloYW8/Telemetry/agent/modules/cpu/pb"
	"github.com/eWloYW8/Telemetry/api"
)

func (m *Module) ControllerEntries() []modules.ControllerEntry {
	if m == nil || m.controller == nil {
		return nil
	}
	return []modules.ControllerEntry{
		{
			Type: CommandSetScalingRange,
			Controller: func(cmd *api.Command) error {
				payload, err := decodePayload[*cpupb.ScalingRangeCommand](cmd)
				if err != nil {
					return err
				}
				packageID := -1
				if payload.PackageId != nil {
					packageID = int(payload.GetPackageId())
				}
				return m.controller.SetScalingRange(packageID, payload.GetMinKhz(), payload.GetMaxKhz())
			},
		},
		{
			Type: CommandSetGovernor,
			Controller: func(cmd *api.Command) error {
				payload, err := decodePayload[*cpupb.GovernorCommand](cmd)
				if err != nil {
					return err
				}
				packageID := -1
				if payload.PackageId != nil {
					packageID = int(payload.GetPackageId())
				}
				return m.controller.SetGovernor(packageID, payload.GetGovernor())
			},
		},
		{
			Type: CommandSetUncoreRange,
			Controller: func(cmd *api.Command) error {
				payload, err := decodePayload[*cpupb.UncoreRangeCommand](cmd)
				if err != nil {
					return err
				}
				return m.controller.SetUncoreRange(int(payload.GetPackageId()), payload.GetMinKhz(), payload.GetMaxKhz())
			},
		},
		{
			Type: CommandSetPowerCap,
			Controller: func(cmd *api.Command) error {
				payload, err := decodePayload[*cpupb.PowerCapCommand](cmd)
				if err != nil {
					return err
				}
				return m.controller.SetPowerCap(int(payload.GetPackageId()), payload.GetMicrowatt())
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
