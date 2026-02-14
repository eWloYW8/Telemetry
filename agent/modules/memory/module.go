package memory

import (
	"time"

	"telemetry/config"
)

type Module struct {
	collector  *Collector
	controller *Controller
	intervals  config.ReportConfig
}

const defaultInterval = 1 * time.Second

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
		Static: m.collector.StaticInfo(),
		Collectors: []CollectorSpec{{
			Category: string(Category),
			Interval: m.intervals.Interval(string(Category), defaultInterval).String(),
		}},
	})
}

func (m *Module) Name() string {
	return "memory"
}
