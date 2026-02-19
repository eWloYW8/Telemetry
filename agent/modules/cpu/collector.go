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
	cpuinfoMin     string
	cpuinfoMax     string
	governor       string
	availGovernors string
	driver         string
}

type uncoreDomain struct {
	packageID int
	dieID     int
	base      string
}

type raplZone struct {
	packageID        int
	energyPath       string
	powerCapPath     string
	maxPowerPath     string
	dramEnergyPath   string
	dramPowerCapPath string
	dramMaxPowerPath string
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
	uncorePaths  map[int][]uncoreDomain
	raplBackend  raplBackend
	coreToPkg    map[int]int
	devices      []DeviceInfo

	mu        sync.Mutex
	prevTicks map[int]coreTick
}

func NewCollector(static StaticInfo, mappings []CoreMapping, packageTemps map[int]string) *Collector {
	coreFiles := make([]corePaths, 0, len(mappings))
	coreToPkg := make(map[int]int, len(mappings))
	sampleByPackage := make(map[int]corePaths, static.Packages)
	pkgSet := make(map[int]struct{}, static.Packages)
	for _, m := range mappings {
		base := fmt.Sprintf("/sys/devices/system/cpu/cpu%d/cpufreq", m.CoreID)
		paths := corePaths{
			coreID:         m.CoreID,
			scalingCur:     filepath.Join(base, "scaling_cur_freq"),
			scalingMin:     filepath.Join(base, "scaling_min_freq"),
			scalingMax:     filepath.Join(base, "scaling_max_freq"),
			cpuinfoMin:     filepath.Join(base, "cpuinfo_min_freq"),
			cpuinfoMax:     filepath.Join(base, "cpuinfo_max_freq"),
			governor:       filepath.Join(base, "scaling_governor"),
			availGovernors: filepath.Join(base, "scaling_available_governors"),
			driver:         filepath.Join(base, "scaling_driver"),
		}
		coreFiles = append(coreFiles, paths)
		coreToPkg[m.CoreID] = m.PackageID
		pkgSet[m.PackageID] = struct{}{}
		if sampled, ok := sampleByPackage[m.PackageID]; !ok || paths.coreID < sampled.coreID {
			sampleByPackage[m.PackageID] = paths
		}
	}
	uncore := discoverUncoreDomains(pkgSet)
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

func discoverUncoreDomains(validPackages map[int]struct{}) map[int][]uncoreDomain {
	const root = "/sys/devices/system/cpu/intel_uncore_frequency"
	out := make(map[int][]uncoreDomain, len(validPackages))

	entries, err := os.ReadDir(root)
	if err != nil {
		return out
	}
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		pkgID, dieID, ok := parseUncoreDomainName(entry.Name())
		if !ok {
			continue
		}
		if len(validPackages) > 0 {
			if _, exists := validPackages[pkgID]; !exists {
				continue
			}
		}
		out[pkgID] = append(out[pkgID], uncoreDomain{
			packageID: pkgID,
			dieID:     dieID,
			base:      filepath.Join(root, entry.Name()),
		})
	}

	for pkgID := range out {
		sort.Slice(out[pkgID], func(i, j int) bool {
			if out[pkgID][i].dieID == out[pkgID][j].dieID {
				return out[pkgID][i].base < out[pkgID][j].base
			}
			return out[pkgID][i].dieID < out[pkgID][j].dieID
		})
	}
	return out
}

func parseUncoreDomainName(name string) (pkgID int, dieID int, ok bool) {
	if !strings.HasPrefix(name, "package_") {
		return 0, 0, false
	}
	trimmed := strings.TrimPrefix(name, "package_")
	parts := strings.Split(trimmed, "_die_")
	if len(parts) != 2 {
		return 0, 0, false
	}
	pkg, err := strconv.Atoi(parts[0])
	if err != nil || pkg < 0 {
		return 0, 0, false
	}
	die, err := strconv.Atoi(parts[1])
	if err != nil || die < 0 {
		return 0, 0, false
	}
	return pkg, die, true
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
	const root = "/sys/class/powercap/intel-rapl"
	const powercapRoot = "/sys/class/powercap"
	entries, err := os.ReadDir(root)
	if err != nil {
		return zones
	}

	for _, e := range entries {
		name := e.Name()
		if !strings.HasPrefix(name, "intel-rapl:") || strings.Count(name, ":") != 1 {
			continue
		}
		base := filepath.Join(root, name)
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
		zone := raplZone{
			packageID:    pkgID,
			energyPath:   filepath.Join(base, "energy_uj"),
			powerCapPath: filepath.Join(base, "constraint_0_power_limit_uw"),
			maxPowerPath: filepath.Join(base, "constraint_0_max_power_uw"),
		}
		attachDramSubzoneFromPackageBase(base, name, &zone)
		zones[pkgID] = zone
	}

	// Some kernels expose intel-rapl:x:y as aliases directly under /sys/class/powercap.
	// Scan it as a fallback so both layouts work.
	powercapEntries, err := os.ReadDir(powercapRoot)
	if err != nil {
		return zones
	}
	for _, e := range powercapEntries {
		name := e.Name()
		if !strings.HasPrefix(name, "intel-rapl:") || strings.Count(name, ":") != 2 {
			continue
		}
		pkgID := extractParentPackageID(name)
		if pkgID < 0 {
			continue
		}
		zone, ok := zones[pkgID]
		if !ok {
			continue
		}
		if zone.dramEnergyPath != "" {
			continue
		}
		if !attachDramSubzonePaths(filepath.Join(powercapRoot, name), &zone) {
			continue
		}
		zones[pkgID] = zone
	}

	return zones
}

