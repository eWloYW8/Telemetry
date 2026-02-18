package security

import (
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"os"

	"github.com/eWloYW8/Telemetry/config"
)

func LoadServerTLSConfig(cfg config.TLSConfig) (*tls.Config, error) {
	if cfg.CAFile == "" || cfg.CertFile == "" || cfg.KeyFile == "" {
		return nil, fmt.Errorf("server tls requires ca_file/cert_file/key_file")
	}

	cert, err := tls.LoadX509KeyPair(cfg.CertFile, cfg.KeyFile)
	if err != nil {
		return nil, fmt.Errorf("load server cert/key: %w", err)
	}

	caPEM, err := os.ReadFile(cfg.CAFile)
	if err != nil {
		return nil, fmt.Errorf("read server ca file: %w", err)
	}

	pool := x509.NewCertPool()
	if !pool.AppendCertsFromPEM(caPEM) {
		return nil, fmt.Errorf("parse server ca pem")
	}

	return &tls.Config{
		MinVersion:   tls.VersionTLS13,
		Certificates: []tls.Certificate{cert},
		ClientAuth:   tls.RequireAndVerifyClientCert,
		ClientCAs:    pool,
	}, nil
}

func LoadClientTLSConfig(cfg config.TLSConfig) (*tls.Config, error) {
	if cfg.CAFile == "" || cfg.CertFile == "" || cfg.KeyFile == "" {
		return nil, fmt.Errorf("client tls requires ca_file/cert_file/key_file")
	}

	cert, err := tls.LoadX509KeyPair(cfg.CertFile, cfg.KeyFile)
	if err != nil {
		return nil, fmt.Errorf("load client cert/key: %w", err)
	}

	caPEM, err := os.ReadFile(cfg.CAFile)
	if err != nil {
		return nil, fmt.Errorf("read client ca file: %w", err)
	}

	pool := x509.NewCertPool()
	if !pool.AppendCertsFromPEM(caPEM) {
		return nil, fmt.Errorf("parse client ca pem")
	}

	tlsCfg := &tls.Config{
		MinVersion:   tls.VersionTLS13,
		Certificates: []tls.Certificate{cert},
		RootCAs:      pool,
	}

	if cfg.ServerNameOverride != "" {
		tlsCfg.ServerName = cfg.ServerNameOverride
	}

	return tlsCfg, nil
}
