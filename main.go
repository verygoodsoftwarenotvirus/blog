package main

import (
	"log"
	"net/http"

	"golang.org/x/crypto/acme/autocert"
)

func main() {
	http.HandleFunc("/resume", resumeHandler)
	log.Fatal(http.Serve(autocert.NewListener("verygoodsoftwarenotvirus.ru"), nil))
}
