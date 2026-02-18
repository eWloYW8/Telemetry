package gpu

import (
	"time"

	"github.com/eWloYW8/Telemetry/config"
)

type Module struct {
	collector  *Collector
	controller *Controller
	intervals  config.ReportConfig
}

const defaultFastInterval = 100 * time.Millisecond

func New(intervals config.ReportConfig) (*Module, error) {
	collector, err := NewCollector()
	if collector == nil {
		collector = &Collector{}
	}
	return &Module{
		collector:  collector,
		controller: NewController(collector),
		intervals:  intervals,
	}, err
}

func (m *Module) Registration() any {
	if m == nil || m.collector == nil {
		return nil
	}
	return toPBModuleRegistration(&Registration{
		Static: m.collector.StaticInfo(),
		Collectors: []CollectorSpec{
			{Category: string(CategoryFast), Interval: m.intervals.Interval(string(CategoryFast), defaultFastInterval).String()},
		},
		Controllers: []ControllerSpec{
			{Type: string(CommandSetClockRange)},
			{Type: string(CommandSetPowerCap)},
		},
	})
}

func (m *Module) Name() string {
	return "gpu"
}
