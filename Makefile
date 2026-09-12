OUTPUT_DIR := dist

RU_BUCKET  := blog.verygoodsoftwarenotvirus.ru
RU_URL     := https://blog.verygoodsoftwarenotvirus.ru
DEV_BUCKET := blog.verygoodsoftwarenotvirus.dev
DEV_URL    := https://blog.verygoodsoftwarenotvirus.dev

.PHONY: install
install:
	npm ci

.PHONY: clean
clean:
	rm -rf $(OUTPUT_DIR) $(OUTPUT_DIR)-ru $(OUTPUT_DIR)-dev .svelte-kit

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

# Manual deploy, for when Actions is unavailable. Mirrors the CI steps exactly:
# one build per host, because PUBLIC_SITE_URL is baked into index.xml at
# prerender time and each bucket needs its own absolute feed URLs.
.PHONY: publish-ru
publish-ru:
	rm -rf $(OUTPUT_DIR)
	PUBLIC_SITE_URL=$(RU_URL) npm run build
	gsutil -m rsync -d -r $(OUTPUT_DIR)/ gs://$(RU_BUCKET)/

.PHONY: publish-dev
publish-dev:
	rm -rf $(OUTPUT_DIR)
	PUBLIC_SITE_URL=$(DEV_URL) npm run build
	gsutil -m rsync -d -r $(OUTPUT_DIR)/ gs://$(DEV_BUCKET)/

.PHONY: publish
publish: publish-dev publish-ru

# Kept as an alias so muscle memory and any old notes still work.
.PHONY: publish-gcloud
publish-gcloud: publish
