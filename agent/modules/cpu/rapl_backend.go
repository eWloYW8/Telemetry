package cpu

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"
)

type raplBackend interface {
	ReadAll() []PackageRAPL
	SetPowerCap(pkgID int, microWatt uint64, domain PowerCapDomain) error
	ReadControlRanges() []PackagePowerCapRange
	ReadTemperatures() []PackageTemperature
}

type PackagePowerCapRange struct {
	PackageID         int
	CurrentMicroW     uint64
	MinMicroWatt      uint64
	MaxMicroWatt      uint64
	DramCurrentMicroW uint64
	DramMinMicroWatt  uint64
	DramMaxMicroWatt  uint64
}

func newRAPLBackend(static StaticInfo, mappings []CoreMapping) raplBackend {
	if isAMDVendor(static.Vendor) {
		if backend, err := newAMDRAPLBackend(mappings); err == nil {
			return backend
		}
	}
	if backend := newIntelRAPLBackend(); backend != nil {
		return backend
	}
	return nil
}

func isAMDVendor(vendor string) bool {
	lower := strings.ToLower(strings.TrimSpace(vendor))
	return strings.Contains(lower, "amd")
}

type intelRAPLBackend struct {
	zones map[int]raplZone
}

func newIntelRAPLBackend() *intelRAPLBackend {
	zones := discoverRAPLZones()
	if len(zones) == 0 {
		return nil
	}
	return &intelRAPLBackend{zones: zones}
}

func (b *intelRAPLBackend) ReadAll() []PackageRAPL {
	if b == nil || len(b.zones) == 0 {
		return nil
	}
	pkgIDs := make([]int, 0, len(b.zones))
	for pkgID := range b.zones {
		pkgIDs = append(pkgIDs, pkgID)
	}
	sort.Ints(pkgIDs)
	out := make([]PackageRAPL, 0, len(pkgIDs))
	for _, pkgID := range pkgIDs {
		zone := b.zones[pkgID]
		energy, err := readUint(zone.energyPath)
		if err != nil {
			continue
		}
		capVal, _ := readUint(zone.powerCapPath)
		dramEnergy := uint64(0)
		if zone.dramEnergyPath != "" {
			dramEnergy, _ = readUint(zone.dramEnergyPath)
		}
		dramCap := uint64(0)
		if zone.dramPowerCapPath != "" {
			dramCap, _ = readUint(zone.dramPowerCapPath)
		}
		sampledAt := time.Now().UnixNano()
		out = append(out, PackageRAPL{
			PackageID:          pkgID,
			EnergyMicroJ:       energy,
			PowerCapMicroW:     capVal,
			DramEnergyMicroJ:   dramEnergy,
			DramPowerCapMicroW: dramCap,
			SampledAtNano:      sampledAt,
		})
	}
	return out
}

func (b *intelRAPLBackend) SetPowerCap(pkgID int, microWatt uint64, domain PowerCapDomain) error {
	if b == nil {
		return fmt.Errorf("intel rapl backend is unavailable")
	}
	zone, ok := b.zones[pkgID]
	if !ok {
		return fmt.Errorf("power cap control is unavailable for package %d", pkgID)
	}
	targetPath := zone.powerCapPath
	domainLabel := string(PowerCapDomainPackage)
	if domain == PowerCapDomainDRAM {
		if zone.dramPowerCapPath == "" {
			return fmt.Errorf("dram power cap control is unavailable for package %d", pkgID)
		}
		targetPath = zone.dramPowerCapPath
		domainLabel = string(PowerCapDomainDRAM)
	}
	if err := os.WriteFile(targetPath, []byte(strconv.FormatUint(microWatt, 10)), 0o644); err != nil {
		return fmt.Errorf("set package %d %s power cap: %w", pkgID, domainLabel, err)
	}
	return nil
}

func (b *intelRAPLBackend) ReadControlRanges() []PackagePowerCapRange {
	if b == nil || len(b.zones) == 0 {
		return nil
	}
	pkgIDs := make([]int, 0, len(b.zones))
	for pkgID := range b.zones {
		pkgIDs = append(pkgIDs, pkgID)
	}
	sort.Ints(pkgIDs)

	out := make([]PackagePowerCapRange, 0, len(pkgIDs))
	for _, pkgID := range pkgIDs {
		zone := b.zones[pkgID]
		current, _ := readUint(zone.powerCapPath)
		maxCap, _ := readUint(zone.maxPowerPath)
		dramCurrent := uint64(0)
		dramMaxCap := uint64(0)
		if zone.dramPowerCapPath != "" {
			dramCurrent, _ = readUint(zone.dramPowerCapPath)
			dramMaxCap, _ = readUint(zone.dramMaxPowerPath)
		}
		out = append(out, PackagePowerCapRange{
			PackageID:         pkgID,
			CurrentMicroW:     current,
			MaxMicroWatt:      maxCap,
			DramCurrentMicroW: dramCurrent,
			DramMaxMicroWatt:  dramMaxCap,
		})
	}
	return out
}

