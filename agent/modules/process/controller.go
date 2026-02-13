package process

import (
	"fmt"
	"os"
	"syscall"
)

type Controller struct{}

func NewController() *Controller {
	return &Controller{}
}

func (c *Controller) Signal(pid int, sig int) error {
	if pid <= 0 {
		return fmt.Errorf("invalid pid %d", pid)
	}
	proc, err := os.FindProcess(pid)
	if err != nil {
		return err
	}
	return proc.Signal(syscall.Signal(sig))
}
