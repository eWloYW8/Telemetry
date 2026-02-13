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

type corePaths struct {
	coreID         int
	scalingCur     string
	scalingMin     string
	scalingMax     string
	governor       string
	availGovernors string
	driver         string
}

type raplZone struct {
	packageID    int
	energyPath   string
	powerCapPath string
}

type coreTick struct {
	user, nice, system, idle, iowait, irq, softirq, steal uint64
}

func (t coreTick) total() uint64 {
	return t.user + t.nice + t.system + t.idle + t.iowait + t.irq + t.softirq + t.steal
}

type Collector struct {
	staticInfo   StaticInfo
	mappings     []CoreMapping
	corePaths    []corePaths
	sampleCore   []corePaths
	packageTemps map[int]string
	uncorePaths  map[int]string
	raplBackend  raplBackend
	coreToPkg    map[int]int
	devices      []DeviceInfo

	mu        sync.Mutex
	prevTicks map[int]coreTick
}

func NewCollector(static StaticInfo, mappings []CoreMapping, packageTemps map[int]string) *Collector {
	coreFiles := make([]corePaths, 0, len(mappings))
	uncore := make(map[int]string)
	coreToPkg := make(map[int]int, len(mappings))
	sampleByPackage := make(map[int]corePaths, static.Packages)
	for _, m := range mappings {
		base := fmt.Sprintf("/sys/devices/system/cpu/cpu%d/cpufreq", m.CoreID)
		paths := corePaths{
			coreID:         m.CoreID,
			scalingCur:     filepath.Join(base, "scaling_cur_freq"),
			scalingMin:     filepath.Join(base, "scaling_min_freq"),
			scalingMax:     filepath.Join(base, "scaling_max_freq"),
			governor:       filepath.Join(base, "scaling_governor"),
			availGovernors: filepath.Join(base, "scaling_available_governors"),
			driver:         filepath.Join(base, "scaling_driver"),
		}
		coreFiles = append(coreFiles, paths)
		coreToPkg[m.CoreID] = m.PackageID
		if _, ok := uncore[m.PackageID]; !ok {
			uncore[m.PackageID] = fmt.Sprintf("/sys/devices/system/cpu/intel_uncore_frequency/package_%02d_die_00", m.PackageID)
		}
		if sampled, ok := sampleByPackage[m.PackageID]; !ok || paths.coreID < sampled.coreID {
			sampleByPackage[m.PackageID] = paths
		}
	}
	sort.Slice(coreFiles, func(i, j int) bool { return coreFiles[i].coreID < coreFiles[j].coreID })
	sampleCores := make([]corePaths, 0, len(sampleByPackage))
	for _, sampled := range sampleByPackage {
		sampleCores = append(sampleCores, sampled)
	}
	sort.Slice(sampleCores, func(i, j int) bool {
		return coreToPkg[sampleCores[i].coreID] < coreToPkg[sampleCores[j].coreID]
	})

	backend := newRAPLBackend(static, mappings)
	static.SupportsRAPL = backend != nil

	return &Collector{
		staticInfo:   static,
		mappings:     mappings,
		corePaths:    coreFiles,
		sampleCore:   sampleCores,
		packageTemps: packageTemps,
		uncorePaths:  uncore,
		raplBackend:  backend,
		coreToPkg:    coreToPkg,
		devices:      buildDevices(mappings),
		prevTicks:    make(map[int]coreTick, len(mappings)),
	}
}

func buildDevices(mappings []CoreMapping) []DeviceInfo {
	pkgToCores := make(map[int][]int, 8)
	pkgToPhysical := make(map[int]map[int]struct{}, 8)
	for _, m := range mappings {
		pkgToCores[m.PackageID] = append(pkgToCores[m.PackageID], m.CoreID)
		if _, ok := pkgToPhysical[m.PackageID]; !ok {
			pkgToPhysical[m.PackageID] = make(map[int]struct{}, 64)
		}
		pkgToPhysical[m.PackageID][m.PhysicalCoreID] = struct{}{}
	}
	pkgIDs := make([]int, 0, len(pkgToCores))
	for pkgID := range pkgToCores {
		pkgIDs = append(pkgIDs, pkgID)
	}
	sort.Ints(pkgIDs)

	devices := make([]DeviceInfo, 0, len(pkgIDs))
	for _, pkgID := range pkgIDs {
		coreIDs := append([]int(nil), pkgToCores[pkgID]...)
		sort.Ints(coreIDs)
		meta := packageModelFor(mappings, pkgID)
		devices = append(devices, DeviceInfo{
			PackageID:   pkgID,
			Vendor:      meta.Vendor,
			Model:       meta.Model,
			CoreIDs:     coreIDs,
			CoreCount:   uint32(len(pkgToPhysical[pkgID])),
			ThreadCount: uint32(len(coreIDs)),
		})
	}
	return devices
}

