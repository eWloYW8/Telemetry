package memory

import memorypb "github.com/eWloYW8/Telemetry/agent/modules/memory/pb"

func toPBModuleRegistration(v *Registration) *memorypb.ModuleRegistration {
	if v == nil {
		return nil
	}
	out := &memorypb.ModuleRegistration{
		Static: &memorypb.StaticInfo{
			TotalBytes: v.Static.TotalBytes,
		},
		Collectors: make([]*memorypb.CollectorSpec, 0, len(v.Collectors)),
	}
	for _, c := range v.Collectors {
		out.Collectors = append(out.Collectors, &memorypb.CollectorSpec{
			Category: c.Category,
			Interval: c.Interval,
		})
	}
	return out
}

func toPBMetrics(v *Metrics) *memorypb.Metrics {
	if v == nil {
		return nil
	}
	return &memorypb.Metrics{
		UsedBytes:         v.UsedBytes,
		FreeBytes:         v.FreeBytes,
		AvailableBytes:    v.AvailableBytes,
		CachedBytes:       v.CachedBytes,
		BuffersBytes:      v.BuffersBytes,
		SampledAtUnixNano: v.SampledAtNano,
	}
}
