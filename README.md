# blog.verygoodsoftwarenotvirus.dev

Source for my blog. Published to two buckets from one build pipeline:

| Host | Bucket | Status |
| --- | --- | --- |
| `blog.verygoodsoftwarenotvirus.dev` | `gs://blog.verygoodsoftwarenotvirus.dev` | primary |
| `blog.verygoodsoftwarenotvirus.ru` | `gs://blog.verygoodsoftwarenotvirus.ru` | legacy, registration paid through 2026-11-10 |

The `.ru` registration cannot be renewed without Госуслуги/ЕСИА identification
(Федеральный закон от 29.12.2025 № 569-ФЗ, domain provisions effective
2026-09-01), so treat every `.ru` deploy as best-effort. See
`content/drafts/2026/09/12/the-end-of-an-era.md`.

## Local

```sh
make install
make dev       # dev server
make check     # typecheck
make publish   # build and mirror to both buckets
```

`PUBLIC_SITE_URL` selects the host absolute URLs are generated for; it is baked
in at prerender time, so each host gets its own build.
