package main

import (
	"context"
	"flag"
	"os/signal"
	"syscall"

	"github.com/eWloYW8/Telemetry/config"
	"github.com/eWloYW8/Telemetry/logging"
	"github.com/eWloYW8/Telemetry/server"
)

func main() {
	cfgPath := flag.String("config", "configs/server.yaml", "path to server config")
	flag.Parse()

	cfg, err := config.LoadServerConfig(*cfgPath)
	if err != nil {
		logger := logging.New(config.DefaultServerConfig().Log, "telemetry-server")
		logger.Fatal().Err(err).Str("config_path", *cfgPath).Msg("load server config")
	}
	logger := logging.New(cfg.Log, "telemetry-server")
	logger.Info().Str("config_path", *cfgPath).Msg("server starting")

	srv := server.New(cfg, logger)
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	if err := srv.Run(ctx); err != nil && err != context.Canceled {
		logger.Fatal().Err(err).Msg("server exited with error")
	}
	logger.Info().Msg("server stopped")
}
