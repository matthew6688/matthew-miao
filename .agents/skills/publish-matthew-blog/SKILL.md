---
name: publish-matthew-blog
description: Create, translate, illustrate, validate, preview, and publish bilingual Chinese-English MDX posts for Matthew Miao's website, including SEO metadata, generated or licensed covers, inline images, diagrams, safe external links, and privacy-gated YouTube, Vimeo, or Cloudflare Stream video. Use for any new article, article revision, blog media change, draft preview, or production blog release in this repository.
---

# Publish Matthew Blog

Create truthful, media-rich bilingual posts without changing the inherited Cali visual system.

## Workflow

1. Read `AGENTS.md`, `lib/site-profile.ts`, the relevant post, and [references/content-contract.md](references/content-contract.md).
2. Determine whether the request is a draft or publication. Work on a branch; never expose an unfinished slug through `publishedPostSlugs`.
3. Gather the source, factual claims, desired call to action, cover direction, inline-media needs, and video URLs. Browse primary sources when a claim or link needs verification.
4. Treat Chinese as primary unless Matthew supplies English as the source. Preserve meaning and voice; mark uncertain claims instead of inventing evidence.
5. Create both MDX editions under `content/blog/<slug>/`. Make each language read natively while keeping facts and structure aligned.
6. Generate or prepare owned media. Run `node .agents/skills/publish-matthew-blog/scripts/prepare-image.mjs INPUT OUTPUT cover` for a 1600×900 cover, or use `inline` to preserve an illustration's aspect ratio. Copy the printed exact dimensions into MDX and record every file in `publication.json`.
7. Use `VideoEmbed` for supported hosted video. Never paste raw `iframe`, arbitrary embed HTML, JavaScript URLs, or tracking snippets.
8. Run the draft gate: `node .agents/skills/publish-matthew-blog/scripts/validate-post.mjs <slug> --draft --check-links`.
9. Build and review both locale routes on desktop and mobile. Check cover crop, every image/lightbox, captions, video consent/loading, headings, code, diagrams, and external links.
10. For publication, add the slug to `publishedPostSlugs` and one stable unique view-transition ID. Run the validator without `--draft`, typecheck, unit and localization tests, Cloudflare build, and article browser checks.
11. Present both URLs, SEO titles/descriptions, sources, media provenance, verification results, and unresolved confirmations. Push, PR, and deploy only when Matthew asks to publish.

## Editorial rules

- Write as Matthew in first person only when the source supports it.
- Prefer concrete observations, decisions, failures, and evidence over generic AI claims.
- Keep AI agent, outreach, company knowledge, and Web coding natural in each language; do not force literal translation.
- Link confirmed entities through `siteProfile` when editing application code.
- Do not restore upstream Cali identity, posts, photos, products, clients, or social accounts.
- Do not publish placeholders, fabricated claims or testimonials, unlicensed media, or unverified personal preferences.
- Prefer primary sources and descriptive link text. External links must use HTTPS.
- Do not deploy, push, send newsletters, or enable payments unless explicitly asked.
- Work on a draft branch by default. Never commit a new article directly to `main` unless Matthew explicitly requests publication.

## Editing existing posts

Update Chinese and English together. If only one language is supplied, adapt the other and report that work. Keep the slug stable unless Matthew accepts the SEO and redirect consequences.

## Media

Use generated, Matthew-owned, public-domain, or explicitly licensed assets inside the post directory. Record provenance and rights in `publication.json` and summarize them in the handoff. Add descriptive, locale-native alt text to every post image. Chinese cover metadata is inherited by English. Prefer WebP for images and Mermaid for diagrams. Convert SVG to WebP because the public content route intentionally does not serve active SVG. Do not use upstream Cali assets as Matthew's work.

Hosted video is click-to-load: YouTube uses `youtube-nocookie.com`, Vimeo uses DNT, and Cloudflare Stream requires its customer code. Always provide a descriptive localized title and optional caption. Summarize or transcribe information that is available only in the video.
