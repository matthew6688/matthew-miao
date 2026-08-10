# Matthew site handoff

Current as of 2026-08-10.

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
- Upstream baseline: the pinned source recorded in `docs/research/upstream-source-audit.md`
- Chinese is unprefixed; English uses `/en`.

Public home, blog, bilingual article, projects, five-photo publication, sitemap, RSS,
dynamic OG routes, and the Cal.com booking handoff have passed live HTTP smoke checks. The site now uses Matthew's approved creek-side portrait, published
as a metadata-stripped WebP through the existing interactive halftone treatment.
Five approved photos now publish through ADR-0015's Repository Photo
Publication; all Originals remain outside Git. Use
`.agents/skills/manage-matthew-photos/SKILL.md` for future import, withdrawal,
or confirmed derivative deletion. A future database publication requires an explicit
mode switch after its active selection is verified; database mode fails closed.

## Content ownership

`lib/site-profile.ts` is the canonical public identity registry. Blog and
newsletter content live in `content/`. Confirmed GitHub, X and WeChat accounts,
Matthew's portrait and five approved photographs are published. Unconfirmed
social accounts, shelves and additional projects remain unpublished. Never
restore upstream personal assets while syncing code.

## Cloudflare deployment

```bash
corepack pnpm build:cloudflare
corepack pnpm deploy:cloudflare
```

`wrangler.jsonc` owns the production Worker, custom domains, R2 cache and media
bindings, and public runtime variables. Secrets are stored in Cloudflare,
never in Git.
GitHub's Production environment deploys automatically with its encrypted
`CLOUDFLARE_API_TOKEN`.

`dev` deploys to the persistent Staging Worker. Feature branches deploy to the
Preview Worker. These workflows use the same validation gates as Production;
Preview uses an encrypted, least-privilege `CLOUDFLARE_API_TOKEN` plus the
non-secret `CLOUDFLARE_ACCOUNT_ID` environment variable. The exact Preview
deployment and hosted browser gate passed on 2026-08-10. The Preview Worker is
shared: the latest successful feature deployment replaces its prior contents.

## Provider boundary

The public AMA page keeps the pinned visual contract. Its Chinese and English
booking routes redirect to `https://cal.com/matthew-miao/ama`; Cal.com owns the
30-minute US$299 booking, Google Meet, email, rescheduling, and cancellation
workflow. The Cal.com dashboard was configured with Stripe payment and a
one-calendar-day refund policy on 2026-08-09, but a real paid booking, refund,
and notification round trip remains a manual Production acceptance item.
`CALCOM_API_KEY` is a GitHub Production environment secret used by
`pnpm verify:calcom`; it is never sent to the Worker or browser. The automated
gate verifies only fields exposed by Cal.com's Event Type API and cannot prove
the payment-app connection or refund execution.
The inherited self-hosted AMA provider routes remain fail-closed and are not the
public booking system. ADR-0016 formally excludes the following inherited
provider features from the current production product:

- PostgreSQL/Neon and Cloudflare Hyperdrive
- Clerk owner authentication
- Stripe Checkout/refunds/webhook
- Google Calendar/Meet and Resend mail
- PostgreSQL-backed owner upload/catalog UI and database photo selection
- Upstash production rate limiting
- optional Tencent Meeting and AI providers

They are reference code, not pending launch work. Admin routes return a
non-public 404 instead of a server error, and the owner upload UI remains
fail-closed. Public Photos uses the verified Repository Photo Publication and
currently displays five approved, metadata-stripped derivatives. Future
activation of inherited Admin or provider APIs requires a separate product and
security decision rather than adding credentials to the current deployment.

## Publishing with an agent

Read `.agents/skills/publish-matthew-blog/SKILL.md`. The skill creates paired
Chinese/English MDX, validates frontmatter and media, and supports two explicit
delivery modes. Preview temporarily registers the draft on a feature branch,
deploys the shared Cloudflare Preview, and returns both locale URLs for review.
Publish uses a protected PR and waits for Production verification. “Direct
publish” skips only the human Preview wait, never validation or branch
protection.

## Required release checks

```bash
corepack pnpm typecheck
corepack pnpm test:unit
corepack pnpm test:localization
corepack pnpm test:deployment
corepack pnpm build:cloudflare
PLAYWRIGHT_BASE_URL=https://matthew-miao.com corepack pnpm test:browser:hosted
```

The repository does not claim that its automated Cal.com verifier proves a real
charge, notification, cancellation, or refund. Those are provider-owned
operational checks and do not block the public-site release defined by ADR-0016.
