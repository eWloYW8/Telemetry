package memory

import memorypb "telemetry/agent/modules/memory/pb"

func toPBModuleRegistration(v *Registration) *memorypb.ModuleRegistration {
	if v == nil {
		return nil
	}
	out := &memorypb.ModuleRegistration{
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
		TotalBytes:     v.TotalBytes,
		UsedBytes:      v.UsedBytes,
		FreeBytes:      v.FreeBytes,
		AvailableBytes: v.AvailableBytes,
		CachedBytes:    v.CachedBytes,
		BuffersBytes:   v.BuffersBytes,
	}
}
