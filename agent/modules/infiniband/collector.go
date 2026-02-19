package infiniband

import (
	"fmt"
	"math"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"
)

const (
	sysClassNetPath        = "/sys/class/net"
	sysClassInfinibandPath = "/sys/class/infiniband"
	infinibandIfType       = "32"
	ibDataWordBytes        = 4
)

type Collector struct{}

func NewCollector() *Collector {
	return &Collector{}
}

func (c *Collector) Collect() (*Metrics, error) {
	ibDevices, err := os.ReadDir(sysClassInfinibandPath)
	if err != nil {
		return nil, err
	}

	ipoibMeta := collectIPoIBMeta()
	sampledAt := time.Now().UnixNano()
	out := &Metrics{Interfaces: make([]InterfaceMetrics, 0, len(ibDevices))}

	for _, dev := range ibDevices {
		portsDir := filepath.Join(sysClassInfinibandPath, dev.Name(), "ports")
		portEntries, err := os.ReadDir(portsDir)
		if err != nil {
			continue
		}
		for _, portEntry := range portEntries {
			if !portEntry.IsDir() {
				continue
			}
			metrics, ok := collectPortMetrics(dev.Name(), portEntry.Name(), sampledAt, ipoibMeta)
			if !ok {
				continue
			}
			out.Interfaces = append(out.Interfaces, metrics)
		}
	}

	sort.Slice(out.Interfaces, func(i, j int) bool {
		return out.Interfaces[i].Name < out.Interfaces[j].Name
	})

	return out, nil
}

type ipoibInterfaceMeta struct {
	Name      string
	Address   string
	OperState string
	MTU       uint32
}

func collectIPoIBMeta() map[string]ipoibInterfaceMeta {
	ifaces, err := os.ReadDir(sysClassNetPath)
	if err != nil {
		return nil
	}
	out := make(map[string]ipoibInterfaceMeta, len(ifaces))
	for _, iface := range ifaces {
		ifaceName := iface.Name()
		basePath := filepath.Join(sysClassNetPath, ifaceName)
		ifType, err := readTrimmed(filepath.Join(basePath, "type"))
		if err != nil || ifType != infinibandIfType {
			continue
		}
		ibDevice, port, ok := netIfacePortRef(ifaceName)
		if !ok {
			continue
		}
		address, _ := readTrimmed(filepath.Join(basePath, "address"))
		operState, _ := readTrimmed(filepath.Join(basePath, "operstate"))
		mtu, _ := readUint32(filepath.Join(basePath, "mtu"))
		out[fmt.Sprintf("%s:%d", ibDevice, port)] = ipoibInterfaceMeta{
			Name:      ifaceName,
			Address:   address,
			OperState: operState,
			MTU:       mtu,
		}
	}
	return out
}

func collectPortMetrics(ibDevice, portName string, sampledAt int64, ipoibMeta map[string]ipoibInterfaceMeta) (InterfaceMetrics, bool) {
	port, err := strconv.ParseUint(portName, 10, 32)
	if err != nil {
		return InterfaceMetrics{}, false
	}
	portPath := filepath.Join(sysClassInfinibandPath, ibDevice, "ports", portName)

	rxWords, err := readPortCounterWords(portPath, "port_rcv_data")
	if err != nil {
		return InterfaceMetrics{}, false
	}
	txWords, err := readPortCounterWords(portPath, "port_xmit_data")
	if err != nil {
		return InterfaceMetrics{}, false
	}

	rate, _ := readTrimmed(filepath.Join(portPath, "rate"))
	linkState := normalizeStateLabel(readTrimmedOrEmpty(filepath.Join(portPath, "state")))
	physicalState := normalizeStateLabel(readTrimmedOrEmpty(filepath.Join(portPath, "phys_state")))

	key := fmt.Sprintf("%s:%d", ibDevice, uint32(port))
	meta, ok := ipoibMeta[key]
	name := fmt.Sprintf("%s/%s", ibDevice, portName)
	if ok && meta.Name != "" {
		name = meta.Name
	}
	return InterfaceMetrics{
		Name:          name,
		Address:       meta.Address,
		OperState:     meta.OperState,
		MTU:           meta.MTU,
		IBDevice:      ibDevice,
		Port:          uint32(port),
		Rate:          rate,
		LinkState:     linkState,
		PhysicalState: physicalState,
		// port_{rcv,xmit}_data are reported as 32-bit words in IB sysfs.
		RxBytes:       dataWordsToBytes(rxWords),
		TxBytes:       dataWordsToBytes(txWords),
		SampledAtNano: sampledAt,
	}, true
}

func netIfacePortRef(iface string) (string, uint32, bool) {
	matches, err := filepath.Glob(filepath.Join(sysClassNetPath, iface, "device/infiniband/*/ports/*"))
	if err != nil || len(matches) == 0 {
		return "", 0, false
	}
	sort.Strings(matches)
	portPath := matches[0]

	deviceName := filepath.Base(filepath.Dir(filepath.Dir(portPath))) // .../infiniband/<device>/ports/<port>
	if parsed, err := strconv.ParseUint(filepath.Base(portPath), 10, 32); err == nil {
		return deviceName, uint32(parsed), true
	}
	return "", 0, false
}

func readPortCounterWords(portPath, counter string) (uint64, error) {
	candidates := []string{
		filepath.Join(portPath, "counters_ext", counter+"_64"),
		filepath.Join(portPath, "counters_ext", counter),
		filepath.Join(portPath, "hw_counters", counter),
		filepath.Join(portPath, "counters", counter),
	}
	for _, path := range candidates {
		v, err := readUint64(path)
		if err == nil {
			return v, nil
		}
	}
	return 0, os.ErrNotExist
}

func dataWordsToBytes(words uint64) uint64 {
	if words > math.MaxUint64/ibDataWordBytes {
		return math.MaxUint64
	}
	return words * ibDataWordBytes
}

func normalizeStateLabel(raw string) string {
	if idx := strings.Index(raw, ":"); idx >= 0 {
		return strings.TrimSpace(raw[idx+1:])
	}
	return strings.TrimSpace(raw)
}

func readTrimmedOrEmpty(path string) string {
	v, _ := readTrimmed(path)
	return v
}

func readTrimmed(path string) (string, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(string(b)), nil
}

func readUint32(path string) (uint32, error) {
	v, err := readTrimmed(path)
	if err != nil {
		return 0, err
	}
	n, err := strconv.ParseUint(v, 10, 32)
	if err != nil {
		return 0, err
	}
	return uint32(n), nil
}

func readUint64(path string) (uint64, error) {
	v, err := readTrimmed(path)
	if err != nil {
		return 0, err
	}
	return strconv.ParseUint(v, 10, 64)
}
