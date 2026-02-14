package storage

import storagepb "telemetry/agent/modules/storage/pb"

func toPBModuleRegistration(v *Registration) *storagepb.ModuleRegistration {
	if v == nil {
		return nil
	}
	out := &storagepb.ModuleRegistration{
		Collectors:  make([]*storagepb.CollectorSpec, 0, len(v.Collectors)),
		StaticDisks: make([]*storagepb.StaticDiskInfo, 0, len(v.StaticDisks)),
	}
	for _, c := range v.Collectors {
		out.Collectors = append(out.Collectors, &storagepb.CollectorSpec{
			Category: c.Category,
			Interval: c.Interval,
		})
	}
	for _, d := range v.StaticDisks {
		out.StaticDisks = append(out.StaticDisks, &storagepb.StaticDiskInfo{
			Name:       d.Name,
			Mountpoint: d.Mountpoint,
			Filesystem: d.Filesystem,
			TotalBytes: d.TotalBytes,
		})
	}
	return out
}

func toPBMetrics(v *Metrics) *storagepb.Metrics {
	if v == nil {
		return nil
	}
	out := &storagepb.Metrics{
		Disks: make([]*storagepb.DiskMetrics, 0, len(v.Disks)),
	}
	for _, d := range v.Disks {
		out.Disks = append(out.Disks, &storagepb.DiskMetrics{
			Name:              d.Name,
			UsedBytes:         d.UsedBytes,
			FreeBytes:         d.FreeBytes,
			ReadSectors:       d.ReadSectors,
			WriteSectors:      d.WriteSectors,
			ReadIos:           d.ReadIOs,
			WriteIos:          d.WriteIOs,
			SampledAtUnixNano: d.SampledAtNano,
		})
	}
	return out
}
