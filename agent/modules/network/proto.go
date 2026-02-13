package network

import networkpb "telemetry/agent/modules/network/pb"

func toPBModuleRegistration(v *Registration) *networkpb.ModuleRegistration {
	if v == nil {
		return nil
	}
	out := &networkpb.ModuleRegistration{
		Collectors: make([]*networkpb.CollectorSpec, 0, len(v.Collectors)),
	}
	for _, c := range v.Collectors {
		out.Collectors = append(out.Collectors, &networkpb.CollectorSpec{
			Category: c.Category,
			Interval: c.Interval,
		})
	}
	return out
}

func toPBMetrics(v *Metrics) *networkpb.Metrics {
	if v == nil {
		return nil
	}
	out := &networkpb.Metrics{
		Interfaces: make([]*networkpb.InterfaceMetrics, 0, len(v.Interfaces)),
	}
	for _, iface := range v.Interfaces {
		out.Interfaces = append(out.Interfaces, &networkpb.InterfaceMetrics{
			Name:      iface.Name,
			Ips:       append([]string(nil), iface.IPs...),
			RxBytes:   iface.RxBytes,
			RxPackets: iface.RxPackets,
			TxBytes:   iface.TxBytes,
			TxPackets: iface.TxPackets,
		})
	}
	return out
}