func packageModelFor(mappings []CoreMapping, pkgID int) packageCPUInfo {
	for _, m := range mappings {
		if m.PackageID != pkgID {
			continue
		}
		return packageCPUInfo{
			Vendor: m.Vendor,
			Model:  m.Model,
		}
	}
	return packageCPUInfo{}
}

func discoverRAPLZones() map[int]raplZone {
	zones := make(map[int]raplZone)
	entries, err := os.ReadDir("/sys/class/powercap/intel-rapl")
	if err != nil {
		return zones
	}
	for _, e := range entries {
		name := e.Name()
		if !strings.HasPrefix(name, "intel-rapl:") || strings.Count(name, ":") != 1 {
			continue
		}
		base := filepath.Join("/sys/class/powercap/intel-rapl", name)
		zoneName, err := readTrimmed(filepath.Join(base, "name"))
		if err != nil {
			continue
		}
		pkgID := extractPackageID(zoneName)
		if pkgID < 0 {
			pkgID = extractPackageID(name)
		}
		if pkgID < 0 {
			continue
		}
		zones[pkgID] = raplZone{
			packageID:    pkgID,
			energyPath:   filepath.Join(base, "energy_uj"),
			powerCapPath: filepath.Join(base, "constraint_0_power_limit_uw"),
		}
	}
	return zones
}

func extractPackageID(s string) int {
	for i := len(s) - 1; i >= 0; i-- {
		if s[i] < '0' || s[i] > '9' {
			if i == len(s)-1 {
				return -1
			}
			v, err := strconv.Atoi(s[i+1:])
			if err != nil {
				return -1
			}
			return v
		}
	}
	v, err := strconv.Atoi(s)
	if err != nil {
		return -1
	}
	return v
}

func (c *Collector) CollectMedium() (*MediumMetrics, error) {
	ticks, err := readProcStatPerCore()
	if err != nil {
		return nil, err
	}

	out := &MediumMetrics{
		Cores: make([]CoreFastMetrics, 0, len(c.corePaths)),
	}

	c.mu.Lock()
	for _, cp := range c.corePaths {
		currentTick, ok := ticks[cp.coreID]
		if !ok {
			continue
		}
		prev := c.prevTicks[cp.coreID]
		c.prevTicks[cp.coreID] = currentTick

		util := 0.0
		currTotal := currentTick.total()
		prevTotal := prev.total()
		if prevTotal > 0 && currTotal > prevTotal {
			totalDelta := currTotal - prevTotal
			idleDelta := (currentTick.idle + currentTick.iowait) - (prev.idle + prev.iowait)
			if totalDelta > 0 {
				util = float64(totalDelta-idleDelta) / float64(totalDelta)
			}
		}
		curKHz, _ := readUint(cp.scalingCur)
		out.Cores = append(out.Cores, CoreFastMetrics{
			CoreID:        cp.coreID,
			Utilization:   util,
			ScalingCurKHz: curKHz,
			PackageID:     c.coreToPkg[cp.coreID],
		})
	}
	c.mu.Unlock()

	if len(c.packageTemps) > 0 {
		pkgIDs := make([]int, 0, len(c.packageTemps))
		for pkgID := range c.packageTemps {
			pkgIDs = append(pkgIDs, pkgID)
		}
		sort.Ints(pkgIDs)
		out.Temperatures = make([]PackageTemperature, 0, len(pkgIDs))
		for _, pkgID := range pkgIDs {
			v, err := readUint(c.packageTemps[pkgID])
			if err != nil {
				continue
			}
			out.Temperatures = append(out.Temperatures, PackageTemperature{
				PackageID: pkgID,
				MilliC:    uint32(v),
			})
		}
	}

	return out, nil
}

