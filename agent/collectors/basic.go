package collectors

import (
	"net"
	"os"
	"os/exec"
	"sort"
	"strings"

	"telemetry/api"
)

func CollectBasicInfo() (api.BasicInfo, error) {
	hostname, _ := os.Hostname()
	kernel := ""
	arch := ""
	if out, err := exec.Command("uname", "-r").Output(); err == nil {
		kernel = strings.TrimSpace(string(out))
	}
	if out, err := exec.Command("uname", "-m").Output(); err == nil {
		arch = strings.TrimSpace(string(out))
	}
	machineID, _ := readTrimmed("/etc/machine-id")
	bootID, _ := readTrimmed("/proc/sys/kernel/random/boot_id")
	osName := readOSPrettyName()
	model, _ := readTrimmed("/sys/class/dmi/id/product_name")
	vendor, _ := readTrimmed("/sys/class/dmi/id/sys_vendor")

	return api.BasicInfo{
		Hostname:       hostname,
		IPs:            localIPv4s(),
		OS:             osName,
		Kernel:         kernel,
		Arch:           arch,
		MachineID:      machineID,
		BootID:         bootID,
		HardwareModel:  model,
		HardwareVendor: vendor,
	}, nil
}

func readOSPrettyName() string {
	b, err := os.ReadFile("/etc/os-release")
	if err != nil {
		return ""
	}
	for _, line := range strings.Split(string(b), "\n") {
		if strings.HasPrefix(line, "PRETTY_NAME=") {
			return strings.Trim(strings.TrimPrefix(line, "PRETTY_NAME="), "\"")
		}
	}
	return ""
}

func localIPv4s() []string {
	ifaces, err := net.Interfaces()
	if err != nil {
		return nil
	}
	ips := make([]string, 0, 8)
	for _, iface := range ifaces {
		if iface.Flags&net.FlagUp == 0 {
			continue
		}
		addrs, err := iface.Addrs()
		if err != nil {
			continue
		}
		for _, addr := range addrs {
			ipNet, ok := addr.(*net.IPNet)
			if !ok {
				continue
			}
			if ip := ipNet.IP.To4(); ip != nil {
				ips = append(ips, ip.String())
			}
		}
	}
	sort.Strings(ips)
	return ips
}
