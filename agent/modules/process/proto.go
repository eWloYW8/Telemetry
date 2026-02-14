package process

import processpb "telemetry/agent/modules/process/pb"

func toPBModuleRegistration(v *Registration) *processpb.ModuleRegistration {
	if v == nil {
		return nil
	}
	out := &processpb.ModuleRegistration{
		Collectors:  make([]*processpb.CollectorSpec, 0, len(v.Collectors)),
		Controllers: make([]*processpb.ControllerSpec, 0, len(v.Controllers)),
	}
	for _, c := range v.Collectors {
		out.Collectors = append(out.Collectors, &processpb.CollectorSpec{
			Category: c.Category,
			Interval: c.Interval,
		})
	}
	for _, c := range v.Controllers {
		out.Controllers = append(out.Controllers, &processpb.ControllerSpec{Type: c.Type})
	}
	return out
}

func toPBMetrics(v *Metrics) *processpb.Metrics {
	if v == nil {
		return nil
	}
	out := &processpb.Metrics{
		Processes: make([]*processpb.Info, 0, len(v.Processes)),
	}
	for _, p := range v.Processes {
		out.Processes = append(out.Processes, &processpb.Info{
			Pid:               int32(p.PID),
			Ppid:              int32(p.PPID),
			User:              p.User,
			State:             p.State,
			CpuPercent:        p.CPUPercent,
			MemoryBytes:       p.MemoryBytes,
			Command:           p.Command,
			SampledAtUnixNano: p.SampledAtNano,
		})
	}
	return out
}
