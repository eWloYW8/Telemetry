package cpu

import (
	"time"

	"telemetry/agent/modules"
	"telemetry/api"
)

func (m *Module) CollectorEntries() []modules.CollectorEntry {
	if m == nil || m.collector == nil {
		return nil
	}
	return []modules.CollectorEntry{
		{
			Category: CategoryUltra,
			Interval: m.ultraInterval(),
			Collector: func(at time.Time) (api.MetricSample, error) {
				metrics, err := m.collector.CollectUltra()
				return api.MetricSample{
					Category: CategoryUltra,
					At:       at.UnixNano(),
					Payload:  toPBUltraMetrics(metrics),
				}, err
			},
		},
		{
			Category: CategoryMedium,
			Interval: m.mediumInterval(),
			Collector: func(at time.Time) (api.MetricSample, error) {
				metrics, err := m.collector.CollectMedium()
				return api.MetricSample{
					Category: CategoryMedium,
					At:       at.UnixNano(),
					Payload:  toPBMediumMetrics(metrics),
				}, err
			},
		},
	}
}
