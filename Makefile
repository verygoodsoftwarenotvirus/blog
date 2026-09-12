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
# prerender time and each bucket needs its own absolute feed URLs. Both paths
# share scripts/deploy.sh so the cache headers cannot drift between them.
.PHONY: publish-ru
publish-ru:
	rm -rf $(OUTPUT_DIR)
	PUBLIC_SITE_URL=$(RU_URL) npm run build
	./scripts/deploy.sh $(RU_BUCKET) $(OUTPUT_DIR)

.PHONY: publish-dev
publish-dev:
	rm -rf $(OUTPUT_DIR)
	PUBLIC_SITE_URL=$(DEV_URL) npm run build
	./scripts/deploy.sh $(DEV_BUCKET) $(OUTPUT_DIR)

# One-time backfill. rsync only sets headers on objects it actually uploads,
# so files that predate scripts/deploy.sh and have not changed since still
# carry the old `max-age=3600`. Every .html is rebuilt each deploy and fixes
# itself; long-lived images and fonts do not. Safe to re-run.
.PHONY: retag-cache
retag-cache:
	for b in $(RU_BUCKET) $(DEV_BUCKET); do \
		gsutil -m setmeta -h "Cache-Control:public, no-cache" \
			"gs://$$b/**.html" "gs://$$b/**.xml" "gs://$$b/**.json"; \
		gsutil -m setmeta -h "Cache-Control:public, max-age=31536000, immutable" \
			"gs://$$b/_app/immutable/**"; \
	done

.PHONY: publish
publish: publish-dev publish-ru

# Kept as an alias so muscle memory and any old notes still work.
.PHONY: publish-gcloud
publish-gcloud: publish
