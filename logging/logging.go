package logging

import (
	"io"
	"os"
	"strings"
	"time"

	"github.com/rs/zerolog"

	"telemetry/config"
)

func New(cfg config.LogConfig, component string) zerolog.Logger {
	level := zerolog.InfoLevel
	if cfg.Level != "" {
		if parsed, err := zerolog.ParseLevel(strings.ToLower(strings.TrimSpace(cfg.Level))); err == nil {
			level = parsed
		}
	}

	zerolog.TimeFieldFormat = time.RFC3339Nano

	var writer io.Writer = os.Stdout
	if strings.EqualFold(strings.TrimSpace(cfg.Format), "console") {
		writer = zerolog.ConsoleWriter{
			Out:        os.Stdout,
			TimeFormat: time.RFC3339Nano,
		}
	}

	logger := zerolog.New(writer).Level(level).With().Timestamp().Logger()
	if component != "" {
		logger = logger.With().Str("component", component).Logger()
	}
	return logger
}
