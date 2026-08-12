---
name: publish-matthew-blog
description: Create, translate, illustrate, validate, deploy a Cloudflare Preview, and publish bilingual Chinese-English MDX posts for Matthew Miao's website, including SEO metadata, generated or licensed covers, inline images, diagrams, safe external links, and privacy-gated YouTube, Vimeo, or Cloudflare Stream video. Use for any new article, article revision, blog media change, request to preview an article, or request to publish directly to production in this repository.
---

# Publish Matthew Blog

Create truthful, media-rich bilingual posts without changing the inherited Cali visual system.

## Workflow

1. Read `AGENTS.md`, `lib/site-profile.ts`, the relevant post, and [references/content-contract.md](references/content-contract.md).
2. Select one delivery mode from the user's words: `preview` for draft/review/preview requests, or `publish` for explicit “publish”, “direct publish”, “上线”, or equivalent requests. Default to `preview` when intent is unclear. Work on a branch; never commit an article directly to `main`.
   Before editing, confirm `git branch --show-current` is neither `main` nor `dev`, the worktree contains no unrelated changes, and the branch includes current `origin/main`.
3. Gather the source, factual claims, desired call to action, cover direction, inline-media needs, and video URLs. Browse primary sources when a claim or link needs verification.
4. Treat Chinese as primary unless Matthew supplies English as the source. Preserve meaning and voice; mark uncertain claims instead of inventing evidence.
5. Create both MDX editions under `content/blog/<slug>/`. Make each language read natively while keeping facts and structure aligned.
6. Generate or prepare owned media. Run `node .agents/skills/publish-matthew-blog/scripts/prepare-image.mjs INPUT OUTPUT cover` for a 1600×900 cover, or use `inline` to preserve an illustration's aspect ratio. Copy the printed exact dimensions into MDX and record every file in `publication.json`.
7. Use `VideoEmbed` for supported hosted video. Never paste raw `iframe`, arbitrary embed HTML, JavaScript URLs, or tracking snippets.
8. Run the draft gate while the slug is unregistered: `node .agents/skills/publish-matthew-blog/scripts/validate-post.mjs <slug> --draft --check-links`.
9. Follow the selected delivery mode below. Never weaken or skip a gate to make a deployment pass.
10. Present both locale URLs, SEO titles/descriptions, sources, media provenance, verification results, GitHub Actions run, deployed environment, and unresolved confirmations.

## Delivery modes

### Preview

1. After the draft gate passes, temporarily add the slug to `publishedPostSlugs` and assign one stable unique view-transition ID on the draft branch. This registration is required for the real article route to render in Cloudflare Preview; do not merge it yet.
2. Run the publication validator without `--draft`, then `pnpm test:blog-skill`, typecheck, unit/localization tests, `pnpm build:cloudflare:local`, and focused article browser checks. The hosted browser suite discovers every registered slug and checks both locales, article images, canonical/hreflang, feed, and sitemap.
3. Commit and push the draft branch. A non-`main`, non-`dev` push deploys the shared Preview Worker through `.github/workflows/deploy-preview.yml`.
4. Wait for `Deploy Preview` to finish successfully. Do not claim that Preview exists when deployment or hosted checks were skipped or failed.
5. Return these review URLs:
   - Chinese: `https://matthew-miao-preview.matthew6688.workers.dev/blog/<slug>`
   - English: `https://matthew-miao-preview.matthew6688.workers.dev/en/blog/<slug>`
   Also return the exact GitHub Actions run URL and state that this shared Preview shows the most recently deployed feature branch.
6. Review both routes on desktop and mobile. Check cover crop, every image/lightbox, captions, video consent/loading, headings, code, Mermaid diagrams, and external links.
7. Stop for Matthew's decision. On approval, continue with `Publish`. On requested edits, update both locales and redeploy Preview. On cancellation, remove temporary registration and the transition ID before closing the branch; a draft must never enter `main` accidentally.

Preview is internet-accessible and intended for review, not secret material. Never include private information, credentials, unpublished third-party data, or unlicensed media in a Preview commit.

