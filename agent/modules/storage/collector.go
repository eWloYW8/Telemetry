package storage

import (
	"bufio"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"
)

type Collector struct{}

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
	return &Collector{}
}

func (c *Collector) Collect() (*Metrics, error) {
	ioCounters := readDiskStats()
	mounts, err := readMounts()
	if err != nil {
		return nil, err
	}
	out := &Metrics{Disks: make([]DiskMetrics, 0, len(mounts))}
	for _, m := range mounts {
		var st syscall.Statfs_t
		if err := syscall.Statfs(m.mountpoint, &st); err != nil {
			continue
		}
		total := st.Blocks * uint64(st.Bsize)
		free := st.Bavail * uint64(st.Bsize)
		used := total - free
		device := filepath.Base(m.device)
		io := ioCounters[device]
		out.Disks = append(out.Disks, DiskMetrics{
			Name:         device,
			Mountpoint:   m.mountpoint,
			Filesystem:   m.fsType,
			TotalBytes:   total,
			UsedBytes:    used,
			FreeBytes:    free,
			ReadSectors:  io.readSectors,
			WriteSectors: io.writeSectors,
			ReadIOs:      io.readIOs,
			WriteIOs:     io.writeIOs,
		})
	}
	return out, nil
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
