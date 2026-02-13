package cpu

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

func readInt(path string) (int64, error) {
	s, err := readTrimmed(path)
	if err != nil {
		return 0, err
	}
	if s == "" {
		return 0, errors.New("empty value")
	}
	v, err := strconv.ParseInt(s, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("parse int from %s: %w", path, err)
	}
	return v, nil
}
