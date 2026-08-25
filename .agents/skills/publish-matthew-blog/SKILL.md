---
name: publish-matthew-blog
description: Create, translate, illustrate, validate, deploy a Cloudflare Preview, and publish bilingual Chinese-English MDX posts for Matthew Miao's website, including SEO metadata, generated or licensed covers, inline images, diagrams, safe external links, and privacy-gated YouTube, Vimeo, or Cloudflare Stream video. Use for any new article, article revision, blog media change, request to preview an article, or request to publish directly to production in this repository.
---

# Publish Matthew Blog

Create truthful, media-rich bilingual posts without changing the inherited Cali visual system.

## Workflow

1. Read `AGENTS.md`, `lib/site-profile.ts`, the relevant post, and [references/content-contract.md](references/content-contract.md).
2. Select one delivery mode from the user's words: `preview` for draft/review/preview requests, or `publish` for explicit “publish”, “direct publish”, “上线”, or equivalent requests. Default to `preview` when intent is unclear. Work on a branch; never commit an article directly to `main`. Use `codex/preview/<slug>` for Preview so the Preview workflow runs; use a non-Preview `codex/` branch for direct Publish so it does not deploy an unused Preview.
   Before editing, confirm `git branch --show-current` is neither `main` nor `dev`, the worktree contains no unrelated changes, and the branch includes current `origin/main`.
3. Gather the source, factual claims, desired call to action, cover direction, inline-media needs, and video URLs. Browse primary sources when a claim or link needs verification.
4. Treat Chinese as primary unless Matthew supplies English as the source. Preserve meaning and voice; mark uncertain claims instead of inventing evidence.
5. Create both MDX editions under `content/blog/<slug>/`. Make each language read natively while keeping facts and structure aligned.
   When Matthew says the post belongs to Build in Public, add
   `series: "build-in-public"` to Chinese frontmatter only. Use the series for
   honest productization and online-business experiments, not generic AI news.
   If the update belongs to a registered experiment, also add its exact
   `experiment` slug from `lib/experiments.ts`. A missing experiment must first
   be created with `$curate-matthew-projects-shelves`; do not create an orphaned
   article label.
6. Generate or prepare owned media. Run `node .agents/skills/publish-matthew-blog/scripts/prepare-image.mjs INPUT OUTPUT cover` for a 1600×900 cover, or use `inline` to preserve an illustration's aspect ratio. Copy the printed exact dimensions into MDX and record every file in `publication.json`.
7. Use `VideoEmbed` for supported hosted video. Never paste raw `iframe`, arbitrary embed HTML, JavaScript URLs, or tracking snippets.
8. Run the draft gate while a new slug is unregistered: `node .agents/skills/publish-matthew-blog/scripts/validate-post.mjs <slug> --draft --check-links`. Do not use the draft gate for an existing published post.
9. Classify the change and run its local gate below. CI owns the expensive build and browser release gates for routine blog-only changes; do not duplicate them locally.
10. Present both locale URLs, SEO titles/descriptions, sources, media provenance, verification results, GitHub Actions run, deployed environment, and unresolved confirmations.

## Change scopes and local gates

Choose the narrowest truthful scope. If application code, routes, shared components, dependencies, workflow files, security behavior, redirects, or unrelated content changes, use `full`.

### `media-only`

Use only for an existing published post when the diff is limited to owned media, cover metadata, image alt/caption text, `publication.json`, and regenerated Worker content. Body claims, links, slug registration, video embeds, and application code must be unchanged.

1. Prepare the asset, confirm its exact dimensions/crop, and record provenance.
2. Run the publication validator without network checks because the link set is unchanged:
   `node .agents/skills/publish-matthew-blog/scripts/validate-post.mjs <slug>`
3. Run `pnpm test:blog-skill` and `node scripts/generate-worker-content.mjs`.
4. Inspect the final image itself. The PR fast path compiles the site and checks the changed article in Chromium; do not run the full local unit suite, Cloudflare build, or all-article browser matrix.

### `content-only`

Use for a new article or an existing article revision when changes stay within routine blog sources, registration, view-transition names, generated OG/font/Worker assets, and the legacy manifest. No application behavior may change.

1. Run the appropriate per-post validator with `--check-links`.
2. Run `pnpm test:blog-skill`, `pnpm test:localization`, and `pnpm prebuild`.
3. Review both editions and the final cover. The PR fast path performs the Cloudflare build and focused bilingual browser checks; do not rerun the full local application suite.

### `full`

Use when the change crosses the routine blog boundary or when scope is uncertain. Run the publication validator with `--check-links`, `pnpm test:blog-skill`, typecheck, unit/localization tests, `pnpm build:cloudflare:local`, and the relevant browser checks before pushing.

## Delivery modes

### Preview

1. After the draft gate passes, temporarily add the slug to `publishedPostSlugs` and assign one stable unique view-transition ID on the draft branch. This registration is required for the real article route to render in Cloudflare Preview; do not merge it yet.
2. Run the local gate for the selected change scope. The Preview workflow performs the full deployment validation and hosted browser checks.
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
2. Run the local gate for the selected change scope. Routine `media-only` and `content-only` changes intentionally defer compilation and browser release checks to the protected PR fast path.
3. Show the final diff, bilingual URLs, SEO summary, sources, provenance, and any remaining uncertainty. Block publication when a factual, rights, privacy, link, video, or validation requirement is unresolved.
4. Commit and push a non-Preview feature branch, open a PR to `main`, and wait for all required checks. Routine blog-only PRs automatically use the focused fast path; structural changes retain the full release gate. Merge only after checks pass; never bypass branch protection.
5. Wait for the Production workflow for the merged SHA. Routine blog-only deployments validate only the changed slugs; structural deployments retain the complete hosted suite. Verify both production article routes and changed media before reporting success.
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
- For Build in Public, separate hypotheses from results. Publish revenue, cost,
  conversion, customer, or traffic claims only when Matthew supplies or approves
  the exact figure or range. Never turn an experiment into a success story before
  the evidence exists.
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
