# Blog content contract

Each public slug is a directory under `content/blog/` with two files.

Chinese `index.mdx` requires:

```yaml
---
title: "中文标题"
description: "用于列表和社交分享的准确摘要"
publishedAt: "2026-08-09T01:00:00.000Z"
cover: "./cover.webp" # optional
coverWidth: 1600       # required with cover
coverHeight: 900       # required with cover
coverCaption: "来源或说明" # optional
---
```

English `index.en.mdx` requires only `title` and `description`; it shares the date and cover metadata from Chinese.

Use a lowercase kebab-case slug. A public post must also appear in `lib/public-content-routes.ts`, and every published slug needs a stable entry in `lib/view-transition-name.ts`.

Keep descriptions useful when isolated from the page: Chinese at most 80 characters and English at most 160 characters. Use `##` and `###` headings so the article rail can build landmarks. Store post media beside the MDX files and reference it with relative paths.
