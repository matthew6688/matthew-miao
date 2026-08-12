# Blog content contract

Each slug is a directory under `content/blog/` with `index.mdx` and `index.en.mdx`.

Chinese frontmatter owns shared metadata:

```yaml
---
title: "中文标题"
description: "独立阅读也准确的 SEO 摘要"
publishedAt: "2026-08-10T00:00:00.000Z"
cover: "./cover.webp" # optional
coverWidth: 1600       # required with cover
coverHeight: 900       # required with cover
coverCaption: "来源或说明" # optional
---
```

English frontmatter contains only `title` and `description`. Chinese descriptions
are at most 80 characters and English at most 160. Use a lowercase kebab-case
slug and `##`/`###` headings so the article rail can build landmarks.

## Images and diagrams

Store owned media beside the MDX. Prefer WebP. Inline raster syntax includes
intrinsic pixels and locale-native alt/caption text:

```md
![描述内容的中文替代文本](./workflow.webp#1600x1000 "中文图注")
```

The validator checks existence and exact dimensions. Use Mermaid fences for
text-heavy flowcharts when possible. SVG is not publicly served because it can
contain active content; convert it to WebP or express it as Mermaid.

Every referenced file must have structured provenance in `publication.json`:

```json
{
  "media": {
    "cover.webp": {
      "source": "Generated specifically for this article",
      "rights": "generated"
    }
  },
  "manualChecks": []
}
```

`rights` is one of `owned`, `generated`, `licensed`, or `public-domain`.

## Links

Use descriptive HTTPS links and prefer primary sources. Run `--check-links`
before publication. If a provider temporarily blocks automation, verify it in
a browser and add the exact URL, ISO `checkedAt`, and a meaningful `note` to
`publication.json.manualChecks`. Never fabricate this evidence or silently
remove a useful citation.

## Video

Raw iframes and scripts are forbidden. Use the controlled click-to-load component:

```mdx
<VideoEmbed
  provider="youtube"
  id="dQw4w9WgXcQ"
  title="演示：AI Agent 发布流程"
  caption="从草稿到 Cloudflare 部署的完整演示"
/>
```

Supported providers:

- `youtube`: 11-character video ID;
- `vimeo`: 6–12 digit video ID;
- `cloudflare-stream`: 32-character video ID and 32-character lowercase hex
  `customerCode`.

Each locale supplies its own title and caption. Summarize essential video-only
information in prose or link a transcript for accessibility. `--check-links`
uses provider oEmbed/player endpoints to reject missing or private videos.

## Publication registration

A public post must be in `publishedPostSlugs` in `lib/public-content-routes.ts`
and have a stable unique case in `lib/view-transition-name.ts`.

- Draft: `validate-post.mjs <slug> --draft --check-links`.
- Publish: register it, then `validate-post.mjs <slug> --check-links`.
- Repository gate: `validate-all-posts.mjs` validates every registered post in
  publication mode and every committed unregistered directory in draft mode,
  without external network I/O; `pnpm test:blog-skill` runs this on every CI/deploy path.

## Cloudflare Preview and Production

An unregistered draft intentionally returns 404. To review the actual article UI,
first pass the draft validator, then register the slug and transition ID only on
the feature branch. Push that branch and wait for the `Deploy Preview` workflow.
Review both `/blog/<slug>` and `/en/blog/<slug>` on
`matthew-miao-preview.matthew6688.workers.dev`. The Preview Worker is shared and
internet-accessible; the latest successful feature deployment replaces its prior
contents.

Publishing keeps the registration, passes the publication validator and protected
PR checks, merges to `main`, and waits for the Production workflow. “Direct
publish” may skip Matthew's Preview approval wait, but never skips validation,
branch protection, Production deployment, or hosted verification.

The hosted browser suite derives article cases from `publishedPostSlugs`. It checks
both locale routes, canonical/hreflang metadata, delivered article images, safe
links, initial video consent state, feeds, and sitemap for each public slug.
