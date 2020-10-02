OUTPUT_DIR    := dist
CONFIG_FILE   := config.toml
GCLOUD_BUCKET := blog.verygoodsoftwarenotvirus.ru

.PHONY: clean
clean:
	rm -rf $(OUTPUT_DIR)

$(OUTPUT_DIR):
	docker build --tag blogbuilder:latest --file=builder.Dockerfile .
	docker run --volume=`pwd`/$(OUTPUT_DIR):/blog blogbuilder:latest

.PHONY: preview
preview:
	docker build --tag blogpreviewer:latest --file=previewer.Dockerfile .
	docker run --publish=80:80 blogpreviewer:latest

.PHONY: publish-gcloud
publish-gcloud: clean $(OUTPUT_DIR)
	gsutil -m cp -r $(OUTPUT_DIR)/* gs://$(GCLOUD_BUCKET)/
