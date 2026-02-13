package process

import (
	"bufio"
	"fmt"
	"os"
	"os/user"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
)

type procSample struct {
	totalJiffies uint64
	rssPages     uint64
	ppid         int
	state        string
	uid          uint32
	command      string
}

type Collector struct {
	mu        sync.Mutex
	prevProc  map[int]uint64
	prevTotal uint64
	uidCache  map[uint32]string
	pageSize  uint64
}

func NewCollector() *Collector {
	return &Collector{
		prevProc: make(map[int]uint64, 4096),
		uidCache: make(map[uint32]string, 128),
		pageSize: uint64(os.Getpagesize()),
	}
}

func (p *Collector) Collect() (*Metrics, error) {
	total, err := readTotalJiffies()
	if err != nil {
		return nil, err
	}

	entries, err := os.ReadDir("/proc")
	if err != nil {
		return nil, err
	}

	result := make([]Info, 0, len(entries))
	nextPrev := make(map[int]uint64, len(entries))

	p.mu.Lock()
	prevTotal := p.prevTotal
	if prevTotal == 0 {
		prevTotal = total
	}
	deltaTotal := total - prevTotal

	for _, e := range entries {
		if !e.IsDir() {
			continue
		}
		pid, err := strconv.Atoi(e.Name())
		if err != nil {
			continue
		}
		sample, err := readProcSample(pid)
		if err != nil {
			continue
		}
		nextPrev[pid] = sample.totalJiffies

		cpuPercent := 0.0
		if prevJ, ok := p.prevProc[pid]; ok && deltaTotal > 0 && sample.totalJiffies >= prevJ {
			cpuPercent = float64(sample.totalJiffies-prevJ) * 100.0 / float64(deltaTotal)
		}

		result = append(result, Info{
			PID:         pid,
			PPID:        sample.ppid,
			User:        p.lookupUser(sample.uid),
			State:       sample.state,
			CPUPercent:  cpuPercent,
			MemoryBytes: sample.rssPages * p.pageSize,
			Command:     sample.command,
		})
	}

	p.prevProc = nextPrev
	p.prevTotal = total
	p.mu.Unlock()

	sort.Slice(result, func(i, j int) bool {
		if result[i].CPUPercent == result[j].CPUPercent {
			return result[i].MemoryBytes > result[j].MemoryBytes
		}
		return result[i].CPUPercent > result[j].CPUPercent
	})

	return &Metrics{Processes: result}, nil
}

func readTotalJiffies() (uint64, error) {
	line, err := readFirstLine("/proc/stat")
	if err != nil {
		return 0, err
	}
	fields := strings.Fields(line)
	if len(fields) < 8 || fields[0] != "cpu" {
		return 0, fmt.Errorf("unexpected /proc/stat format")
	}
	var total uint64
	for i := 1; i < len(fields); i++ {
		v, _ := strconv.ParseUint(fields[i], 10, 64)
		total += v
	}
	return total, nil
}

func readProcSample(pid int) (procSample, error) {
	statPath := filepath.Join("/proc", strconv.Itoa(pid), "stat")
	b, err := os.ReadFile(statPath)
	if err != nil {
		return procSample{}, err
	}

	content := string(b)
	start := strings.IndexByte(content, '(')
	end := strings.LastIndexByte(content, ')')
	if start < 0 || end < 0 || end+2 >= len(content) {
		return procSample{}, fmt.Errorf("invalid stat format")
	}
	comm := content[start+1 : end]
	rest := strings.Fields(content[end+2:])
	if len(rest) < 22 {
		return procSample{}, fmt.Errorf("stat fields too short")
	}

	state := rest[0]
	ppid, _ := strconv.Atoi(rest[1])
	utime, _ := strconv.ParseUint(rest[11], 10, 64)
	stime, _ := strconv.ParseUint(rest[12], 10, 64)
	rss, _ := strconv.ParseUint(rest[21], 10, 64)
	uid := readProcUID(pid)
	cmdline := readProcCmdline(pid)
	if cmdline == "" {
		cmdline = comm
	}

	return procSample{
		totalJiffies: utime + stime,
		rssPages:     rss,
		ppid:         ppid,
		state:        state,
		uid:          uid,
		command:      cmdline,
	}, nil
}

func readProcUID(pid int) uint32 {
	path := filepath.Join("/proc", strconv.Itoa(pid), "status")
	f, err := os.Open(path)
	if err != nil {
		return 0
	}
	defer f.Close()
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := scanner.Text()
		if !strings.HasPrefix(line, "Uid:") {
			continue
		}
		fields := strings.Fields(line)
		if len(fields) < 2 {
			return 0
		}
		uid, _ := strconv.ParseUint(fields[1], 10, 32)
		return uint32(uid)
	}
	return 0
}

func readProcCmdline(pid int) string {
	path := filepath.Join("/proc", strconv.Itoa(pid), "cmdline")
	b, err := os.ReadFile(path)
	if err != nil || len(b) == 0 {
		return ""
	}
	parts := strings.Split(string(b), "\x00")
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		if part == "" {
			continue
		}
		out = append(out, part)
	}
	return strings.Join(out, " ")
}

func (p *Collector) lookupUser(uid uint32) string {
	if v, ok := p.uidCache[uid]; ok {
		return v
	}
	u, err := user.LookupId(strconv.FormatUint(uint64(uid), 10))
	if err != nil {
		v := strconv.FormatUint(uint64(uid), 10)
		p.uidCache[uid] = v
		return v
	}
	p.uidCache[uid] = u.Username
	return u.Username
}
