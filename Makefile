OUTPUT_DIR    := dist
CONFIG_FILE   := config.toml
GCLOUD_BUCKET := blog.verygoodsoftwarenotvirus.ru

.PHONY: clean
clean:
	rm -rf $(OUTPUT_DIR)

$(OUTPUT_DIR):
	hugo --destination $(OUTPUT_DIR) --minify --config=config.toml

.PHONY: preview
preview:
	hugo server --buildDrafts --port=8080 --noHTTPCache --cleanDestinationDir --disableFastRender

.PHONY: publish-gcloud
publish-gcloud: clean $(OUTPUT_DIR)
	gsutil -m cp -r $(OUTPUT_DIR)/* gs://$(GCLOUD_BUCKET)/
