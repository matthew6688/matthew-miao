# Repository photo contract

`content/photos/catalog.json` is a versioned owner publication manifest.

Each item requires a stable kebab-case `id`, publication state, intrinsic oriented dimensions, truthful Chinese and English alt text, `rights: "owned"`, an ISO import timestamp, a normalized focal point, and four deterministic Renditions named `<id>-<profileWidth>.jpg`.

Published files live at `/images/photos/<id>/<fileName>`. Each photo directory moves atomically between staging and public delivery. Unpublished files must not remain under `public/`. The runtime validates the manifest, filters unpublished entries, and converts it to the existing `PublicPhotoSelection`; no UI component receives a second photo model.

`PHOTO_PUBLICATION_MODE=repository-bootstrap` selects repository publication explicitly. Migrating to database publication requires an intentional mode switch after an active database selection is verified; database errors fail closed and never revive repository photos. Public routes and components remain unchanged.

The script manages website derivatives only. It never stores, moves, overwrites, or deletes the supplied Original.

Mutating commands run only on a named, non-protected Git branch. `update-alt`
changes both locale descriptions atomically; `set-focal-point` accepts normalized
`0..1` coordinates. A Cloudflare Preview may temporarily contain a branch-published
photo, but only a protected PR merge makes it part of Production.
