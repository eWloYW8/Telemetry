package cpu

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
)

type CoreMapping struct {
	CoreID         int
	PackageID      int
	PhysicalCoreID int
	Vendor         string
	Model          string
}

func DiscoverTopology() (StaticInfo, []CoreMapping, error) {
	defaultVendor, defaultModel, packageInfo := parseCPUInfoByPackage()
	if (defaultVendor == "" || defaultModel == "") && len(packageInfo) > 0 {
		for _, info := range packageInfo {
			if defaultVendor == "" && info.Vendor != "" {
				defaultVendor = info.Vendor
			}
			if defaultModel == "" && info.Model != "" {
				defaultModel = info.Model
			}
			if defaultVendor != "" && defaultModel != "" {
				break
			}
		}
	}

	entries, err := os.ReadDir("/sys/devices/system/cpu")
	if err != nil {
		return StaticInfo{}, nil, fmt.Errorf("read cpu sysfs: %w", err)
	}

	mappings := make([]CoreMapping, 0, 256)
	packageSet := make(map[int]struct{})
	coreSet := make(map[string]struct{})
	logical := 0

	for _, e := range entries {
		name := e.Name()
		if !strings.HasPrefix(name, "cpu") || len(name) <= 3 {
			continue
		}
		id, err := strconv.Atoi(name[3:])
		if err != nil {
			continue
		}
		pkgPath := filepath.Join("/sys/devices/system/cpu", name, "topology", "physical_package_id")
		corePath := filepath.Join("/sys/devices/system/cpu", name, "topology", "core_id")
		pkg, err := readInt(pkgPath)
		if err != nil {
			continue
		}
		core, err := readInt(corePath)
		if err != nil {
			continue
		}
		mappings = append(mappings, CoreMapping{CoreID: id, PackageID: int(pkg), PhysicalCoreID: int(core)})
		packageSet[int(pkg)] = struct{}{}
		coreSet[fmt.Sprintf("%d:%d", pkg, core)] = struct{}{}
		logical++
	}

	sort.Slice(mappings, func(i, j int) bool {
		if mappings[i].PackageID == mappings[j].PackageID {
			return mappings[i].CoreID < mappings[j].CoreID
		}
		return mappings[i].PackageID < mappings[j].PackageID
	})

	minKHz, _ := readUint("/sys/devices/system/cpu/cpu0/cpufreq/cpuinfo_min_freq")
	maxKHz, _ := readUint("/sys/devices/system/cpu/cpu0/cpufreq/cpuinfo_max_freq")
	_, uncoreErr := os.Stat("/sys/devices/system/cpu/intel_uncore_frequency")
	_, raplErr := os.Stat("/sys/class/powercap/intel-rapl")

	threadsPerCore := 1
	if len(coreSet) > 0 {
		threadsPerCore = logical / len(coreSet)
		if threadsPerCore <= 0 {
			threadsPerCore = 1
		}
	}

	static := StaticInfo{
		Vendor:              defaultVendor,
		Model:               defaultModel,
		Packages:            len(packageSet),
		PhysicalCores:       len(coreSet),
		LogicalCores:        logical,
		ThreadsPerCore:      threadsPerCore,
		CPUInfoMinKHz:       minKHz,
		CPUInfoMaxKHz:       maxKHz,
		SupportsIntelUncore: uncoreErr == nil,
		SupportsRAPL:        raplErr == nil,
	}
	for i := range mappings {
		meta, ok := packageInfo[mappings[i].PackageID]
		if !ok {
			meta = packageCPUInfo{Vendor: defaultVendor, Model: defaultModel}
		}
		mappings[i].Vendor = meta.Vendor
		mappings[i].Model = meta.Model
	}
	return static, mappings, nil
}

type packageCPUInfo struct {
	Vendor string
	Model  string
}

