package server

import (
	"bytes"
	"embed"
	"io"
	"io/fs"
	"net/http"
	"path"
	"strings"
	"time"
)

//go:embed all:ui_dist
var uiDistFS embed.FS

func (s *Server) newUIStaticHandler() http.Handler {
	sub, err := fs.Sub(uiDistFS, "ui_dist")
	if err != nil {
		s.log.Warn().Err(err).Msg("ui static assets unavailable")
		return http.NotFoundHandler()
	}

	fileServer := http.FileServer(http.FS(sub))

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api") {
			http.NotFound(w, r)
			return
		}

		req := r.Clone(r.Context())
		target := req.URL.Path
		if target == "" || target == "/" {
			serveEmbeddedFile(w, r, sub, "index.html")
			return
		}

		base := path.Base(target)
		if strings.Contains(base, ".") {
			fileServer.ServeHTTP(w, req)
			return
		}

		trimmed := strings.Trim(target, "/")
		if trimmed != "" {
			if f, err := sub.Open(trimmed + "/index.html"); err == nil {
				_ = f.Close()
				serveEmbeddedFile(w, r, sub, trimmed+"/index.html")
				return
			}
		}

		serveEmbeddedFile(w, r, sub, "index.html")
	})
}

func serveEmbeddedFile(w http.ResponseWriter, r *http.Request, fsys fs.FS, name string) {
	file, err := fsys.Open(name)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	defer file.Close()

	info, err := file.Stat()
	if err != nil || info.IsDir() {
		http.NotFound(w, r)
		return
	}

	if seeker, ok := file.(io.ReadSeeker); ok {
		http.ServeContent(w, r, info.Name(), info.ModTime(), seeker)
		return
	}
	data, err := io.ReadAll(file)
	if err != nil {
		http.Error(w, "read static file", http.StatusInternalServerError)
		return
	}
	http.ServeContent(w, r, info.Name(), time.Time{}, bytes.NewReader(data))
}