func (b *intelRAPLBackend) ReadTemperatures() []PackageTemperature {
	return nil
}

type amdRAPLBackend struct {
	sensorsByPkgID map[int]amdHSMPSensor

	mu               sync.Mutex
	energyByPkgID    map[int]uint64
	lastSampleByPkgID map[int]time.Time
}

type amdHSMPSensor struct {
	socketID        int
	hwmonPath       string
	powerInputPath  string
	powerCapPath    string
	maxPowerCapPath string
}

func newAMDRAPLBackend(mappings []CoreMapping) (*amdRAPLBackend, error) {
	sensors := discoverAMDHSMPHwmonSensors()
	if len(sensors) == 0 {
		return nil, fmt.Errorf("amd hsmp hwmon sensors are unavailable")
	}

	pkgIDs := make([]int, 0, 8)
	pkgSet := make(map[int]struct{}, 8)
	for _, m := range mappings {
		if _, ok := pkgSet[m.PackageID]; ok {
			continue
		}
		pkgSet[m.PackageID] = struct{}{}
		pkgIDs = append(pkgIDs, m.PackageID)
	}
	sort.Ints(pkgIDs)

	sensorsByPkgID, err := buildPackageHSMPSensorMap(pkgIDs, sensors)
	if err != nil {
		return nil, err
	}

	return &amdRAPLBackend{
		sensorsByPkgID:    sensorsByPkgID,
		energyByPkgID:     make(map[int]uint64, len(sensorsByPkgID)),
		lastSampleByPkgID: make(map[int]time.Time, len(sensorsByPkgID)),
	}, nil
}

func discoverAMDHSMPHwmonSensors() []amdHSMPSensor {
	const root = "/sys/devices/platform/amd_hsmp/hwmon"

	hwmons, _ := filepath.Glob(filepath.Join(root, "hwmon*"))
	sort.Slice(hwmons, func(i, j int) bool {
		left := extractPackageID(filepath.Base(hwmons[i]))
		right := extractPackageID(filepath.Base(hwmons[j]))
		if left == right {
			return hwmons[i] < hwmons[j]
		}
		if left < 0 {
			return false
		}
		if right < 0 {
			return true
		}
		return left < right
	})

	sensors := make([]amdHSMPSensor, 0, len(hwmons))
	for _, hwmon := range hwmons {
		name, err := readTrimmed(filepath.Join(hwmon, "name"))
		if err != nil || !strings.EqualFold(name, "amd_hsmp_hwmon") {
			continue
		}

		inputPath := filepath.Join(hwmon, "power1_input")
		if _, err := readUint(inputPath); err != nil {
			continue
		}

		socketID := len(sensors)
		if id, err := readInt(filepath.Join(hwmon, "socket_id")); err == nil && id >= 0 {
			socketID = int(id)
		}

		sensors = append(sensors, amdHSMPSensor{
			socketID:        socketID,
			hwmonPath:       hwmon,
			powerInputPath:  inputPath,
			powerCapPath:    filepath.Join(hwmon, "power1_cap"),
			maxPowerCapPath: filepath.Join(hwmon, "power1_cap_max"),
		})
	}
	sort.Slice(sensors, func(i, j int) bool {
		if sensors[i].socketID == sensors[j].socketID {
			return sensors[i].hwmonPath < sensors[j].hwmonPath
		}
		return sensors[i].socketID < sensors[j].socketID
	})
	return sensors
}

func buildPackageHSMPSensorMap(pkgIDs []int, sensors []amdHSMPSensor) (map[int]amdHSMPSensor, error) {
	if len(pkgIDs) == 0 {
		return nil, fmt.Errorf("no cpu package found")
	}
	if len(sensors) == 0 {
		return nil, fmt.Errorf("no amd hsmp hwmon sensor found")
	}

	sensorBySocketID := make(map[int]amdHSMPSensor, len(sensors))
	for _, sensor := range sensors {
		if _, exists := sensorBySocketID[sensor.socketID]; exists {
			continue
		}
		sensorBySocketID[sensor.socketID] = sensor
	}

	allDirect := true
	for _, pkgID := range pkgIDs {
		if pkgID < 0 {
			allDirect = false
			break
		}
		if _, ok := sensorBySocketID[pkgID]; !ok {
			allDirect = false
			break
		}
	}
	mapping := make(map[int]amdHSMPSensor, len(pkgIDs))
	if allDirect {
		for _, pkgID := range pkgIDs {
			mapping[pkgID] = sensorBySocketID[pkgID]
		}
		return mapping, nil
	}

	if len(sensors) != len(pkgIDs) {
		return nil, fmt.Errorf("cannot map packages %v to %d amd hsmp hwmon sensors", pkgIDs, len(sensors))
	}
	for i, pkgID := range pkgIDs {
		mapping[pkgID] = sensors[i]
	}
	return mapping, nil
}

