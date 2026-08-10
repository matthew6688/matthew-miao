# Goal completion audit — 2026-08-09

This audit evaluates the repository against `docs/implementation-plan.md`, as
closed by the owner scope decision in ADR-0016 on 2026-08-10.

## Requirement status

| Phase | Status | Authoritative evidence | Remaining proof or input |
| --- | --- | --- | --- |
| 0 — baseline and governance | Partial | The audited upstream baseline is an ancestor; `main` requires PR, Quality and CodeQL and disallows force-push/deletion; Dependabot, secret scanning and push protection are enabled | No additional code work required for public launch |
| 1 — 1:1 baseline | Pass under ADR-0016 evidence contract | Upstream component implementation and the 19-case Playwright interaction suite are retained; the Matthew home page has a 24-case macOS Chromium golden matrix covering three viewports, two themes, two locales and both motion preferences | Cross-content pixel subtraction against another person's text and assets is explicitly not required; future changes must preserve the current golden matrix |
| 1.5 — Cloudflare spike | Pass | Workers/OpenNext build and real Production, Staging and Preview deployments; Worker-safe MDX/media/OG bundles; R2 cache and Images bindings | Inherited provider spikes are outside the ADR-0016 production scope |
| 2 — de-identification | Pass | `lib/site-profile.ts`; identity scans; Cali articles, portraits, personal shelves and product assets removed; unconfirmed material renders as an explicit empty state | Internal legacy adapter names are non-public and retained only where they describe the upstream service contract |
| 3 — Matthew content | Pass | Confirmed name, email, location, UChat role, FengTalk project, bilingual biography, GitHub/X/WeChat accounts, portrait and five-photo publication are live | Additional projects and optional books/music lists are optional future content, not placeholders |
| 4 — service environments | Pass for current product | Cloudflare Production/Staging/Preview and isolated R2 buckets exist; repository photo publication passed real publish/live-read acceptance; Cal.com owns the commercial workflow | Inherited Admin/provider environments are outside ADR-0016 scope and remain fail-closed |
| 5 — CI/CD | Pass | Cloudflare workflows deploy validated Preview, Staging and Production commits; Preview has a least-privilege token and explicit account ID; `main` is protected | Database branches and Cron are not used by the current product |
| 6 — domain launch | Pass | `https://matthew-miao.com`; apex and `www` custom domains; `www` 308; TLS, security headers, canonical, feeds, sitemap, robots, OG, and Cal.com handoff checks | Provider-owned payment/refund round trips are not asserted by repository automation |
| 7 — blog Agent Skill | Pass for repository workflow | `.agents/skills/publish-matthew-blog/SKILL.md`, validator, paired bilingual article, owned article artwork, Cloudflare Preview/direct-publish modes and browser validation | No fake test article is kept in Production; the real bilingual article exercises the same publishing contract |
| 8 — public release acceptance | Pass | Unit, localization and deployment suites, Cloudflare build, Chromium, WebKit smoke, hosted public suite, discovery, and Matthew home visual matrix passed at cutover | Ongoing dependency maintenance is handled independently of launch completion |

## Current release boundary

The bilingual public portfolio, repository-owned blog and photos, and Cal.com
booking handoff are live. The inherited Admin and provider stack must not be
represented as live; ADR-0016 keeps it outside the production product.

## Optional future inputs

1. Additional projects or experience, if they should be published.
2. Optional books and music lists.
3. A real paid Cal.com booking, notification and refund round trip may be run as
   an operational check. It is not proof that repository code can produce, and
   it does not block the ADR-0016 public-site release.
