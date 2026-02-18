package gpu

import (
	"time"

	"github.com/eWloYW8/Telemetry/agent/modules"
	"github.com/eWloYW8/Telemetry/api"
)

func (m *Module) CollectorEntries() []modules.CollectorEntry {
	if m == nil || m.collector == nil {
		return nil
	}
	return []modules.CollectorEntry{
		{
			Category: CategoryFast,
			Interval: m.intervals.Interval(string(CategoryFast), defaultFastInterval),
			Collector: func(at time.Time) (api.MetricSample, error) {
				metrics, err := m.collector.CollectFast()
				return api.MetricSample{
					Category: CategoryFast,
					At:       at.UnixNano(),
					Payload:  toPBFastMetrics(metrics),
				}, err
			},
		},
	}
}