func readProcStatPerCore() (map[int]coreTick, error) {
	b, err := os.ReadFile("/proc/stat")
	if err != nil {
		return nil, err
	}
	lines := strings.Split(string(b), "\n")
	out := make(map[int]coreTick, 128)
	for _, line := range lines {
		if !strings.HasPrefix(line, "cpu") || strings.HasPrefix(line, "cpu ") {
			continue
		}
		fields := strings.Fields(line)
		if len(fields) < 8 {
			continue
		}
		id, err := strconv.Atoi(strings.TrimPrefix(fields[0], "cpu"))
		if err != nil {
			continue
		}
		parse := func(i int) uint64 {
			if i >= len(fields) {
				return 0
			}
			v, _ := strconv.ParseUint(fields[i], 10, 64)
			return v
		}
		out[id] = coreTick{
			user:    parse(1),
			nice:    parse(2),
			system:  parse(3),
			idle:    parse(4),
			iowait:  parse(5),
			irq:     parse(6),
			softirq: parse(7),
			steal:   parse(8),
		}
	}
	return out, nil
}

func (c *Collector) CollectUltra() (*UltraMetrics, error) {
	out := &UltraMetrics{
		PerCore: make([]PerCoreConfig, 0, len(c.sampleCore)),
		Uncore:  make([]UncoreMetrics, 0, len(c.uncorePaths)),
	}
	for _, cp := range c.sampleCore {
		minVal, _ := readUint(cp.scalingMin)
		maxVal, _ := readUint(cp.scalingMax)
		gov, _ := readTrimmed(cp.governor)
		avail, _ := readTrimmed(cp.availGovernors)
		driver, _ := readTrimmed(cp.driver)

		cfg := PerCoreConfig{
			CoreID:          cp.coreID,
			ScalingMinKHz:   minVal,
			ScalingMaxKHz:   maxVal,
			CurrentGovernor: gov,
			ScalingDriver:   driver,
			PackageID:       c.coreToPkg[cp.coreID],
		}
		if avail != "" {
			cfg.AvailableGovernors = strings.Fields(avail)
		}
		out.PerCore = append(out.PerCore, cfg)
	}

	pkgIDs := make([]int, 0, len(c.uncorePaths))
	for pkgID := range c.uncorePaths {
		pkgIDs = append(pkgIDs, pkgID)
	}
	sort.Ints(pkgIDs)
	for _, pkgID := range pkgIDs {
		base := c.uncorePaths[pkgID]
		current, err := readUint(filepath.Join(base, "current_freq_khz"))
		if err != nil {
			continue
		}
		minVal, _ := readUint(filepath.Join(base, "min_freq_khz"))
		maxVal, _ := readUint(filepath.Join(base, "max_freq_khz"))
		initMin, _ := readUint(filepath.Join(base, "initial_min_freq_khz"))
		initMax, _ := readUint(filepath.Join(base, "initial_max_freq_khz"))
		out.Uncore = append(out.Uncore, UncoreMetrics{
			PackageID:     pkgID,
			CurrentKHz:    current,
			MinKHz:        minVal,
			MaxKHz:        maxVal,
			InitialMinKHz: initMin,
			InitialMaxKHz: initMax,
		})
	}

	if c.raplBackend != nil {
		out.RAPL = c.raplBackend.ReadAll()
	}

	return out, nil
}

func (c *Collector) StaticInfo() StaticInfo {
	return c.staticInfo
}

func (c *Collector) Devices() []DeviceInfo {
	if c == nil || len(c.devices) == 0 {
		return nil
	}
	out := make([]DeviceInfo, 0, len(c.devices))
	for _, d := range c.devices {
		out = append(out, DeviceInfo{
			PackageID:   d.PackageID,
			Vendor:      d.Vendor,
			Model:       d.Model,
			CoreIDs:     append([]int(nil), d.CoreIDs...),
			CoreCount:   d.CoreCount,
			ThreadCount: d.ThreadCount,
		})
	}
	return out
}

func (c *Collector) WaitWarmup(sampleInterval time.Duration) {
	if sampleInterval <= 0 {
		sampleInterval = 100 * time.Millisecond
	}
	_, _ = c.CollectMedium()
	time.Sleep(sampleInterval)
}
