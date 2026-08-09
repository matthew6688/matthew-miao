---
name: publish-matthew-blog
description: Draft, translate, edit, validate, and publish bilingual Chinese-English MDX posts for Matthew Miao's personal website. Use when adding a blog article, changing an existing post, adding a cover or inline media, updating blog SEO copy, or preparing a post for publication in this repository.
---

# Publish Matthew Blog

Create truthful bilingual posts without changing the inherited Cali visual system.

## Workflow

1. Read `AGENTS.md`, `lib/site-profile.ts`, and the relevant existing post.
2. Treat Chinese as the primary edition unless Matthew explicitly provides English as the source.
3. Preserve Matthew's meaning and voice. Mark uncertain claims for confirmation; never invent clients, results, dates, credentials, social accounts, or personal preferences.
4. Create matching files at `content/blog/<slug>/index.mdx` and `index.en.mdx`. Read [references/content-contract.md](references/content-contract.md) before editing frontmatter or media.
5. Add the slug to `publishedPostSlugs` in `lib/public-content-routes.ts` only when the post is ready to be public.
6. Add a unique safe ID for the slug in `lib/view-transition-name.ts`. Keep existing IDs stable.
7. Run `node .agents/skills/publish-matthew-blog/scripts/validate-post.mjs <slug>`.
8. Run `corepack pnpm typecheck` and the relevant tests. For publication, run `corepack pnpm test:unit`.
9. Build before browser testing so cached MDX reflects the draft, then run the Chromium article/lightbox checks and WebKit smoke checks.
10. Review both language routes, headings, links, images, metadata, and mobile layout. Show the diff, proposed URLs, SEO summaries, and missing confirmations before asking to publish.

## Editorial rules

- Write as Matthew in first person only when the source supports it.
- Prefer concrete observations, decisions, failures, and evidence over generic AI claims.
- Keep terminology such as AI agent, outreach, company knowledge, and Web coding natural in each language; do not force literal translation.
- Make each edition read natively. Preserve facts and structure, but allow sentence-level adaptation.
- Link confirmed entities through `siteProfile` when editing application code. Confirmed public entities currently include FengTalk, UChat, GitHub, Brisbane, and `hi@fengtalk.ai`.
- Do not restore upstream Cali posts, photos, biography, clients, social identities, or Cali Baby material.
- Do not publish placeholders, TODOs, fabricated testimonials, or unlicensed media.
- Do not deploy, push, send newsletters, or enable payments unless the user explicitly asks.
- Work on a draft branch by default. Never commit a new article directly to `main` unless Matthew explicitly requests publication.

## Editing existing posts

Update Chinese and English together. If only one language is supplied, translate the change and state that the other edition was adapted. Keep the slug stable unless Matthew explicitly accepts the SEO and redirect consequences of changing it.

## Media

Use locally licensed assets inside the post directory. Add descriptive alt text in both editions. A cover declared in Chinese frontmatter must include exact positive `coverWidth` and `coverHeight`; both editions share it. Do not use an upstream Cali image as Matthew's portrait or work.
