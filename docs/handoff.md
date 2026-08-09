# Matthew site handoff

Current as of 2026-08-09.

## Live state

- Production: `https://matthew-miao.com`
- Runtime: Cloudflare Workers through `@opennextjs/cloudflare`
- Cache: `matthew-miao-next-cache` R2 bucket
- Production Worker: `matthew-miao`
- Source: `matthew6688/matthew-miao`, branch `main`
- Upstream baseline: `CaliCastle/cali.so@9d9b492`
- Chinese is unprefixed; English uses `/en`.

Public home, blog, bilingual article, projects, photos empty state, sitemap, RSS,
and dynamic OG routes have passed live HTTP smoke checks. The site currently
uses a neutral Matthew monogram because no approved portrait or photo library
has been supplied.

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

`wrangler.jsonc` owns the production Worker, custom domains, R2 cache binding,
and public runtime variables. Secrets are stored in Cloudflare, never in Git.
GitHub's Production environment can deploy automatically after
`CLOUDFLARE_API_TOKEN` is configured; without it, CI validates and reports a
safe deployment skip.

## Provider boundary

The public site and repository-owned blog are live. These inherited provider
features remain deliberately fail-closed until Matthew authorizes real accounts
and credentials:

- PostgreSQL/Neon and Cloudflare Hyperdrive
- Clerk owner authentication
- Stripe Checkout/refunds/webhook
- Google Calendar/Meet and Resend mail
- Bunny media storage and published photo selection
- Upstash production rate limiting
- optional Tencent Meeting and AI providers

Until Clerk is configured, Admin routes return a non-public 404 instead of a
server error. Until the database and media provider are configured, Photos uses
the designed empty state. AMA information may be viewed, but payments must not
be represented as live.

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