func attachDramSubzoneFromPackageBase(base, packageZoneName string, zone *raplZone) {
	entries, err := os.ReadDir(base)
	if err != nil {
		return
	}
	for _, e := range entries {
		name := e.Name()
		if !strings.HasPrefix(name, packageZoneName+":") {
			continue
		}
		if strings.Count(name, ":") < 2 {
			continue
		}
		if attachDramSubzonePaths(filepath.Join(base, name), zone) {
			return
		}
	}
}

func attachDramSubzonePaths(base string, zone *raplZone) bool {
	zoneName, err := readTrimmed(filepath.Join(base, "name"))
	if err != nil || !strings.EqualFold(zoneName, string(PowerCapDomainDRAM)) {
		return false
	}
	zone.dramEnergyPath = filepath.Join(base, "energy_uj")
	zone.dramPowerCapPath = filepath.Join(base, "constraint_0_power_limit_uw")
	zone.dramMaxPowerPath = filepath.Join(base, "constraint_0_max_power_uw")
	return true
}

func extractParentPackageID(zone string) int {
	if !strings.HasPrefix(zone, "intel-rapl:") {
		return -1
	}
	trimmed := strings.TrimPrefix(zone, "intel-rapl:")
	parent, _, ok := strings.Cut(trimmed, ":")
	if !ok || parent == "" {
		return -1
	}
	return extractPackageID(parent)
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
		sampledAt := time.Now().UnixNano()
		out.Cores = append(out.Cores, CoreFastMetrics{
			CoreID:        cp.coreID,
			Utilization:   util,
			ScalingCurKHz: curKHz,
			PackageID:     c.coreToPkg[cp.coreID],
			SampledAtNano: sampledAt,
		})
	}
	c.mu.Unlock()

	tempByPkg := make(map[int]PackageTemperature, len(c.packageTemps))
	if len(c.packageTemps) > 0 {
		pkgIDs := make([]int, 0, len(c.packageTemps))
		for pkgID := range c.packageTemps {
			pkgIDs = append(pkgIDs, pkgID)
		}
		sort.Ints(pkgIDs)
		for _, pkgID := range pkgIDs {
			v, err := readUint(c.packageTemps[pkgID])
			if err != nil {
				continue
			}
			tempByPkg[pkgID] = PackageTemperature{
				PackageID:     pkgID,
				MilliC:        uint32(v),
				SampledAtNano: time.Now().UnixNano(),
			}
		}
	}
	if c.raplBackend != nil {
		for _, t := range c.raplBackend.ReadTemperatures() {
			if _, exists := tempByPkg[t.PackageID]; exists {
				continue
			}
			tempByPkg[t.PackageID] = t
		}
	}
	if len(tempByPkg) > 0 {
		pkgIDs := make([]int, 0, len(tempByPkg))
		for pkgID := range tempByPkg {
			pkgIDs = append(pkgIDs, pkgID)
		}
		sort.Ints(pkgIDs)
		out.Temperatures = make([]PackageTemperature, 0, len(pkgIDs))
		for _, pkgID := range pkgIDs {
			out.Temperatures = append(out.Temperatures, tempByPkg[pkgID])
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
		sampledAt := time.Now().UnixNano()

		cfg := PerCoreConfig{
			CoreID:          cp.coreID,
			ScalingMinKHz:   minVal,
			ScalingMaxKHz:   maxVal,
			CurrentGovernor: gov,
			ScalingDriver:   driver,
			PackageID:       c.coreToPkg[cp.coreID],
			SampledAtNano:   sampledAt,
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
		domains := c.uncorePaths[pkgID]
		if len(domains) == 0 {
			continue
		}
		current, minVal, maxVal, initMin, initMax, ok := readFirstUncoreMetrics(domains)
		if !ok {
			continue
		}
		sampledAt := time.Now().UnixNano()
		out.Uncore = append(out.Uncore, UncoreMetrics{
			PackageID:     pkgID,
			CurrentKHz:    current,
			MinKHz:        minVal,
			MaxKHz:        maxVal,
			InitialMinKHz: initMin,
			InitialMaxKHz: initMax,
			SampledAtNano: sampledAt,
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

func (c *Collector) PackageControls() []PackageControlInfo {
	if c == nil {
		return nil
	}

	controlsByPkg := make(map[int]*PackageControlInfo, len(c.sampleCore))
	for _, cp := range c.sampleCore {
		pkgID := c.coreToPkg[cp.coreID]
		minVal, _ := readUint(cp.scalingMin)
		maxVal, _ := readUint(cp.scalingMax)
		gov, _ := readTrimmed(cp.governor)
		avail, _ := readTrimmed(cp.availGovernors)
		driver, _ := readTrimmed(cp.driver)

		info := &PackageControlInfo{
			PackageID:       pkgID,
			ScalingMinKHz:   minVal,
			ScalingMaxKHz:   maxVal,
			ScalingHWMinKHz: minVal,
			ScalingHWMaxKHz: maxVal,
			CurrentGovernor: gov,
			ScalingDriver:   driver,
		}
		if hwMin, err := readUint(cp.cpuinfoMin); err == nil && hwMin > 0 {
			info.ScalingHWMinKHz = hwMin
		}
		if hwMax, err := readUint(cp.cpuinfoMax); err == nil && hwMax > 0 {
			info.ScalingHWMaxKHz = hwMax
		}
		if avail != "" {
			info.AvailableGovernors = strings.Fields(avail)
		}
		controlsByPkg[pkgID] = info
	}

	pkgIDs := make([]int, 0, len(controlsByPkg))
	for pkgID := range controlsByPkg {
		pkgIDs = append(pkgIDs, pkgID)
	}
	sort.Ints(pkgIDs)

	for _, pkgID := range pkgIDs {
		domains, ok := c.uncorePaths[pkgID]
		if !ok || len(domains) == 0 {
			continue
		}
		ctrl := controlsByPkg[pkgID]
		current, minVal, maxVal, initMin, initMax, readOK := readFirstUncoreMetrics(domains)
		if !readOK {
			continue
		}
		ctrl.UncoreCurrentKHz = current
		// Use initial_* as stable control bounds; min/max may be current runtime settings.
		if initMin > 0 {
			ctrl.UncoreMinKHz = initMin
		} else {
			ctrl.UncoreMinKHz = minVal
		}
		if initMax > 0 {
			ctrl.UncoreMaxKHz = initMax
		} else {
			ctrl.UncoreMaxKHz = maxVal
		}
	}

	if c.raplBackend != nil {
		for _, cap := range c.raplBackend.ReadControlRanges() {
			ctrl, ok := controlsByPkg[cap.PackageID]
			if !ok {
				ctrl = &PackageControlInfo{PackageID: cap.PackageID}
				controlsByPkg[cap.PackageID] = ctrl
				pkgIDs = append(pkgIDs, cap.PackageID)
			}
			ctrl.PowerCapMicroW = cap.CurrentMicroW
			ctrl.PowerCapMinMicroW = cap.MinMicroWatt
			ctrl.PowerCapMaxMicroW = cap.MaxMicroWatt
			ctrl.DramPowerCapMicroW = cap.DramCurrentMicroW
			ctrl.DramPowerCapMinMicroW = cap.DramMinMicroWatt
			ctrl.DramPowerCapMaxMicroW = cap.DramMaxMicroWatt
		}
	}

	sort.Ints(pkgIDs)
	dedup := pkgIDs[:0]
	last := -1
	for _, pkgID := range pkgIDs {
		if len(dedup) > 0 && pkgID == last {
			continue
		}
		dedup = append(dedup, pkgID)
		last = pkgID
	}
	pkgIDs = dedup

	out := make([]PackageControlInfo, 0, len(pkgIDs))
	for _, pkgID := range pkgIDs {
		ctrl := controlsByPkg[pkgID]
		if ctrl == nil {
			continue
		}
		cp := *ctrl
		cp.AvailableGovernors = append([]string(nil), ctrl.AvailableGovernors...)
		out = append(out, cp)
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

func readFirstUncoreMetrics(domains []uncoreDomain) (current, minVal, maxVal, initMin, initMax uint64, ok bool) {
	for _, domain := range domains {
		cur, err := readUint(filepath.Join(domain.base, "current_freq_khz"))
		if err != nil {
			continue
		}
		minKhz, _ := readUint(filepath.Join(domain.base, "min_freq_khz"))
		maxKhz, _ := readUint(filepath.Join(domain.base, "max_freq_khz"))
		initialMin, _ := readUint(filepath.Join(domain.base, "initial_min_freq_khz"))
		initialMax, _ := readUint(filepath.Join(domain.base, "initial_max_freq_khz"))
		return cur, minKhz, maxKhz, initialMin, initialMax, true
	}
	return 0, 0, 0, 0, 0, false
}
