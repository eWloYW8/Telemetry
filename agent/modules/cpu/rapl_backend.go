package cpu

import (
	"fmt"
	"math"
	"os"
	"sort"
	"strconv"
	"strings"

	esmi "github.com/eWloYW8/esmi-go"
)

type raplBackend interface {
	ReadAll() []PackageRAPL
	SetPowerCap(pkgID int, microWatt uint64) error
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
		out = append(out, PackageRAPL{
			PackageID:      pkgID,
			EnergyMicroJ:   energy,
			PowerCapMicroW: capVal,
		})
	}
	return out
}

func (b *intelRAPLBackend) SetPowerCap(pkgID int, microWatt uint64) error {
	if b == nil {
		return fmt.Errorf("intel rapl backend is unavailable")
	}
	zone, ok := b.zones[pkgID]
	if !ok {
		return fmt.Errorf("power cap control is unavailable for package %d", pkgID)
	}
	if err := os.WriteFile(zone.powerCapPath, []byte(strconv.FormatUint(microWatt, 10)), 0o644); err != nil {
		return fmt.Errorf("set package %d power cap: %w", pkgID, err)
	}
	return nil
}

type amdRAPLBackend struct {
	client        *esmi.Client
	socketByPkgID map[int]uint32
}

func newAMDRAPLBackend(mappings []CoreMapping) (*amdRAPLBackend, error) {
	client, err := esmi.NewClient()
	if err != nil {
		return nil, err
	}

	socketCount, err := client.NumberOfSockets()
	if err != nil {
		_ = client.Close()
		return nil, err
	}
	if socketCount == 0 {
		_ = client.Close()
		return nil, fmt.Errorf("esmi reports zero sockets")
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

	socketByPkgID, err := buildPackageSocketMap(pkgIDs, socketCount)
	if err != nil {
		_ = client.Close()
		return nil, err
	}

	return &amdRAPLBackend{
		client:        client,
		socketByPkgID: socketByPkgID,
	}, nil
}

func buildPackageSocketMap(pkgIDs []int, socketCount uint32) (map[int]uint32, error) {
	if len(pkgIDs) == 0 {
		return nil, fmt.Errorf("no cpu package found")
	}

	allDirect := true
	for _, pkgID := range pkgIDs {
		if pkgID < 0 || uint32(pkgID) >= socketCount {
			allDirect = false
			break
		}
	}
	mapping := make(map[int]uint32, len(pkgIDs))
	if allDirect {
		for _, pkgID := range pkgIDs {
			mapping[pkgID] = uint32(pkgID)
		}
		return mapping, nil
	}

	if int(socketCount) != len(pkgIDs) {
		return nil, fmt.Errorf("cannot map packages %v to %d esmi sockets", pkgIDs, socketCount)
	}
	for i, pkgID := range pkgIDs {
		mapping[pkgID] = uint32(i)
	}
	return mapping, nil
}

func (b *amdRAPLBackend) ReadAll() []PackageRAPL {
	if b == nil || b.client == nil || len(b.socketByPkgID) == 0 {
		return nil
	}

	pkgIDs := make([]int, 0, len(b.socketByPkgID))
	for pkgID := range b.socketByPkgID {
		pkgIDs = append(pkgIDs, pkgID)
	}
	sort.Ints(pkgIDs)

	out := make([]PackageRAPL, 0, len(pkgIDs))
	for _, pkgID := range pkgIDs {
		socketID := b.socketByPkgID[pkgID]
		energyMicroJ, err := b.client.SocketEnergy(socketID)
		if err != nil {
			continue
		}
		capMilliW, err := b.client.SocketPowerCap(socketID)
		powerCapMicroW := uint64(0)
		if err == nil {
			powerCapMicroW = uint64(capMilliW) * 1000
		}
		out = append(out, PackageRAPL{
			PackageID:      pkgID,
			EnergyMicroJ:   energyMicroJ,
			PowerCapMicroW: powerCapMicroW,
		})
	}
	return out
}

func (b *amdRAPLBackend) SetPowerCap(pkgID int, microWatt uint64) error {
	if b == nil || b.client == nil {
		return fmt.Errorf("amd rapl backend is unavailable")
	}
	socketID, ok := b.socketByPkgID[pkgID]
	if !ok {
		return fmt.Errorf("power cap control is unavailable for package %d", pkgID)
	}
	milliWatt := microWatt / 1000
	if milliWatt == 0 {
		return fmt.Errorf("amd esmi expects >= 1mW power cap")
	}
	if milliWatt > math.MaxUint32 {
		return fmt.Errorf("power cap %d microW exceeds amd esmi range", microWatt)
	}
	if err := b.client.SetSocketPowerCap(socketID, uint32(milliWatt)); err != nil {
		return fmt.Errorf("set package %d power cap: %w", pkgID, err)
	}
	return nil
}
