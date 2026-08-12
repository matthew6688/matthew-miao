---
name: manage-matthew-photos
description: Import, sanitize, resize, validate, preview, publish, unpublish, or permanently remove Matthew-owned HEIC, HEIF, JPEG, or PNG photos on matthew-miao.com. Use for any website photo-library, homepage photo preview, photo alt-text, photo publication, withdrawal, or deletion task in this repository.
---

# Manage Matthew Photos

Publish owned photos through the existing bilingual photo wall without exposing Originals, EXIF, or GPS.

## Workflow

1. Read `AGENTS.md`, `lib/media/CONTEXT.md`, `content/photos/catalog.json`, and [references/photo-contract.md](references/photo-contract.md).
2. Work on a named branch that includes current `origin/main`; the script refuses mutations on `main` and `dev`. Confirm Matthew owns or may publish every input image. Never use upstream Cali assets or a local path as public metadata.
3. Inspect the image for people, private documents, addresses, screens, children, or other sensitive details. Ask before publishing when consent or privacy is unclear.
4. Draft specific Chinese and English alt text from visible content only. Do not infer an exact place, relationship, event, or date.
5. Import as an unpublished draft unless Matthew explicitly asks to publish:

   ```bash
   node .agents/skills/manage-matthew-photos/scripts/manage-photo.mjs import SOURCE \
     --id stable-kebab-id --alt-zh "中文替代文字" --alt-en "English alt text"
   ```

   Add `--publish` only when publication is explicitly requested.
6. Run `validate`. Choose one preview mode:
   - Local preview: run `publish PHOTO_ID`, inspect locally, then immediately `unpublish PHOTO_ID`. Do not commit or push the temporary state.
   - Cloudflare Preview: when Matthew asks for an online/shareable preview, publish only on the feature branch, commit and push it, wait for `Deploy Preview`, and return `/photos`, `/en/photos`, `/`, and `/en` Preview URLs. The branch must not merge until approved; cancellation means close/delete the branch without merging.
   In either mode check natural aspect ratios, the first-three homepage stack, lightbox focus/escape, bilingual alt text, mobile/desktop, and both themes.
7. Run `pnpm test:photo-skill`, the media selection tests, typecheck, unit tests, localization, and `pnpm build:cloudflare:local`. Show the catalog diff, derivative sizes, and public URLs before pushing.
8. Push a review branch when Matthew asks for Cloudflare Preview. Open/merge a protected PR and wait for Production only when Matthew asks to publish; direct publish skips the Preview approval wait, not tests or branch protection.

## Commands

```bash
node .agents/skills/manage-matthew-photos/scripts/manage-photo.mjs publish PHOTO_ID
node .agents/skills/manage-matthew-photos/scripts/manage-photo.mjs unpublish PHOTO_ID
node .agents/skills/manage-matthew-photos/scripts/manage-photo.mjs update-alt PHOTO_ID \
  --alt-zh "新的中文替代文字" --alt-en "New English alt text"
node .agents/skills/manage-matthew-photos/scripts/manage-photo.mjs set-focal-point PHOTO_ID \
  --x 0.5 --y 0.5
node .agents/skills/manage-matthew-photos/scripts/manage-photo.mjs list
node .agents/skills/manage-matthew-photos/scripts/manage-photo.mjs validate
```

## Deletion safety

Treat “remove from the website” as `unpublish`, not deletion. Never delete the supplied Original from Matthew's Mac, Downloads folder, photo library, or cloud storage.

Permanent deletion removes only repository-managed website derivatives and their catalog entry. Before running it, show the affected ID and files and obtain explicit confirmation containing the exact phrase below:

```bash
node .agents/skills/manage-matthew-photos/scripts/manage-photo.mjs delete PHOTO_ID \
  --confirm permanent-delete:PHOTO_ID
```

After unpublish or deletion, validate, deploy, and verify the old public URLs return 404 before reporting completion. Git history remains the recovery path for already committed derivatives.

## Media rules

- Originals remain outside Git. The script creates four no-upscale progressive sRGB JPEG profiles at quality 90 with 4:4:4 chroma and strips metadata.
- Draft derivatives live only in ignored `.photo-staging/`; published derivatives live in `public/images/photos/` and deploy through Cloudflare Static Assets.
- `content/photos/catalog.json` is the publication source of truth while `PHOTO_PUBLICATION_MODE=repository-bootstrap`. Migrating to Owner Admin/Neon is an explicit mode switch; remove that setting only after a database selection is active and verified. Database mode fails closed and never revives repository photos on a read error.
- Keep IDs stable. Changing an ID changes every public image URL.
- Use `update-alt` instead of hand-editing catalog text. Use `set-focal-point`
  with normalized `0..1` coordinates to adjust homepage preview crops without
  rewriting the Original or derivatives. Both commands update the public revision
  when the photo is already published.
- Record only `rights: owned`; do not import licensed or third-party photos without extending the evidence contract first.
