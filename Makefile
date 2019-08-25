OUTPUT_DIR := dist
CONFIG_FILE := config.toml
GCLOUD_BUCKET := blog.verygoodsoftwarenotvirus.ru

clean:
	rm -rf $(OUTPUT_DIR)

$(OUTPUT_DIR):
	docker build --tag blogbuilder:latest --file=builder.Dockerfile .
	docker run --volume=`pwd`/$(OUTPUT_DIR):/blog blogbuilder:latest

.PHONY: publish-gcloud
publish-gcloud: clean $(OUTPUT_DIR)
	gsutil -m cp -r $(OUTPUT_DIR)/* gs://$(GCLOUD_BUCKET)/
