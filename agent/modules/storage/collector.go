package storage

import (
	"bufio"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"syscall"
	"time"
)

type staticDisk struct {
	name       string
	ioName     string
	mountpoint string
	fsType     string
	totalBytes uint64
}

type Collector struct {
	disks []staticDisk
}

type diskIOCounters struct {
	readIOs      uint64
	readSectors  uint64
	writeIOs     uint64
	writeSectors uint64
}

type mountInfo struct {
	device     string
	mountpoint string
	fsType     string
}

func NewCollector() *Collector {
	return &Collector{
		disks: discoverStaticDisks(),
	}
}

func (c *Collector) StaticDisks() []StaticDiskInfo {
	if c == nil || len(c.disks) == 0 {
		return nil
	}
	out := make([]StaticDiskInfo, 0, len(c.disks))
	for _, d := range c.disks {
		out = append(out, StaticDiskInfo{
			Name:       d.name,
			Mountpoint: d.mountpoint,
			Filesystem: d.fsType,
			TotalBytes: d.totalBytes,
		})
	}
	return out
}

func (c *Collector) Collect() (*Metrics, error) {
	ioCounters := readDiskStats()
	out := &Metrics{Disks: make([]DiskMetrics, 0, len(c.disks))}
	for _, d := range c.disks {
		var st syscall.Statfs_t
		if err := syscall.Statfs(d.mountpoint, &st); err != nil {
			continue
		}
		free := st.Bavail * uint64(st.Bsize)
		used := uint64(0)
		if d.totalBytes > free {
			used = d.totalBytes - free
		}
		ioName := d.ioName
		if ioName == "" {
			ioName = d.name
		}
		io := ioCounters[ioName]
		sampledAt := time.Now().UnixNano()
		out.Disks = append(out.Disks, DiskMetrics{
			Name:          d.name,
			UsedBytes:     used,
			FreeBytes:     free,
			ReadSectors:   io.readSectors,
			WriteSectors:  io.writeSectors,
			ReadIOs:       io.readIOs,
			WriteIOs:      io.writeIOs,
			SampledAtNano: sampledAt,
		})
	}
	return out, nil
}

func discoverStaticDisks() []staticDisk {
	mounts, err := readMounts()
	if err != nil {
		return nil
	}
	diskstatsByDev := readDiskStatsNameByDev()
	out := make([]staticDisk, 0, len(mounts))
	for _, m := range mounts {
		var st syscall.Statfs_t
		if err := syscall.Statfs(m.mountpoint, &st); err != nil {
			continue
		}
		name := filepath.Base(m.device)
		ioName := resolveDiskstatsName(m.device, diskstatsByDev)
		if ioName == "" {
			ioName = name
		}
		out = append(out, staticDisk{
			name:       name,
			ioName:     ioName,
			mountpoint: m.mountpoint,
			fsType:     m.fsType,
			totalBytes: st.Blocks * uint64(st.Bsize),
		})
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].name == out[j].name {
			return out[i].mountpoint < out[j].mountpoint
		}
		return out[i].name < out[j].name
	})
	return out
}

func readMounts() ([]mountInfo, error) {
	f, err := os.Open("/proc/mounts")
	if err != nil {
		return nil, err
	}
	defer f.Close()

	ignoreFS := map[string]struct{}{
		"proc": {}, "sysfs": {}, "tmpfs": {}, "devtmpfs": {}, "cgroup": {},
		"cgroup2": {}, "overlay": {}, "squashfs": {}, "tracefs": {}, "pstore": {}, "securityfs": {},
	}

	seen := make(map[string]struct{})
	out := make([]mountInfo, 0, 16)
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		fields := strings.Fields(scanner.Text())
		if len(fields) < 3 {
			continue
		}
		device, mountpoint, fsType := fields[0], fields[1], fields[2]
		if _, skip := ignoreFS[fsType]; skip {
			continue
		}
		if !strings.HasPrefix(device, "/dev/") {
			continue
		}
		if _, ok := seen[mountpoint]; ok {
			continue
		}
		seen[mountpoint] = struct{}{}
		out = append(out, mountInfo{device: device, mountpoint: mountpoint, fsType: fsType})
	}
	return out, scanner.Err()
}

func readDiskStats() map[string]diskIOCounters {
	b, err := os.ReadFile("/proc/diskstats")
	if err != nil {
		return map[string]diskIOCounters{}
	}
	out := make(map[string]diskIOCounters)
	for _, line := range strings.Split(string(b), "\n") {
		fields := strings.Fields(line)
		if len(fields) < 14 {
			continue
		}
		name := fields[2]
		if strings.HasPrefix(name, "loop") || strings.HasPrefix(name, "ram") {
			continue
		}
		readIOs, _ := strconv.ParseUint(fields[3], 10, 64)
		readSectors, _ := strconv.ParseUint(fields[5], 10, 64)
		writeIOs, _ := strconv.ParseUint(fields[7], 10, 64)
		writeSectors, _ := strconv.ParseUint(fields[9], 10, 64)
		out[name] = diskIOCounters{
			readIOs:      readIOs,
			readSectors:  readSectors,
			writeIOs:     writeIOs,
			writeSectors: writeSectors,
		}
	}
	return out
}

type diskDevKey struct {
	major uint32
	minor uint32
}

func readDiskStatsNameByDev() map[diskDevKey]string {
	b, err := os.ReadFile("/proc/diskstats")
	if err != nil {
		return map[diskDevKey]string{}
	}
	out := make(map[diskDevKey]string, 64)
	for _, line := range strings.Split(string(b), "\n") {
		fields := strings.Fields(line)
		if len(fields) < 3 {
			continue
		}
		major, errMajor := strconv.ParseUint(fields[0], 10, 32)
		minor, errMinor := strconv.ParseUint(fields[1], 10, 32)
		if errMajor != nil || errMinor != nil {
			continue
		}
		name := fields[2]
		out[diskDevKey{major: uint32(major), minor: uint32(minor)}] = name
	}
	return out
}

func resolveDiskstatsName(devicePath string, byDev map[diskDevKey]string) string {
	if devicePath == "" || len(byDev) == 0 {
		return ""
	}
	info, err := os.Stat(devicePath)
	if err != nil {
		return ""
	}
	st, ok := info.Sys().(*syscall.Stat_t)
	if !ok {
		return ""
	}
	major, minor := linuxDevMajorMinor(uint64(st.Rdev))
	if name, ok := byDev[diskDevKey{major: major, minor: minor}]; ok {
		return name
	}
	return ""
}

// linuxDevMajorMinor follows Linux kernel gnu_dev_major/minor decoding for dev_t.
func linuxDevMajorMinor(dev uint64) (major uint32, minor uint32) {
	major = uint32(((dev >> 8) & 0xfff) | ((dev >> 32) & 0xfffff000))
	minor = uint32((dev & 0xff) | ((dev >> 12) & 0xffffff00))
	return major, minor
}
