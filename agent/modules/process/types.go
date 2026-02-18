package process

import "github.com/eWloYW8/Telemetry/api"

const (
	Category             api.MetricCategory = "process"
	CommandProcessSignal api.CommandType    = "process_signal"
)

type Info struct {
	PID           int
	PPID          int
	User          string
	State         string
	CPUPercent    float64
	MemoryBytes   uint64
	Command       string
	SampledAtNano int64
}

type Metrics struct {
	Processes []Info
}

type CollectorSpec struct {
	Category string
	Interval string
}

type ControllerSpec struct {
	Type string
}

type Registration struct {
	Collectors  []CollectorSpec
	Controllers []ControllerSpec
}

type SignalCommand struct {
	PID    int
	Signal int
}
