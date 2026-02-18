package gpu

import gpupb "github.com/eWloYW8/Telemetry/agent/modules/gpu/pb"

func toPBModuleRegistration(v *Registration) *gpupb.ModuleRegistration {
	if v == nil {
		return nil
	}
	out := &gpupb.ModuleRegistration{
		Static:      make([]*gpupb.StaticInfo, 0, len(v.Static)),
		Collectors:  make([]*gpupb.CollectorSpec, 0, len(v.Collectors)),
		Controllers: make([]*gpupb.ControllerSpec, 0, len(v.Controllers)),
	}
	for _, s := range v.Static {
		out.Static = append(out.Static, &gpupb.StaticInfo{
			Index:             int32(s.Index),
			Name:              s.Name,
			Uuid:              s.UUID,
			MemoryTotalBytes:  s.MemoryTotalBytes,
			PowerMinMilliwatt: s.PowerMinMilliWatt,
			PowerMaxMilliwatt: s.PowerMaxMilliWatt,
			SmClockMinMhz:     s.SMClockMinMHz,
			SmClockMaxMhz:     s.SMClockMaxMHz,
			MemClockMinMhz:    s.MemClockMinMHz,
			MemClockMaxMhz:    s.MemClockMaxMHz,
		})
	}
	for _, c := range v.Collectors {
		out.Collectors = append(out.Collectors, &gpupb.CollectorSpec{
			Category: c.Category,
			Interval: c.Interval,
		})
	}
	for _, c := range v.Controllers {
		out.Controllers = append(out.Controllers, &gpupb.ControllerSpec{Type: c.Type})
	}
	return out
}

func toPBFastMetrics(v *FastMetrics) *gpupb.FastMetrics {
	if v == nil {
		return nil
	}
	out := &gpupb.FastMetrics{Devices: make([]*gpupb.DeviceFastMetrics, 0, len(v.Devices))}
	for _, d := range v.Devices {
		out.Devices = append(out.Devices, &gpupb.DeviceFastMetrics{
			Index:               int32(d.Index),
			UtilizationGpu:      d.UtilizationGPU,
			UtilizationMem:      d.UtilizationMem,
			MemoryUsedBytes:     d.MemoryUsedBytes,
			TemperatureC:        d.TemperatureC,
			PowerUsageMilliwatt: d.PowerUsageMilliW,
			GraphicsClockMhz:    d.GraphicsClockMHz,
			MemoryClockMhz:      d.MemoryClockMHz,
			SmClockMinMhz:       d.SMClockMinMHz,
			SmClockMaxMhz:       d.SMClockMaxMHz,
			MemClockMinMhz:      d.MemClockMinMHz,
			MemClockMaxMhz:      d.MemClockMaxMHz,
			PowerLimitMilliwatt: d.PowerLimitMilliW,
			SampledAtUnixNano:   d.SampledAtNano,
		})
	}
	return out
}
