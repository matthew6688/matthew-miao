# matthew-miao.com

Matthew Miao's bilingual personal site, derived from the pinned MIT upstream
commit documented in `docs/research/upstream-source-audit.md`.

**Picking up work?** Read `docs/implementation-plan.md`,
`docs/content/site-profile-draft.md`, and `docs/handoff.md` first.

## Identity and content

- `lib/site-profile.ts` is the canonical registry for Matthew's public identity,
  domain, location, and confirmed links.
- Never restore Cali's personal identity, writing, photos, product brands, social
  accounts, or contact details while syncing upstream.
- Unconfirmed social links and personal claims stay unpublished rather than using
  placeholders that point to another person.
- Blog content is bilingual MDX under `content/blog/<slug>/`. Preserve the existing
  schema, accessibility contract, SEO routes, and colocated media behavior.
- The visual and interaction contract is 1:1 with the pinned upstream site. Content
  work must not redesign components, spacing, motion, color, typography, or routes.

## Agent skills

### Photos

Use `.agents/skills/manage-matthew-photos/SKILL.md` for any photo import,
publication, withdrawal, alt-text, or deletion task. Originals stay outside
Git; permanent derivative deletion requires the Skill's exact confirmation
gate.

### Issue tracker

Project issues belong to `matthew6688/matthew-miao`. Upstream issues remain useful
evidence but are not Matthew's project tracker.

### Triage labels

The five canonical triage labels are used as-is (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Design

All UI work follows the spec in `docs/design-language.md` (motion tokens, typography, hover-card contract, cover treatment). Apply the `emil-design-engineering` skill when building or reviewing UI.

### Domain docs

Multi-context: `CONTEXT-MAP.md` at the root points to per-context `CONTEXT.md` files, added as the v3 architecture takes shape. See `docs/agents/domain.md`.

### Production cache safety

- Shared public chrome must use committed/build-time data, not a finite runtime
  Cache Component refresh.
- Production source may use `use cache` only with the repository's long-lived
  `cacheLife('max')` policy. Any time-based runtime policy requires an explicit
  architecture decision, an isolated blast radius, and hosted expiry-cycle
  evidence before the cache-safety gate may change.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
