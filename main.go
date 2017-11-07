package main

import (
	"net/http"
)

// https://github.com/golang/playground/blob/f2ba81bcd564d587e191d53a2b6029b8f5dd1e61/app/goplay/hsts.go
func hstsHandler(fn http.HandlerFunc) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Strict-Transport-Security", "max-age=31536000; preload")
		fn(w, r)
	})
}

func main() {
	http.Handle("/resume", hstsHandler(resumeHandler))
	http.ListenAndServe(":80", nil)
}
