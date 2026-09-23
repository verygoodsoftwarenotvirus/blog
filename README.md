# blog.verygoodsoftwarenotvirus.dev

Source for my blog. Published to two buckets from one build pipeline:

| Host | Bucket | Status |
| --- | --- | --- |
| `blog.verygoodsoftwarenotvirus.dev` | `gs://blog.verygoodsoftwarenotvirus.dev` | primary |
| `blog.verygoodsoftwarenotvirus.ru` | `gs://blog.verygoodsoftwarenotvirus.ru` | legacy, registration paid through 2026-11-10 |

The `.ru` registration cannot be renewed without Госуслуги/ЕСИА identification
(Федеральный закон от 29.12.2025 № 569-ФЗ, domain provisions effective
2026-09-01), so treat every `.ru` deploy as best-effort. See
`content/posts/2026/09/12/the-end-of-an-era.md`.

## Local

```sh
make install
make dev       # dev server
make check     # typecheck
make publish   # build and mirror to both buckets
```

`PUBLIC_SITE_URL` selects the host absolute URLs are generated for; it is baked
in at prerender time, so each host gets its own build.

## Caching

Deploys go through `scripts/deploy.sh`, which sets cache headers per tier:
content-hashed files under `_app/immutable/` are cached for a year, everything
else is `no-cache` and revalidates.

This matters because GCS defaults to `public, max-age=3600` and Google's own
edge caches public objects in front of the bucket. That edge has no purge API
and sits *behind* Cloudflare, so purging Cloudflare does not clear it. Left at
the default, a new post is reachable at its own URL immediately -- a URL that
was never cached -- while the homepage and feed keep serving an hour-old copy
that does not list it.

## Credits

The favicon is the "technologist" emoji from [Twemoji](https://github.com/twitter/twemoji)
v14.0.2 (`1f9d1-200d-1f4bb.svg`), Copyright 2020 Twitter, Inc and other
contributors, licensed under [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/).
