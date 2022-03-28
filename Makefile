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
	hugo server -D --port=8080

.PHONY: publish-gcloud
publish-gcloud: clean $(OUTPUT_DIR)
	gsutil -m cp -r $(OUTPUT_DIR)/* gs://$(GCLOUD_BUCKET)/
