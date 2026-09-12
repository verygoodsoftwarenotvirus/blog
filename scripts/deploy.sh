#!/usr/bin/env bash
# Mirror a built site to a GCS bucket, with cache headers set per tier.
#
# Usage: scripts/deploy.sh <bucket> [dist-dir]
#
# The tiering is not a micro-optimization. GCS stamps `public, max-age=3600`
# on objects by default, and Google's own edge caches public objects in front
# of the bucket. That edge has no purge API and sits behind whatever CDN you
# put in front of it, so a stale index.html stays stale for up to an hour no
# matter what you purge at the CDN layer -- which is how a published post ends
# up live at its own URL while the homepage and feed still don't list it.
#
# So: content-hashed assets are immutable and cached forever, and everything
# else revalidates on every request.

set -euo pipefail

bucket="${1:?usage: deploy.sh <bucket> [dist-dir]}"
dist="${2:-dist}"

IMMUTABLE="Cache-Control:public, max-age=31536000, immutable"
REVALIDATE="Cache-Control:public, no-cache"

# 1. Hashed assets first, deliberately without -d. The currently-live HTML
#    still points at the previous build's chunks, so nothing may be removed
#    yet -- this pass only adds.
gsutil -h "$IMMUTABLE" -m rsync -r \
	"$dist/_app/immutable/" "gs://$bucket/_app/immutable/"

# 2. Then everything else. This is the pass that actually flips the site to
#    the new build. -d prunes pages that are gone; -x keeps it off the hashed
#    assets, and an excluded path is skipped for deletion too, not just for
#    upload.
gsutil -h "$REVALIDATE" -m rsync -d -r -x '^_app/immutable/.*$' \
	"$dist/" "gs://$bucket/"

# 3. Only now that no live page references them, prune superseded chunks.
gsutil -h "$IMMUTABLE" -m rsync -d -r \
	"$dist/_app/immutable/" "gs://$bucket/_app/immutable/"
