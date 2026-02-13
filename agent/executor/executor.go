package control

import (
	"time"

	"telemetry/agent/modules"
	"telemetry/api"
)

type Executor struct {
	modules *modules.Registry
}

func NewExecutor(modules *modules.Registry) *Executor {
	return &Executor{modules: modules}
}

func (e *Executor) Execute(nodeID string, cmd *api.Command) *api.CommandResult {
	commandID := ""
	commandType := api.CommandType("")
	if cmd != nil {
		commandID = cmd.ID
		commandType = cmd.Type
	}
	result := &api.CommandResult{
		CommandID:  commandID,
		NodeID:     nodeID,
		Type:       commandType,
		Success:    false,
		FinishedAt: time.Now().UnixNano(),
	}

	if e == nil || e.modules == nil {
		result.Error = "module registry is unavailable"
		return result
	}

	err := e.modules.ExecuteController(cmd)

	if err != nil {
		result.Error = err.Error()
		return result
	}
	result.Success = true
	return result
}
