package process

import (
	"time"

	"telemetry/config"
)

type Module struct {
	collector  *Collector
	controller *Controller
	intervals  config.ReportConfig
}

const defaultInterval = 5 * time.Second

func New(intervals config.ReportConfig) *Module {
	collector := NewCollector()
	return &Module{
		collector:  collector,
		controller: NewController(),
		intervals:  intervals,
	}
}

func (m *Module) Registration() any {
	if m == nil {
		return nil
	}
	return toPBModuleRegistration(&Registration{
		Collectors: []CollectorSpec{{
			Category: string(Category),
			Interval: m.intervals.Interval(string(Category), defaultInterval).String(),
		}},
		Controllers: []ControllerSpec{{Type: string(CommandProcessSignal)}},
	})
}

func (m *Module) Name() string {
	return "process"
}
