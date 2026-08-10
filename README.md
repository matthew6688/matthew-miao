# matthew-miao.com

Source for Matthew Miao's bilingual personal website and blog at
[matthew-miao.com](https://matthew-miao.com). Chinese is the default language;
English routes live under `/en`.

The visual and interaction system is derived from
[CaliCastle/cali.so](https://github.com/CaliCastle/cali.so) at the pinned MIT
baseline documented in
[`docs/research/upstream-source-audit.md`](docs/research/upstream-source-audit.md).
Upstream personal writing, identity, photographs, social accounts, projects,
and taste data are not reused.

## Stack

- Next.js 16.3, React 19, TypeScript, Tailwind CSS 4
- Cloudflare Workers via OpenNext
- Workers Static Assets and R2 incremental cache
- Bilingual repository-owned MDX content
- Optional PostgreSQL through a Cloudflare Hyperdrive binding
- Credential-driven, fail-closed Admin, AMA, and Media provider integrations

## Local development

```bash
corepack pnpm install --frozen-lockfile
cp .env.example .env.local
corepack pnpm dev
```

## Validation

```bash
corepack pnpm typecheck
corepack pnpm test:unit
corepack pnpm test:localization
corepack pnpm build:cloudflare
```

The full release gate is documented in
[`docs/implementation-plan.md`](docs/implementation-plan.md). Current deployment
state and remaining provider work are recorded in
[`docs/handoff.md`](docs/handoff.md).

## Publishing

AI agents should use
[`publish-matthew-blog`](.agents/skills/publish-matthew-blog/SKILL.md) to create,
translate, validate, and either deploy posts to the shared Cloudflare Preview
for review or publish them through a protected Production PR. Preview is the
default when publication intent is unclear; an explicit direct-publish request
still keeps every validation and branch-protection gate.

## License and content rights

Application source code is available under the [MIT License](LICENSE). Matthew's
identity, writing, media, product branding, and personal data are not granted by
that license. The upstream attribution and content boundary remain documented
for future syncs.
