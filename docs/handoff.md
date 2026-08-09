# Matthew site handoff

Current as of 2026-08-09.

## Live state

- Production: `https://matthew-miao.com`
- Runtime: Cloudflare Workers through `@opennextjs/cloudflare`
- Cache: `matthew-miao-next-cache` R2 bucket
- Media: `matthew-miao-media` private R2 bucket; immutable public Renditions
  are delivered only through `/media/renditions/*`
- Production Worker: `matthew-miao`
- Staging: `https://matthew-miao-staging.matthew6688.workers.dev`
- Preview: `https://matthew-miao-preview.matthew6688.workers.dev`
- Staging cache: `matthew-miao-staging-next-cache` R2 bucket (shared by
  staging and ephemeral preview builds)
- Source: `matthew6688/matthew-miao`, branch `main`
- Upstream baseline: `CaliCastle/cali.so@9d9b492`
- Chinese is unprefixed; English uses `/en`.

Public home, blog, bilingual article, projects, photos empty state, sitemap, RSS,
dynamic OG routes, and the Cal.com booking handoff have passed live HTTP smoke checks. The site now uses Matthew's approved creek-side portrait, published
as a metadata-stripped WebP through the existing interactive halftone treatment.
Four additional approved photos are available for the future media catalog;
their originals remain outside Git until the owner upload pipeline is enabled.

## Content ownership

`lib/site-profile.ts` is the canonical public identity registry. Blog and
newsletter content live in `content/`. Unconfirmed social accounts, shelves,
photographs, and additional projects remain unpublished. Never restore upstream
personal assets while syncing code.

## Cloudflare deployment

```bash
corepack pnpm build:cloudflare
corepack pnpm deploy:cloudflare
```

`wrangler.jsonc` owns the production Worker, custom domains, R2 cache and media
bindings, and public runtime variables. Secrets are stored in Cloudflare,
never in Git.
GitHub's Production environment can deploy automatically after
`CLOUDFLARE_API_TOKEN` is configured; without it, CI validates and reports a
safe deployment skip.

`dev` deploys to the persistent Staging Worker. Feature branches deploy to the
Preview Worker. These workflows use the same validation gates as Production;
they also skip deployment safely until the repository secret is configured.

## Provider boundary

The public AMA page keeps the pinned visual contract. Its Chinese and English
booking routes redirect to `https://cal.com/matthew-miao/ama`; Cal.com owns the
60-minute US$99 booking, Google Meet, email, rescheduling, and cancellation
workflow. The Cal.com dashboard was configured with Stripe payment and a
one-calendar-day refund policy on 2026-08-09, but a real paid booking, refund,
and notification round trip remains a manual Production acceptance item.
`CALCOM_API_KEY` is a GitHub Production environment secret used by
`pnpm verify:calcom`; it is never sent to the Worker or browser. The automated
gate verifies only fields exposed by Cal.com's Event Type API and cannot prove
the payment-app connection or refund execution.
The inherited self-hosted AMA provider routes remain fail-closed and are not the
public booking system.

The public site and repository-owned blog are live. These inherited provider
features remain deliberately fail-closed until Matthew authorizes real accounts
and credentials:

- PostgreSQL/Neon and Cloudflare Hyperdrive
- Clerk owner authentication
- Stripe Checkout/refunds/webhook
- Google Calendar/Meet and Resend mail
- PostgreSQL-backed media catalog and published photo selection
- Upstash production rate limiting
- optional Tencent Meeting and AI providers

Until Clerk is configured, Admin routes return a non-public 404 instead of a
server error. The R2 media provider is configured; until PostgreSQL and Clerk
are configured, the owner upload UI remains fail-closed and Photos uses the
designed empty state.

## Publishing with an agent

Read `.agents/skills/publish-matthew-blog/SKILL.md`. The skill creates paired
Chinese/English MDX, validates frontmatter and media, runs release checks, and
shows the final diff before publication.

## Required release checks

```bash
corepack pnpm typecheck
corepack pnpm test:unit
corepack pnpm test:localization
corepack pnpm test:deployment
corepack pnpm build:cloudflare
PLAYWRIGHT_BASE_URL=https://matthew-miao.com corepack pnpm test:browser:hosted
```

Provider-backed Admin, booking, email, calendar, payment, and media acceptance
must also pass before the full 1:1 functional goal can be marked complete.
