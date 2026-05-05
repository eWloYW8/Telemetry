package amdgpu

import (
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
)

func readTrimmed(path string) (string, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(string(b)), nil
}

func readUint(path string) (uint64, error) {
	s, err := readTrimmed(path)
	if err != nil {
		return 0, err
	}
	if s == "" {
		return 0, errors.New("empty value")
	}
	v, err := strconv.ParseUint(s, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("parse uint from %s: %w", path, err)
	}
	return v, nil
}

func writeString(path, value string) error {
	return os.WriteFile(path, []byte(value), 0o644)
}

func readFile(path string) ([]byte, error) {
	return os.ReadFile(path)
}

// parseDPMTable parses lines of the form
//
//	0: 500Mhz
//	1: 1801Mhz *
//
// into an ordered slice of MHz values. Returns nil on any parse error.
func parseDPMTable(content string) []uint32 {
	lines := strings.Split(content, "\n")
	out := make([]uint32, 0, len(lines))
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		// Split "idx: value MHz [*]" on first colon.
		colon := strings.IndexByte(line, ':')
		if colon < 0 {
			continue
		}
		rest := strings.TrimSpace(line[colon+1:])
		rest = strings.TrimSuffix(rest, "*")
		rest = strings.TrimSpace(rest)
		// strip trailing unit (case-insensitive "Mhz" or "MHz")
		lowerRest := strings.ToLower(rest)
		if idx := strings.Index(lowerRest, "mhz"); idx >= 0 {
			rest = strings.TrimSpace(rest[:idx])
		}
		n, err := strconv.ParseUint(rest, 10, 32)
		if err != nil {
			continue
		}
		// Row index must be preserved even for 0 MHz entries, because the
		// kernel-facing DPM masks are written by position. On RDNA4 the
		// `*`-marked row shows the live clock rather than the canonical
		// DPM step, and reads 0 when the GPU is in GFXOFF power-gating.
		// Downstream range/min-max logic must tolerate 0 values.
		out = append(out, uint32(n))
	}
	return out
}