func (b *amdRAPLBackend) ReadAll() []PackageRAPL {
	if b == nil || len(b.sensorsByPkgID) == 0 {
		return nil
	}

	pkgIDs := make([]int, 0, len(b.sensorsByPkgID))
	for pkgID := range b.sensorsByPkgID {
		pkgIDs = append(pkgIDs, pkgID)
	}
	sort.Ints(pkgIDs)

	out := make([]PackageRAPL, 0, len(pkgIDs))
	for _, pkgID := range pkgIDs {
		sensor := b.sensorsByPkgID[pkgID]
		powerMicroW, err := readUint(sensor.powerInputPath)
		if err != nil {
			continue
		}
		sampledAt := time.Now()
		energyMicroJ := b.integrateEnergy(pkgID, powerMicroW, sampledAt)

		powerCapMicroW := uint64(0)
		if cap, err := readUint(sensor.powerCapPath); err == nil {
			powerCapMicroW = cap
		}
		out = append(out, PackageRAPL{
			PackageID:      pkgID,
			EnergyMicroJ:   energyMicroJ,
			PowerCapMicroW: powerCapMicroW,
			SampledAtNano:  sampledAt.UnixNano(),
		})
	}
	return out
}

func (b *amdRAPLBackend) integrateEnergy(pkgID int, powerMicroW uint64, sampledAt time.Time) uint64 {
	b.mu.Lock()
	defer b.mu.Unlock()

	energy := b.energyByPkgID[pkgID]
	if prev, ok := b.lastSampleByPkgID[pkgID]; ok && sampledAt.After(prev) {
		elapsed := sampledAt.Sub(prev)
		seconds := uint64(elapsed / time.Second)
		remainder := uint64(elapsed % time.Second)
		energy += powerMicroW*seconds + powerMicroW*remainder/uint64(time.Second)
		b.energyByPkgID[pkgID] = energy
	}
	b.lastSampleByPkgID[pkgID] = sampledAt
	return energy
}

func (b *amdRAPLBackend) SetPowerCap(pkgID int, microWatt uint64, domain PowerCapDomain) error {
	if b == nil || len(b.sensorsByPkgID) == 0 {
		return fmt.Errorf("amd rapl backend is unavailable")
	}
	if domain == PowerCapDomainDRAM {
		return fmt.Errorf("dram power cap control is unavailable for package %d", pkgID)
	}
	sensor, ok := b.sensorsByPkgID[pkgID]
	if !ok {
		return fmt.Errorf("power cap control is unavailable for package %d", pkgID)
	}

	milliWatt := microWatt / 1000
	if milliWatt == 0 {
		milliWatt = 1
	}
	targetMicroW := milliWatt * 1000
	if maxMicroW, err := readUint(sensor.maxPowerCapPath); err == nil && maxMicroW > 0 && targetMicroW > maxMicroW {
		targetMicroW = maxMicroW
	}
	if err := os.WriteFile(sensor.powerCapPath, []byte(strconv.FormatUint(targetMicroW, 10)), 0o644); err != nil {
		return fmt.Errorf("set package %d power cap: %w", pkgID, err)
	}
	return nil
}

func (b *amdRAPLBackend) ReadControlRanges() []PackagePowerCapRange {
	if b == nil || len(b.sensorsByPkgID) == 0 {
		return nil
	}

	pkgIDs := make([]int, 0, len(b.sensorsByPkgID))
	for pkgID := range b.sensorsByPkgID {
		pkgIDs = append(pkgIDs, pkgID)
	}
	sort.Ints(pkgIDs)

	out := make([]PackagePowerCapRange, 0, len(pkgIDs))
	for _, pkgID := range pkgIDs {
		current := uint64(0)
		sensor := b.sensorsByPkgID[pkgID]
		if cap, err := readUint(sensor.powerCapPath); err == nil {
			current = cap
		}
		maxMicroW := uint64(0)
		if maxCap, err := readUint(sensor.maxPowerCapPath); err == nil {
			maxMicroW = maxCap
		}
		out = append(out, PackagePowerCapRange{
			PackageID:     pkgID,
			CurrentMicroW: current,
			MaxMicroWatt:  maxMicroW,
		})
	}
	return out
}

func (b *amdRAPLBackend) ReadTemperatures() []PackageTemperature {
	return nil
}
