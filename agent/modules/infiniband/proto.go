package infiniband

import infinibandpb "github.com/eWloYW8/Telemetry/agent/modules/infiniband/pb"

func toPBModuleRegistration(v *Registration) *infinibandpb.ModuleRegistration {
	if v == nil {
		return nil
	}
	out := &infinibandpb.ModuleRegistration{
		Collectors: make([]*infinibandpb.CollectorSpec, 0, len(v.Collectors)),
	}
	for _, c := range v.Collectors {
		out.Collectors = append(out.Collectors, &infinibandpb.CollectorSpec{
			Category: c.Category,
			Interval: c.Interval,
		})
	}
	return out
}

func toPBMetrics(v *Metrics) *infinibandpb.Metrics {
	if v == nil {
		return nil
	}
	out := &infinibandpb.Metrics{
		Interfaces: make([]*infinibandpb.InterfaceMetrics, 0, len(v.Interfaces)),
	}
	for _, iface := range v.Interfaces {
		out.Interfaces = append(out.Interfaces, &infinibandpb.InterfaceMetrics{
			Name:              iface.Name,
			Address:           iface.Address,
			OperState:         iface.OperState,
			Mtu:               iface.MTU,
			IbDevice:          iface.IBDevice,
			Port:              iface.Port,
			Rate:              iface.Rate,
			LinkState:         iface.LinkState,
			PhysicalState:     iface.PhysicalState,
			RxBytes:           iface.RxBytes,
			TxBytes:           iface.TxBytes,
			SampledAtUnixNano: iface.SampledAtNano,
		})
	}
	return out
}
