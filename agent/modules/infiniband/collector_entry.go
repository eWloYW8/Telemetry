package infiniband

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
			Category: Category,
			Interval: m.intervals.Interval(string(Category), defaultInterval),
			Collector: func(at time.Time) (api.MetricSample, error) {
				metrics, err := m.collector.Collect()
				return api.MetricSample{
					Category: Category,
					At:       at.UnixNano(),
					Payload:  toPBMetrics(metrics),
				}, err
			},
		},
	}
}
