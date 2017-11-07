package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi"
	"github.com/go-chi/chi/middleware"
)

// fileServer conveniently sets up a http.FileServer handler to serve static files from a http.FileSystem.
func fileServer(r chi.Router, path string, root http.FileSystem) {
	// if strings.ContainsAny(path, "{}*") {
	// 	panic("FileServer does not permit URL parameters.")
	// }

	fs := http.StripPrefix(path, http.FileServer(root))

	if path != "/" && path[len(path)-1] != '/' {
		r.Get(path, http.RedirectHandler(path+"/", 301).ServeHTTP)
		path += "/"
	}
	path += "*"

	r.Get(path, http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		res.Header().Set("Strict-Transport-Security", "max-age=31536000; preload")
		fs.ServeHTTP(res, req)
	}))
}

func informUserOfFileReadError(res http.ResponseWriter, err error) {
	res.WriteHeader(http.StatusInternalServerError)
	json.NewEncoder(res).Encode(struct {
		Response string `json:"error"`
	}{fmt.Sprintf("Error encountered reading local file: %v", err)})
}

func localFileHandler(path string, res http.ResponseWriter, req *http.Request) {
	homepage, err := ioutil.ReadFile(path)
	if err != nil {
		informUserOfFileReadError(res, err)
		return
	}
	res.Write(homepage)
}

func notFoundHandler(res http.ResponseWriter, req *http.Request) {
	localFileHandler("blog/404.html", res, req)
}

func homepageHandler(res http.ResponseWriter, req *http.Request) {
	localFileHandler("blog/index.html", res, req)
}

func hstsMiddleware(h http.Handler) http.Handler {
	fn := func(res http.ResponseWriter, req *http.Request) {
		res.Header().Set("Strict-Transport-Security", "max-age=31536000; preload")
		h.ServeHTTP(res, req)
	}

	return http.HandlerFunc(fn)
}

func main() {
	r := chi.NewRouter()
	r.Use(middleware.RequestLogger(&middleware.DefaultLogFormatter{Logger: log.New(os.Stdout, "", log.LstdFlags)}))
	r.Use(hstsMiddleware)
	r.NotFound(notFoundHandler)

	fileServer(r, "/js/", http.Dir("blog/js"))
	fileServer(r, "/posts/", http.Dir("blog/posts"))
	fileServer(r, "/page/", http.Dir("blog/page"))
	fileServer(r, "/categories/", http.Dir("blog/categories"))
	fileServer(r, "/tags/", http.Dir("blog/tags"))

	r.Route("/", func(r chi.Router) {
		r.Get("/", homepageHandler)
		r.Get("/resume", resumeHandler)
	})

	log.Println("serving!")
	http.ListenAndServe(":80", r)
}
