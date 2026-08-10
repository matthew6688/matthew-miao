# Goal completion audit — 2026-08-09

This audit evaluates the repository against `docs/implementation-plan.md`. A
green public site is necessary evidence, but it is not treated as proof of the
provider-backed or personal-content requirements.

## Requirement status

| Phase | Status | Authoritative evidence | Remaining proof or input |
| --- | --- | --- | --- |
| 0 — baseline and governance | Partial | `upstream` tracks `CaliCastle/cali.so`; baseline `9d9b492` is an ancestor; `main` requires PR, Quality and CodeQL and disallows force-push/deletion; Dependabot, secret scanning and push protection are enabled | No additional code work required for public launch |
| 1 — 1:1 baseline | Partial | Upstream component implementation and the 19-case Playwright interaction suite are retained; the Matthew home page now has a 24-case macOS Chromium golden matrix covering three viewports, two themes, two locales and both motion preferences | A separate pixel-difference record against the locked upstream baseline has not been produced; the Matthew baselines are regression evidence, not a claim that changed personal content is pixel-identical |
| 1.5 — Cloudflare spike | Pass for public runtime; partial for providers | Workers/OpenNext build and real Production, Staging and Preview deployments; Worker-safe MDX/media/OG bundles; R2 cache and Images bindings | Hyperdrive transaction, Clerk refresh, Stripe raw-body, Cron and HEIC load tests require real provider environments |
| 2 — de-identification | Pass | `lib/site-profile.ts`; identity scans; Cali articles, portraits, personal shelves and product assets removed; unconfirmed material renders as an explicit empty state | Internal legacy adapter names are non-public and retained only where they describe the upstream service contract |
| 3 — Matthew content | Partial | Confirmed name, email, location, UChat role, FengTalk project, bilingual biography, GitHub/X/WeChat accounts, portrait and five-photo publication are live | Additional projects and optional books/music lists remain unpublished |
| 4 — service environments | Blocked on remaining operator accounts | Provider boundaries fail closed; Cloudflare Production/Staging/Preview and isolated R2 media buckets exist; Repository Photo Publication passed real publish/live-read acceptance | Owner upload/process/delete through the database catalog still needs Neon/Clerk and real acceptance; remaining payment/email integrations, Upstash and optional AI/provider credentials also require acceptance |
| 5 — CI/CD | Partial | Cloudflare workflows deploy validated Preview, Staging and Production commits; Preview has a least-privilege token and explicit account ID; migration safety checks pass; `main` is protected | Preview database branches and Cron remain provider-blocked |
| 6 — domain launch | Pass for public site; partial for integrations | `https://matthew-miao.com`; apex and `www` custom domains; `www` 308; TLS, security headers, canonical, feeds, sitemap, robots and OG checks | Mail DNS and real Google/Stripe/Clerk callbacks cannot be accepted before those providers are configured |
| 7 — blog Agent Skill | Pass for repository workflow | `.agents/skills/publish-matthew-blog/SKILL.md`, validator, paired bilingual article, owned article artwork, Cloudflare Preview/direct-publish modes and browser validation | No fake test article is kept in Production; the real bilingual article exercises the same publishing contract |
| 8 — full release acceptance | Partial | 1,218 unit tests, localization and deployment suites, Cloudflare build, Chromium 19/19, WebKit smoke 6/6, hosted public suite 13/13, discovery 14/14, Matthew home visual matrix 24/24, zero open Dependabot alerts | Signed-in Admin/booking/payment/calendar/email/upload/curation end-to-end acceptance and the separate locked-upstream comparison remain incomplete |

## Current release boundary

The bilingual public portfolio and repository-owned blog are deployable and
live. Admin, AMA payment/booking automation and managed photo publication are
implemented but are not production-enabled and must not be represented as live
until their provider rows above have passed acceptance.

## Exact user inputs still required

1. Additional projects or experience, if they should be published.
2. Optional books and music lists.
3. Authorization or credentials entered directly into the relevant dashboards
   for Neon, Clerk, remaining Stripe/Google/Resend integrations and Upstash. R2
   and Cloudflare deployment are configured.
4. A real paid Cal.com booking, notification and refund round trip for final
   commercial acceptance.

The active goal must remain incomplete until either these inputs are supplied
and accepted or the user explicitly removes the corresponding features and
personal-content requirements from scope.