func parseCPUInfoByPackage() (string, string, map[int]packageCPUInfo) {
	data, err := os.ReadFile("/proc/cpuinfo")
	if err != nil {
		return "", "", map[int]packageCPUInfo{}
	}

	defaultVendor := ""
	defaultModel := ""
	infoByPackage := make(map[int]packageCPUInfo, 8)

	records := strings.Split(string(data), "\n\n")
	for _, rec := range records {
		if strings.TrimSpace(rec) == "" {
			continue
		}
		pkgID := -1
		vendor := ""
		model := ""
		for _, line := range strings.Split(rec, "\n") {
			parts := strings.SplitN(line, ":", 2)
			if len(parts) != 2 {
				continue
			}
			key := strings.TrimSpace(parts[0])
			val := strings.TrimSpace(parts[1])
			switch key {
			case "physical id":
				if v, err := strconv.Atoi(val); err == nil {
					pkgID = v
				}
			case "vendor_id":
				vendor = val
			case "model name":
				model = val
			}
		}
		if defaultVendor == "" && vendor != "" {
			defaultVendor = vendor
		}
		if defaultModel == "" && model != "" {
			defaultModel = model
		}
		if pkgID < 0 {
			continue
		}
		if _, exists := infoByPackage[pkgID]; exists {
			continue
		}
		infoByPackage[pkgID] = packageCPUInfo{
			Vendor: vendor,
			Model:  model,
		}
	}
	return defaultVendor, defaultModel, infoByPackage
}

func DiscoverPackageTemperatureInputs(mappings []CoreMapping) map[int]string {
	packageSet := make(map[int]struct{}, 8)
	for _, m := range mappings {
		packageSet[m.PackageID] = struct{}{}
	}
	packageIDs := make([]int, 0, len(packageSet))
	for pkgID := range packageSet {
		packageIDs = append(packageIDs, pkgID)
	}
	sort.Ints(packageIDs)

	output := make(map[int]string, len(packageIDs))

	labelFiles, _ := filepath.Glob("/sys/class/hwmon/hwmon*/temp*_label")
	for _, labelPath := range labelFiles {
		label, err := readTrimmed(labelPath)
		if err != nil {
			continue
		}
		pkgID := parsePackageIDFromLabel(label)
		if pkgID < 0 {
			continue
		}
		if _, wanted := packageSet[pkgID]; !wanted {
			continue
		}
		if _, exists := output[pkgID]; exists {
			continue
		}
		inputPath := strings.TrimSuffix(labelPath, "_label") + "_input"
		if _, err := os.Stat(inputPath); err == nil {
			output[pkgID] = inputPath
		}
	}

	missing := make([]int, 0, len(packageIDs))
	for _, pkgID := range packageIDs {
		if _, ok := output[pkgID]; ok {
			continue
		}
		missing = append(missing, pkgID)
	}
	if len(missing) == 0 {
		return output
	}

	zones := DiscoverThermalZones()
	if len(zones) == 0 {
		return output
	}
	sort.Strings(zones)
	if len(missing) == 1 {
		output[missing[0]] = zones[0]
		return output
	}
	if len(zones) == len(missing) {
		for i, pkgID := range missing {
			output[pkgID] = zones[i]
		}
	}
	return output
}

func parsePackageIDFromLabel(label string) int {
	lower := strings.ToLower(strings.TrimSpace(label))
	if !strings.Contains(lower, "package id") {
		return -1
	}
	parts := strings.FieldsFunc(lower, func(r rune) bool {
		return r < '0' || r > '9'
	})
	if len(parts) == 0 {
		return -1
	}
	v, err := strconv.Atoi(parts[len(parts)-1])
	if err != nil {
		return -1
	}
	return v
}

func DiscoverThermalZones() []string {
	entries, err := os.ReadDir("/sys/class/thermal")
	if err != nil {
		return nil
	}
	zones := make([]string, 0, 4)
	for _, e := range entries {
		name := e.Name()
		if !strings.HasPrefix(name, "thermal_zone") {
			continue
		}
		typePath := filepath.Join("/sys/class/thermal", name, "type")
		t, err := readTrimmed(typePath)
		if err != nil {
			continue
		}
		lt := strings.ToLower(t)
		if strings.Contains(lt, "x86_pkg_temp") || strings.Contains(lt, "cpu") {
			zones = append(zones, filepath.Join("/sys/class/thermal", name, "temp"))
		}
	}
	sort.Strings(zones)
	return zones
}
