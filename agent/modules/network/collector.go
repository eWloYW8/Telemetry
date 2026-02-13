package network

import (
	"net"
	"os"
	"strconv"
	"strings"
)

type Collector struct{}

func NewCollector() *Collector {
	return &Collector{}
}

func (c *Collector) Collect() (*Metrics, error) {
	ifaces, err := net.Interfaces()
	if err != nil {
		return nil, err
	}
	stats := make(map[string]InterfaceMetrics, len(ifaces))
	for _, iface := range ifaces {
		if iface.Flags&net.FlagUp == 0 {
			continue
		}
		entry := InterfaceMetrics{Name: iface.Name, IPs: make([]string, 0, 2)}
		addrs, err := iface.Addrs()
		if err == nil {
			for _, addr := range addrs {
				if ipNet, ok := addr.(*net.IPNet); ok {
					if ip := ipNet.IP.To4(); ip != nil {
						entry.IPs = append(entry.IPs, ip.String())
					}
				}
			}
		}
		stats[iface.Name] = entry
	}

	b, err := os.ReadFile("/proc/net/dev")
	if err != nil {
		return nil, err
	}
	lines := strings.Split(string(b), "\n")
	for _, line := range lines[2:] {
		fields := strings.Fields(line)
		if len(fields) < 17 {
			continue
		}
		name := strings.TrimSuffix(fields[0], ":")
		entry, ok := stats[name]
		if !ok {
			continue
		}
		entry.RxBytes, _ = strconv.ParseUint(fields[1], 10, 64)
		entry.RxPackets, _ = strconv.ParseUint(fields[2], 10, 64)
		entry.TxBytes, _ = strconv.ParseUint(fields[9], 10, 64)
		entry.TxPackets, _ = strconv.ParseUint(fields[10], 10, 64)
		stats[name] = entry
	}

	out := &Metrics{Interfaces: make([]InterfaceMetrics, 0, len(stats))}
	for _, v := range stats {
		out.Interfaces = append(out.Interfaces, v)
	}
	return out, nil
}
