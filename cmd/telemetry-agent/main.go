package main

import (
	"context"
	"flag"
	"os/signal"
	"syscall"

	"github.com/eWloYW8/Telemetry/agent"
	"github.com/eWloYW8/Telemetry/config"
	"github.com/eWloYW8/Telemetry/logging"
)

func main() {
	cfgPath := flag.String("config", "configs/agent.yaml", "path to agent config")
	flag.Parse()

	cfg, err := config.LoadAgentConfig(*cfgPath)
	if err != nil {
		logger := logging.New(config.DefaultAgentConfig().Log, "telemetry-agent")
		logger.Fatal().Err(err).Str("config_path", *cfgPath).Msg("load agent config")
	}
	logger := logging.New(cfg.Log, "telemetry-agent")
	logger.Info().Str("config_path", *cfgPath).Msg("agent starting")

	ag, err := agent.New(cfg, logger)
	if err != nil {
		logger.Fatal().Err(err).Msg("init agent")
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	if err := ag.Run(ctx); err != nil && err != context.Canceled {
		logger.Fatal().Err(err).Msg("agent exited with error")
	}
	logger.Info().Msg("agent stopped")
}
