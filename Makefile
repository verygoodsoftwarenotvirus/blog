OUTPUT_DIR    := dist
GCLOUD_BUCKET := blog.verygoodsoftwarenotvirus.ru

.PHONY: install
install:
	npm ci

.PHONY: clean
clean:
	rm -rf $(OUTPUT_DIR) .svelte-kit

.PHONY: dev
dev:
	npm run dev

.PHONY: check
check:
	npm run check

$(OUTPUT_DIR):
	npm run build

.PHONY: build
build: $(OUTPUT_DIR)

.PHONY: preview
preview: build
	npm run preview

# Manual deploy, for when Actions is unavailable. Mirrors the CI step exactly.
.PHONY: publish-gcloud
publish-gcloud: clean build
	gsutil -m rsync -d -r $(OUTPUT_DIR)/ gs://$(GCLOUD_BUCKET)/
