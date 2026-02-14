package cpu

import cpupb "telemetry/agent/modules/cpu/pb"

func toPBModuleRegistration(v *Registration) *cpupb.ModuleRegistration {
	if v == nil {
		return nil
	}
	out := &cpupb.ModuleRegistration{
		Static: &cpupb.StaticInfo{
			Vendor:              v.Static.Vendor,
			Model:               v.Static.Model,
			Packages:            int32(v.Static.Packages),
			PhysicalCores:       int32(v.Static.PhysicalCores),
			LogicalCores:        int32(v.Static.LogicalCores),
			ThreadsPerCore:      int32(v.Static.ThreadsPerCore),
			CpuinfoMinKhz:       v.Static.CPUInfoMinKHz,
			CpuinfoMaxKhz:       v.Static.CPUInfoMaxKHz,
			SupportsIntelUncore: v.Static.SupportsIntelUncore,
			SupportsRapl:        v.Static.SupportsRAPL,
		},
		Collectors:      make([]*cpupb.CollectorSpec, 0, len(v.Collectors)),
		Controllers:     make([]*cpupb.ControllerSpec, 0, len(v.Controllers)),
		Devices:         make([]*cpupb.CpuDevice, 0, len(v.Devices)),
		PackageControls: make([]*cpupb.PackageControl, 0, len(v.Controls)),
	}
	for _, c := range v.Collectors {
		out.Collectors = append(out.Collectors, &cpupb.CollectorSpec{
			Category: c.Category,
			Interval: c.Interval,
		})
	}
	for _, c := range v.Controllers {
		out.Controllers = append(out.Controllers, &cpupb.ControllerSpec{Type: c.Type})
	}
	for _, d := range v.Devices {
		coreIDs := make([]int32, 0, len(d.CoreIDs))
		for _, coreID := range d.CoreIDs {
			coreIDs = append(coreIDs, int32(coreID))
		}
		out.Devices = append(out.Devices, &cpupb.CpuDevice{
			PackageId:   int32(d.PackageID),
			CoreIds:     coreIDs,
			CoreCount:   d.CoreCount,
			ThreadCount: d.ThreadCount,
			Vendor:      d.Vendor,
			Model:       d.Model,
		})
	}
	for _, c := range v.Controls {
		out.PackageControls = append(out.PackageControls, &cpupb.PackageControl{
			PackageId:          int32(c.PackageID),
			ScalingMinKhz:      c.ScalingMinKHz,
			ScalingMaxKhz:      c.ScalingMaxKHz,
			ScalingHwMinKhz:    c.ScalingHWMinKHz,
			ScalingHwMaxKhz:    c.ScalingHWMaxKHz,
			AvailableGovernors: append([]string(nil), c.AvailableGovernors...),
			CurrentGovernor:    c.CurrentGovernor,
			ScalingDriver:      c.ScalingDriver,
			UncoreCurrentKhz:   c.UncoreCurrentKHz,
			UncoreMinKhz:       c.UncoreMinKHz,
			UncoreMaxKhz:       c.UncoreMaxKHz,
			PowerCapMicroW:     c.PowerCapMicroW,
			PowerCapMinMicroW:  c.PowerCapMinMicroW,
			PowerCapMaxMicroW:  c.PowerCapMaxMicroW,
		})
	}
	return out
}

func toPBMediumMetrics(v *MediumMetrics) *cpupb.MediumMetrics {
	if v == nil {
		return nil
	}
	out := &cpupb.MediumMetrics{
		Cores:        make([]*cpupb.CoreFastMetrics, 0, len(v.Cores)),
		Temperatures: make([]*cpupb.PackageTemperature, 0, len(v.Temperatures)),
	}
	for _, c := range v.Cores {
		out.Cores = append(out.Cores, &cpupb.CoreFastMetrics{
			CoreId:            int32(c.CoreID),
			Utilization:       c.Utilization,
			ScalingCurKhz:     c.ScalingCurKHz,
			PackageId:         int32(c.PackageID),
			SampledAtUnixNano: c.SampledAtNano,
		})
	}
	for _, t := range v.Temperatures {
		out.Temperatures = append(out.Temperatures, &cpupb.PackageTemperature{
			PackageId:         int32(t.PackageID),
			MilliC:            t.MilliC,
			SampledAtUnixNano: t.SampledAtNano,
		})
	}
	return out
}

func toPBUltraMetrics(v *UltraMetrics) *cpupb.UltraMetrics {
	if v == nil {
		return nil
	}
	out := &cpupb.UltraMetrics{
		PerCore: make([]*cpupb.PerCoreConfig, 0, len(v.PerCore)),
		Rapl:    make([]*cpupb.PackageRAPL, 0, len(v.RAPL)),
		Uncore:  make([]*cpupb.UncoreMetrics, 0, len(v.Uncore)),
	}
	for _, c := range v.PerCore {
		out.PerCore = append(out.PerCore, &cpupb.PerCoreConfig{
			CoreId:             int32(c.CoreID),
			ScalingMinKhz:      c.ScalingMinKHz,
			ScalingMaxKhz:      c.ScalingMaxKHz,
			AvailableGovernors: append([]string(nil), c.AvailableGovernors...),
			CurrentGovernor:    c.CurrentGovernor,
			ScalingDriver:      c.ScalingDriver,
			PackageId:          int32(c.PackageID),
			SampledAtUnixNano:  c.SampledAtNano,
		})
	}
	for _, r := range v.RAPL {
		out.Rapl = append(out.Rapl, &cpupb.PackageRAPL{
			PackageId:         int32(r.PackageID),
			EnergyMicroJ:      r.EnergyMicroJ,
			PowerCapMicroW:    r.PowerCapMicroW,
			SampledAtUnixNano: r.SampledAtNano,
		})
	}
	for _, u := range v.Uncore {
		out.Uncore = append(out.Uncore, &cpupb.UncoreMetrics{
			PackageId:         int32(u.PackageID),
			CurrentKhz:        u.CurrentKHz,
			MinKhz:            u.MinKHz,
			MaxKhz:            u.MaxKHz,
			InitialMinKhz:     u.InitialMinKHz,
			InitialMaxKhz:     u.InitialMaxKHz,
			SampledAtUnixNano: u.SampledAtNano,
		})
	}
	return out
}
