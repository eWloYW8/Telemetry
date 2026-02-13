package main

import (
	"context"
	"flag"
	"os"
	"os/signal"
	"syscall"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"telemetry/config"
	"telemetry/server"
)

func main() {
	cfgPath := flag.String("config", "configs/server.yaml", "path to server config")
	flag.Parse()

	zerolog.TimeFieldFormat = zerolog.TimeFormatUnixMs
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stdout})

	cfg, err := config.LoadServerConfig(*cfgPath)
	if err != nil {
		log.Fatal().Err(err).Msg("load server config")
	}

	srv := server.New(cfg, log.Logger)
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	if err := srv.Run(ctx); err != nil && err != context.Canceled {
		log.Fatal().Err(err).Msg("server exited with error")
	}
}
