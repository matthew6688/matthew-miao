# Store Media Library objects in Cloudflare R2

## Status

Accepted; supersedes ADR-0007 and ADR-0013's Bunny provider decision while
preserving their catalog, publication, namespace, privacy, and operation-order
contracts.

## Context

The production site already runs on Cloudflare Workers and uses R2 for the
Next.js incremental cache. Keeping Media Library binaries in Bunny would add a
second storage provider, credentials, CDN purge API, and release gate without
adding a user-visible capability. Cloudflare's Worker R2 binding provides
strongly consistent writes and deletes plus `put`, `get`, `head`, and `delete`
operations with HTTP metadata and SHA-256 integrity checks.

## Decision

Production uses the private `matthew-miao-media` R2 bucket. Staging and Preview
share the private `matthew-miao-staging-media` bucket. Existing object keys are
unchanged: `originals/*`, `renditions/*`, and `transfer-chunks/*`.

Only immutable JPEG keys under `/media/renditions/*` are delivered by a
read-only Worker route. Originals and transfer chunks have no public route.
Public URLs remain derived rather than persisted. The route does not write to
the Cache API, so R2's strongly consistent deletion completes a Rendition purge
without a separate CDN purge call.

Cloudflare Images remains bound for a later, separately verified processing
change. This decision does not claim that the current Sharp/HEIC processing
pipeline is safe inside the 128 MB request Worker; that runtime acceptance gate
remains open.

## Consequences

- Bunny credentials and its account-contract workflow are retired.
- Existing Neon catalog and operation ordering remain unchanged.
- Uploads still use bounded, same-origin 4 MiB chunks and owner authorization.
- A real upload, processing run, publication, and purge require Clerk and
  PostgreSQL/Hyperdrive before Production acceptance can pass.
