package main

import (
	"context"
	"flag"
	"os"
	"os/signal"
	"syscall"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"telemetry/agent"
	"telemetry/config"
)

func main() {
	cfgPath := flag.String("config", "configs/agent.yaml", "path to agent config")
	flag.Parse()

	zerolog.TimeFieldFormat = zerolog.TimeFormatUnixMs
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stdout})

	cfg, err := config.LoadAgentConfig(*cfgPath)
	if err != nil {
		log.Fatal().Err(err).Msg("load agent config")
	}

	ag, err := agent.New(cfg, log.Logger)
	if err != nil {
		log.Fatal().Err(err).Msg("init agent")
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	if err := ag.Run(ctx); err != nil && err != context.Canceled {
		log.Fatal().Err(err).Msg("agent exited with error")
	}
}
