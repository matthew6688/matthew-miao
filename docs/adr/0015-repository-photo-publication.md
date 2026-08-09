# Bootstrap photo publication from the repository

## Status

Accepted by Matthew on 2026-08-10.

## Context

The visual Photo Selection experience is complete, but Owner Admin requires
Clerk and PostgreSQL/Hyperdrive accounts that are not yet configured. Matthew
supplied owned photos and requested immediate publication plus an Agent Skill
for future upload and deletion.

## Decision

`content/photos/catalog.json` provides a versioned Repository Photo Publication
only while `PHOTO_PUBLICATION_MODE=repository-bootstrap`. It maps into the
existing `PublicPhotoSelection`, preserving the pinned public UI. Migrating to
Owner Admin is an explicit mode switch after an active database selection has
been verified. In database mode, an empty selection or read failure fails closed
and never revives repository photos.

Originals remain outside Git. The repository stores only metadata-stripped,
no-upscale progressive JPEG Renditions under `public/images/photos/`, delivered
by Cloudflare Static Assets. Draft Renditions stay in ignored
`.photo-staging/`. The `manage-matthew-photos` Skill owns deterministic import,
validation, publish, unpublish, and confirmed derivative deletion.

## Consequences

- Photos can publish before Clerk/Neon Owner Admin is enabled.
- This is an owner-approved publication mode, not restoration of Cali's removed static list.
- Repository history is the audit and recovery path for committed derivatives.
- Public deletion completes only after deployment and old-URL verification; Originals are outside the operation.
- Activating database publication later requires removing the bootstrap mode from every environment after verifying the active selection; no public component or route changes are required.
