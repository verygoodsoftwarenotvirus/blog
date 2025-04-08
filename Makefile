OUTPUT_DIR     := dist
RU_CONFIG_FILE := ru_config.toml
GCLOUD_BUCKET  := blog.verygoodsoftwarenotvirus.ru
BLOG_GENERATOR := klakegg/hugo:0.92.1
PREVIEW_PORT   := 8080
MYSELF         := $(shell id -u)
MY_GROUP       := $(shell id -g)
GENERATOR_CMD  := docker run --rm \
	--volume $(PWD):$(PWD) \
	--workdir=$(PWD) \
	--publish $(PREVIEW_PORT):$(PREVIEW_PORT) \
	--user $(MYSELF):$(MY_GROUP) \
	$(BLOG_GENERATOR)

.PHONY: clean
clean:
	rm -rf $(OUTPUT_DIR)

.PHONY: pull_image
pull_image:
	@docker pull --quiet $(BLOG_GENERATOR)

$(OUTPUT_DIR): pull_image
	$(GENERATOR_CMD) --destination $(OUTPUT_DIR) --minify --config=$(RU_CONFIG_FILE)

.PHONY: preview
preview: pull_image
	$(GENERATOR_CMD) server --buildDrafts --port=8080 --noHTTPCache --cleanDestinationDir --disableFastRender

.PHONY: publish-gcloud
publish-gcloud: clean $(OUTPUT_DIR)
	gsutil -m cp -r $(OUTPUT_DIR)/* gs://$(GCLOUD_BUCKET)/
