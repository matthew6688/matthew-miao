# Goal completion audit — 2026-08-09

This audit evaluates the repository against `docs/implementation-plan.md`. A
green public site is necessary evidence, but it is not treated as proof of the
provider-backed or personal-content requirements.

## Requirement status

| Phase | Status | Authoritative evidence | Remaining proof or input |
| --- | --- | --- | --- |
| 0 — baseline and governance | Partial | `upstream` tracks `CaliCastle/cali.so`; baseline `9d9b492` is an ancestor; `main` requires PR, Quality and CodeQL and disallows force-push/deletion; Dependabot, secret scanning and push protection are enabled | No additional code work required for public launch |
| 1 — 1:1 baseline | Partial | Upstream component implementation and the 19-case Playwright interaction suite are retained | The specified three-viewport × two-theme × two-locale × reduced-motion golden screenshot matrix has not been recorded against the locked upstream baseline |
| 1.5 — Cloudflare spike | Pass for public runtime; partial for providers | Workers/OpenNext build and real Production, Staging and Preview deployments; Worker-safe MDX/media/OG bundles; R2 cache and Images bindings | Hyperdrive transaction, Clerk refresh, Stripe raw-body, Cron and HEIC load tests require real provider environments |
| 2 — de-identification | Pass | `lib/site-profile.ts`; identity scans; Cali articles, portraits, personal shelves and product assets removed; unconfirmed material renders as an explicit empty state | Internal legacy adapter names are non-public and retained only where they describe the upstream service contract |
| 3 — Matthew content | Partial | Confirmed name, email, location, UChat role, FengTalk project and bilingual biography are published | Matthew portrait/photos, confirmed social links, additional projects and optional books/music lists have not been supplied; neutral unpublished states remain |
| 4 — service environments | Blocked on operator accounts | Provider boundaries fail closed; Cloudflare Production/Staging/Preview and R2 exist | Neon/Hyperdrive, Clerk owner, Stripe, Google Calendar, Resend, Bunny, Upstash and optional AI/provider credentials are absent |
| 5 — CI/CD | Partial | Cloudflare workflows validate Preview, Staging and Production; migration safety checks pass; `main` is protected | GitHub environments do not contain `CLOUDFLARE_API_TOKEN`, so CI validates and safely skips automatic deployment; Preview database branches and Cron are provider-blocked |
| 6 — domain launch | Pass for public site; partial for integrations | `https://matthew-miao.com`; apex and `www` custom domains; `www` 308; TLS, security headers, canonical, feeds, sitemap, robots and OG checks | Mail DNS and real Google/Stripe/Clerk callbacks cannot be accepted before those providers are configured |
| 7 — blog Agent Skill | Pass for repository workflow | `.agents/skills/publish-matthew-blog/SKILL.md`, validator, paired bilingual article, owned article artwork, Preview and browser validation | No fake test article is kept in Production; the real bilingual article exercises the same publishing contract |
| 8 — full release acceptance | Partial | 1,213 unit tests, localization and deployment suites, Cloudflare build, Chromium 19/19, WebKit smoke 6/6, hosted public suite 13/13, discovery 14/14, zero open Dependabot alerts | Golden visual matrix and signed-in Admin/booking/payment/calendar/email/upload/curation end-to-end acceptance remain incomplete |

## Current release boundary

The bilingual public portfolio and repository-owned blog are deployable and
live. Admin, AMA payment/booking automation and managed photo publication are
implemented but are not production-enabled and must not be represented as live
until their provider rows above have passed acceptance.

## Exact user inputs still required

1. An approved portrait and any photos intended for publication.
2. Confirmed social profile URLs and any additional projects or experience.
3. AMA duration, currency/price, availability, cancellation/refund policy and
   whether paid booking should launch.
4. Authorization or credentials entered directly into the relevant dashboards
   for Cloudflare API deployment, Neon, Clerk, Stripe, Google, Resend, Bunny and
   Upstash.

The active goal must remain incomplete until either these inputs are supplied
and accepted or the user explicitly removes the corresponding features and
personal-content requirements from scope.
