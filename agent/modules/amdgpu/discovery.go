//go:build linux

package amdgpu

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

const amdVendorID = "0x1002"

// deviceInfo describes a discovered AMD GPU.
type deviceInfo struct {
	index     int
	pciAddr   string // e.g. 0000:83:00.0
	devPath   string // /sys/bus/pci/devices/0000:83:00.0
	hwmonPath string // /sys/.../hwmon/hwmonN (first amdgpu hwmon under device)

	name           string
	vramTotalBytes uint64
	powerMinUw     uint64
	powerMaxUw     uint64
	sclkDPM        []uint32 // ordered ascending
	mclkDPM        []uint32
}

func discoverDevices() ([]*deviceInfo, error) {
	const drmRoot = "/sys/class/drm"
	entries, err := os.ReadDir(drmRoot)
	if err != nil {
		return nil, fmt.Errorf("read %s: %w", drmRoot, err)
	}

	seen := make(map[string]struct{})
	var found []*deviceInfo
	for _, entry := range entries {
		name := entry.Name()
		// card0, card1, ... - skip connector nodes like card0-DP-1
		if !strings.HasPrefix(name, "card") || strings.Contains(name, "-") {
			continue
		}
		devLink := filepath.Join(drmRoot, name, "device")
		resolved, err := filepath.EvalSymlinks(devLink)
		if err != nil {
			continue
		}
		if _, ok := seen[resolved]; ok {
			continue
		}

		vendor, _ := readTrimmed(filepath.Join(resolved, "vendor"))
		if !strings.EqualFold(vendor, amdVendorID) {
			continue
		}
		driverLink, err := os.Readlink(filepath.Join(resolved, "driver"))
		if err != nil || filepath.Base(driverLink) != "amdgpu" {
			continue
		}
		seen[resolved] = struct{}{}

		info := &deviceInfo{
			pciAddr: filepath.Base(resolved),
			devPath: resolved,
		}
		populateStatic(info)
		found = append(found, info)
	}

	sort.Slice(found, func(i, j int) bool { return found[i].pciAddr < found[j].pciAddr })
	for i, dev := range found {
		dev.index = i
	}
	return found, nil
}

func populateStatic(info *deviceInfo) {
	// VRAM total
	if v, err := readUint(filepath.Join(info.devPath, "mem_info_vram_total")); err == nil {
		info.vramTotalBytes = v
	}

	// hwmon path: device/hwmon/hwmonN
	hwmonDir := filepath.Join(info.devPath, "hwmon")
	if entries, err := os.ReadDir(hwmonDir); err == nil {
		for _, e := range entries {
			candidate := filepath.Join(hwmonDir, e.Name())
			if n, err := readTrimmed(filepath.Join(candidate, "name")); err == nil && n == "amdgpu" {
				info.hwmonPath = candidate
				break
			}
		}
	}

	if info.hwmonPath != "" {
		info.powerMinUw, _ = readUint(filepath.Join(info.hwmonPath, "power1_cap_min"))
		info.powerMaxUw, _ = readUint(filepath.Join(info.hwmonPath, "power1_cap_max"))
	}

	// DPM tables - best-effort, may be empty on unsupported hardware.
	if b, err := os.ReadFile(filepath.Join(info.devPath, "pp_dpm_sclk")); err == nil {
		info.sclkDPM = parseDPMTable(string(b))
	}
	if b, err := os.ReadFile(filepath.Join(info.devPath, "pp_dpm_mclk")); err == nil {
		info.mclkDPM = parseDPMTable(string(b))
	}

	// Name: prefer udev's resolved ID_MODEL_FROM_DATABASE (populated from
	// systemd-hwdb), falling back to a PCI-derived hex label.
	if n := udevModelFromDatabase(info.pciAddr); n != "" {
		info.name = n
		return
	}
	device, _ := readTrimmed(filepath.Join(info.devPath, "device"))
	subvendor, _ := readTrimmed(filepath.Join(info.devPath, "subsystem_vendor"))
	subdevice, _ := readTrimmed(filepath.Join(info.devPath, "subsystem_device"))
	info.name = buildName(device, subvendor, subdevice, info.pciAddr)
}

// udevModelFromDatabase reads the resolved marketing name that systemd-hwdb
// populated for this PCI device. Returns empty string on any failure.
func udevModelFromDatabase(pciAddr string) string {
	// /run/udev/data/+pci:0000:83:00.0 contains lines like
	//   E:ID_MODEL_FROM_DATABASE=Navi 48 [Radeon AI PRO R9700]
	data, err := os.ReadFile("/run/udev/data/+pci:" + pciAddr)
	if err != nil {
		return ""
	}
	for _, line := range strings.Split(string(data), "\n") {
		if strings.HasPrefix(line, "E:ID_MODEL_FROM_DATABASE=") {
			return strings.TrimSpace(strings.TrimPrefix(line, "E:ID_MODEL_FROM_DATABASE="))
		}
	}
	return ""
}

func buildName(device, subvendor, subdevice, pciAddr string) string {
	dev := strings.TrimPrefix(device, "0x")
	sv := strings.TrimPrefix(subvendor, "0x")
	sd := strings.TrimPrefix(subdevice, "0x")
	if dev != "" {
		return fmt.Sprintf("AMD GPU %s (subsys %s:%s, %s)", strings.ToUpper(dev), strings.ToUpper(sv), strings.ToUpper(sd), pciAddr)
	}
	return fmt.Sprintf("AMD GPU (%s)", pciAddr)
}