### Publish

Use this mode immediately only when Matthew explicitly asks to publish or directly publish. A direct publish skips the wait for human Preview approval, not validation, PR, protected-branch checks, or Production verification.

1. Add or retain the slug in `publishedPostSlugs` and its stable unique view-transition ID.
2. Run the validator without `--draft`, `pnpm test:blog-skill`, typecheck, unit/localization tests, `pnpm build:cloudflare:local`, and article browser checks.
3. Show the final diff, bilingual URLs, SEO summary, sources, provenance, and any remaining uncertainty. Block publication when a factual, rights, privacy, link, video, or validation requirement is unresolved.
4. Commit and push a feature branch, open a PR to `main`, and wait for all required checks. Merge only after they pass; never bypass branch protection.
5. Wait for the Production workflow for the merged SHA. Verify both production article routes, cover and inline media, canonical/hreflang metadata, and relevant feed/sitemap entries before reporting success.
6. Return the PR, Production Actions run, and final URLs:
   - Chinese: `https://matthew-miao.com/blog/<slug>`
   - English: `https://matthew-miao.com/en/blog/<slug>`

## Editorial rules

- Write as Matthew in first person only when the source supports it.
- Prefer concrete observations, decisions, failures, and evidence over generic AI claims.
- Keep AI agent, outreach, company knowledge, and Web coding natural in each language; do not force literal translation.
- Link confirmed entities through `siteProfile` when editing application code.
- Do not restore upstream Cali identity, posts, photos, products, clients, or social accounts.
- Do not publish placeholders, fabricated claims or testimonials, unlicensed media, or unverified personal preferences.
- Prefer primary sources and descriptive link text. External links must use HTTPS.
- A request to preview authorizes pushing its draft branch and deploying Cloudflare Preview. A request to publish authorizes pushing, opening/merging its PR after checks, and verifying the Production deployment. Neither request authorizes newsletters, payments, or unrelated external actions.
- Work on a draft branch by default. Even an explicit publication request goes through a protected PR; never commit a new article directly to `main`.

## Editing existing posts

Update Chinese and English together. If only one language is supplied, adapt the other and report that work. Keep the slug stable unless Matthew accepts the SEO and redirect consequences. A correction follows the same Preview or Publish mode as a new post and must update `publication.json` whenever sources or media change.

For withdrawal, remove the slug from both public registries, keep the source directory for recovery, deploy through a protected PR, and verify both old locale routes return 404 and disappear from sitemap and feeds. Treat a rename as a migration: get explicit approval, create the new slug, add a permanent legacy redirect for both locales, preserve `publishedAt` unless the article is materially republished, and verify old and new routes. Never silently rename or delete a published directory.

## Media

Use generated, Matthew-owned, public-domain, or explicitly licensed assets inside the post directory. Record provenance and rights in `publication.json` and summarize them in the handoff. Add descriptive, locale-native alt text to every post image. Chinese cover metadata is inherited by English. Prefer WebP for images and Mermaid for diagrams. Convert SVG to WebP because the public content route intentionally does not serve active SVG. Do not use upstream Cali assets as Matthew's work.

Hosted video is click-to-load: YouTube uses `youtube-nocookie.com`, Vimeo uses DNT, and Cloudflare Stream requires its customer code. Always provide a descriptive localized title and optional caption. Summarize or transcribe information that is available only in the video.

## Mechanical gates

- `pnpm test:blog-skill` tests the validator, validates registered posts in publication mode, and validates any committed unregistered directories as drafts; CI and every Cloudflare deployment run it.
- Add `--check-links` to the per-post validator before Preview or Publish. Network checks are intentionally not part of the repository-wide CI gate because third-party endpoints can be transient; manual evidence must follow the audited 90-day contract.
- The hosted Playwright suite iterates over `publishedPostSlugs`, so every newly registered article automatically receives bilingual route, image, metadata, feed, and sitemap checks without editing a fixed test fixture.
