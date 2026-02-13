package cpu

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"
)

type Controller struct {
	collector *Collector
}

func NewController(collector *Collector) *Controller {
	return &Controller{collector: collector}
}

func (c *Controller) SetScalingRange(packageID int, minKHz, maxKHz uint64) error {
	if c == nil || c.collector == nil {
		return fmt.Errorf("cpu controller is unavailable")
	}
	if packageID >= 0 && !c.packageExists(packageID) {
		return fmt.Errorf("cpu package %d not found", packageID)
	}
	for _, cp := range c.collector.corePaths {
		if packageID >= 0 && c.collector.coreToPkg[cp.coreID] != packageID {
			continue
		}
		if minKHz > 0 {
			if err := os.WriteFile(cp.scalingMin, []byte(strconv.FormatUint(minKHz, 10)), 0o644); err != nil {
				return fmt.Errorf("set core %d scaling min: %w", cp.coreID, err)
			}
		}
		if maxKHz > 0 {
			if err := os.WriteFile(cp.scalingMax, []byte(strconv.FormatUint(maxKHz, 10)), 0o644); err != nil {
				return fmt.Errorf("set core %d scaling max: %w", cp.coreID, err)
			}
		}
	}
	return nil
}

func (c *Controller) SetGovernor(packageID int, governor string) error {
	if c == nil || c.collector == nil {
		return fmt.Errorf("cpu controller is unavailable")
	}
	if governor == "" {
		return fmt.Errorf("governor is empty")
	}
	if packageID >= 0 && !c.packageExists(packageID) {
		return fmt.Errorf("cpu package %d not found", packageID)
	}
	for _, cp := range c.collector.corePaths {
		if packageID >= 0 && c.collector.coreToPkg[cp.coreID] != packageID {
			continue
		}
		if err := os.WriteFile(cp.governor, []byte(governor), 0o644); err != nil {
			return fmt.Errorf("set core %d governor: %w", cp.coreID, err)
		}
	}
	return nil
}

func (c *Controller) packageExists(packageID int) bool {
	for _, d := range c.collector.devices {
		if d.PackageID == packageID {
			return true
		}
	}
	return false
}

func (c *Controller) SetUncoreRange(pkgID int, minKHz, maxKHz uint64) error {
	if c == nil || c.collector == nil {
		return fmt.Errorf("cpu controller is unavailable")
	}
	base, ok := c.collector.uncorePaths[pkgID]
	if !ok {
		return fmt.Errorf("uncore package %d not found", pkgID)
	}
	if minKHz > 0 {
		if err := os.WriteFile(filepath.Join(base, "min_freq_khz"), []byte(strconv.FormatUint(minKHz, 10)), 0o644); err != nil {
			return fmt.Errorf("set uncore min for package %d: %w", pkgID, err)
		}
	}
	if maxKHz > 0 {
		if err := os.WriteFile(filepath.Join(base, "max_freq_khz"), []byte(strconv.FormatUint(maxKHz, 10)), 0o644); err != nil {
			return fmt.Errorf("set uncore max for package %d: %w", pkgID, err)
		}
	}
	return nil
}

func (c *Controller) SetPowerCap(pkgID int, microWatt uint64) error {
	if c == nil || c.collector == nil {
		return fmt.Errorf("cpu controller is unavailable")
	}
	if microWatt == 0 {
		return fmt.Errorf("power cap is zero")
	}
	if c.collector.raplBackend == nil {
		return fmt.Errorf("power cap control is unavailable for package %d", pkgID)
	}
	return c.collector.raplBackend.SetPowerCap(pkgID, microWatt)
}
