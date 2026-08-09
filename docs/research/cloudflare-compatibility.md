# cali.so v3 的 Cloudflare 部署兼容性调研

> 初次调研：2026-07-22；基线更新：2026-08-09  
> 上游基线：[`CaliCastle/cali.so@9d9b492`](https://github.com/CaliCastle/cali.so/tree/9d9b4926e665a9b8f49135a2a7c5945bd9d87a7e)  
> 资料范围：上游仓库源码，以及 Cloudflare、OpenNext Cloudflare、Next.js 官方文档。本文把“1:1”理解为公开网站的视觉、交互、URL 和功能行为一致；底层服务允许替换。

## 结论

完整站点部署到 Cloudflare **可行，但不是原仓库零改动部署**。最稳妥的首发架构是：

- Cloudflare Workers + `@opennextjs/cloudflare` 承载 Next.js；
- Cloudflare DNS、TLS、CDN、静态资源和自定义域名；
- R2 + Durable Objects + D1（仅作 tag cache）承载 Next.js ISR / `use cache`；
- 业务数据库第一阶段继续用 PostgreSQL（例如 Neon），通过 Hyperdrive 连接；
- Clerk、Upstash、Bunny、Stripe、Resend、Google Calendar 等先保持原服务，避免同时改写产品行为；
- 将 Vercel Analytics、Vercel Cron、Vercel AI Gateway/OIDC 和 `@vercel/functions` 四个硬绑定点替换；
- GitHub Actions 改为 OpenNext Cloudflare 构建/部署，并在发布前跑完整的浏览器回归。

不建议首发时把业务数据库直接改为 D1，也不建议把媒体处理强塞进主 Worker。两者都不是部署配置变更，而是显著的应用重写。若目标是最快做到外观与功能 1:1，应先迁移计算平台，再分阶段迁移外围服务。

## 上游实际技术面

上游并非静态博客，而是一套完整的动态应用：

- [`package.json`](https://github.com/CaliCastle/cali.so/blob/9d9b4926e665a9b8f49135a2a7c5945bd9d87a7e/package.json) 已锁定正式版 `next@16.3.0`、React 19.2、Node `>=22`，并依赖 Clerk、Postgres/Drizzle、Upstash、Bunny/S3、Vercel Analytics、Vercel Functions、AI SDK、Sharp 和 HEIC 解码。相比初次调研的 preview.6，OpenNext 的版本风险已经明显下降。
- [`next.config.ts`](https://github.com/CaliCastle/cali.so/blob/9d9b4926e665a9b8f49135a2a7c5945bd9d87a7e/next.config.ts) 开启 `cacheComponents`、`partialPrefetching`、View Transitions、`authInterrupts`、SRI 等特性，并用 `outputFileTracingIncludes` 打包 MDX 与 OG 字体/图片。
- [`db/index.ts`](https://github.com/CaliCastle/cali.so/blob/9d9b4926e665a9b8f49135a2a7c5945bd9d87a7e/db/index.ts) 使用 `pg` + `drizzle-orm/node-postgres`，同时调用 Vercel 专用的 `attachDatabasePool`。
- [`db/schema.ts`](https://github.com/CaliCastle/cali.so/blob/9d9b4926e665a9b8f49135a2a7c5945bd9d87a7e/db/schema.ts) 是 PostgreSQL 方言，包含数组、`jsonb`、带时区 timestamp、UUID、numeric、复杂 check constraint 等。
- [`vercel.json`](https://github.com/CaliCastle/cali.so/blob/9d9b4926e665a9b8f49135a2a7c5945bd9d87a7e/vercel.json) 注册 5 分钟和 15 分钟两个 Cron HTTP 任务。
- [`lib/content.ts`](https://github.com/CaliCastle/cali.so/blob/9d9b4926e665a9b8f49135a2a7c5945bd9d87a7e/lib/content.ts)、[`lib/newsletters.ts`](https://github.com/CaliCastle/cali.so/blob/9d9b4926e665a9b8f49135a2a7c5945bd9d87a7e/lib/newsletters.ts) 和 [`app/content/[...path]/route.ts`](https://github.com/CaliCastle/cali.so/blob/9d9b4926e665a9b8f49135a2a7c5945bd9d87a7e/app/content/%5B...path%5D/route.ts) 在运行时通过 `node:fs` 读取仓库内的 MDX 与资源。
- [`lib/media/processing/image.ts`](https://github.com/CaliCastle/cali.so/blob/9d9b4926e665a9b8f49135a2a7c5945bd9d87a7e/lib/media/processing/image.ts) 在服务端使用原生 Sharp 和 `heic-decode` 生成媒体 renditions。
- [`lib/og-image.tsx`](https://github.com/CaliCastle/cali.so/blob/9d9b4926e665a9b8f49135a2a7c5945bd9d87a7e/lib/og-image.tsx) 使用 `next/og` 的 `ImageResponse`，并通过文件系统读取运行时字体和图片。
- [`lib/analytics.ts`](https://github.com/CaliCastle/cali.so/blob/9d9b4926e665a9b8f49135a2a7c5945bd9d87a7e/lib/analytics.ts) 和 [`app/_components/site-document.tsx`](https://github.com/CaliCastle/cali.so/blob/9d9b4926e665a9b8f49135a2a7c5945bd9d87a7e/app/_components/site-document.tsx) 直接依赖 Vercel Analytics。
- [生产部署 workflow](https://github.com/CaliCastle/cali.so/blob/9d9b4926e665a9b8f49135a2a7c5945bd9d87a7e/.github/workflows/deploy-production.yml) 先迁移 Postgres，再调用 Vercel CLI；preview/staging/cleanup workflows 同样具有 Vercel 和 Neon 环境语义。

## 兼容性矩阵

| 能力 | 结论 | Cloudflare 落法 / 风险 |
|---|---|---|
| App Router、SSR、SSG、Route Handlers、动态路由 | 支持 | OpenNext 明确列为支持。使用 Next.js Node runtime，不要添加 `runtime = 'edge'`。参见 [OpenNext 支持清单](https://opennext.js.org/cloudflare#supported-nextjs-features)。 |
| Next.js 16 | 正式版受支持；仍需真实部署验证 | 上游已升级到 `16.3.0` 正式版，落入 OpenNext 声明支持的 Next.js 16 minor/patch 范围。仍需做真实 Cloudflare build、hosted smoke 和完整缓存测试，但不再承担 preview 版本本身的额外风险。参见 [支持版本](https://opennext.js.org/cloudflare#supported-nextjs-versions)。 |
| `cacheComponents` / `'use cache'` / PPR | 支持但需完整缓存基础设施 | OpenNext 列出 PPR 与 Composable Caching；Next 16 的 Cache Components 要求 Node runtime。缓存拦截目前不兼容 PPR，必须保持 `enableCacheInterception: false`。参见 [OpenNext 支持清单](https://opennext.js.org/cloudflare#supported-nextjs-features)、[OpenNext 缓存](https://opennext.js.org/cloudflare/caching)、[Next Cache Components](https://nextjs.org/docs/app/getting-started/cache-components)。 |
| ISR、定时 revalidation、`revalidateTag` | 支持但非默认持久化 | 小站推荐 R2 incremental cache + DO queue + D1 tag cache；本项目既有 time-based `cacheLife` 又有 `revalidateTag`，三者都需要。参见 [OpenNext 缓存组件与推荐配置](https://opennext.js.org/cloudflare/caching#guidelines)。 |
| 静态资源 | 支持 | `.open-next/assets` 用 Workers Static Assets；默认 `run_worker_first=false`，请求不计 Worker invocation。需为 `/_next/static/*` 加 immutable header。参见 [OpenNext 静态资源](https://opennext.js.org/cloudflare/howtos/assets) 与 [缓存说明](https://opennext.js.org/cloudflare/caching#static-assets-caching)。 |
| `next/image` | 支持但语义有差异 | 配置 `IMAGES` binding；Cloudflare Images 只优化 PNG/JPEG/WebP/AVIF/GIF/SVG，不支持 `minimumCacheTTL`，本地 IP 行为也不同。参见 [OpenNext Image Optimization](https://opennext.js.org/cloudflare/howtos/image) 和 [Next Image](https://nextjs.org/docs/app/api-reference/components/image)。 |
| 动态 OG / `ImageResponse` | 原理上可运行，必须做 golden test | 它是 Route Handler + Next OG 渲染，但 OpenNext 支持清单未单独承诺该组合；本项目还依赖打包字体与文件读取。验收必须对每种 OG route 比较状态码、content-type、尺寸和像素快照。源码见 [`lib/og-image.tsx`](https://github.com/CaliCastle/cali.so/blob/9d9b4926e665a9b8f49135a2a7c5945bd9d87a7e/lib/og-image.tsx)。 |
| `node:crypto/path/fs/http/net/tls` | 大部分支持，仍有边界 | Wrangler 开启 `nodejs_compat`，compatibility date 至少 `2024-09-23`；Cloudflare 提供的是 Node API 子集，某些模块只是可导入但调用会报错的 stub。参见 [Node.js compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)。 |
| 运行时读取 MDX/字体 | 有条件支持 | Workers VFS 可读取打入 bundle 的模块文件，且只读；因此必须验证 OpenNext 是否把 `outputFileTracingIncludes` 的内容纳入最终 Worker VFS。VFS 的单文件上限 128 MB、时间戳固定为 epoch。参见 [Workers `node:fs`](https://developers.cloudflare.com/workers/runtime-apis/nodejs/fs/)。更稳的后备方案是在 build 时生成静态 content manifest，而不改变前台行为。 |
| PostgreSQL / Drizzle | 支持，需小改 | Workers 官方支持 `pg`，推荐通过 Hyperdrive；当前 `pg@8.22.0` 高于文档要求。删除 `@vercel/functions`/`attachDatabasePool`，使用 Hyperdrive binding 的 connection string；按请求创建 client/pool，并验证事务与并发。参见 [Workers 数据库连接选项](https://developers.cloudflare.com/workers/databases/connecting-to-databases/) 和 [Hyperdrive + Postgres](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/)。 |
| D1 替代业务 Postgres | 不适合首发直接替换 | D1 是 SQLite 语义，而当前 schema 和 migration 大量使用 PostgreSQL `jsonb`、数组、range、类型 cast、函数与约束。需要重新设计 schema、migration、query 和并发保证，不能只换 driver。D1 可先仅作为 OpenNext tag cache。参见 [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/) 和上游 [`db/schema.ts`](https://github.com/CaliCastle/cali.so/blob/9d9b4926e665a9b8f49135a2a7c5945bd9d87a7e/db/schema.ts)。 |
| Clerk | 保留服务，运行时做集成验证 | 上游的管理页面、middleware/auth context、owner metadata 检查均绑定 Clerk。Workers 可对外发 HTTPS 请求且 Node runtime 兼容度较高，但仍需验证 `@clerk/nextjs@7.6.1` + Next 16.3 + OpenNext 的登录、刷新和重定向组合。源码见 [`lib/admin/server.ts`](https://github.com/CaliCastle/cali.so/blob/9d9b4926e665a9b8f49135a2a7c5945bd9d87a7e/lib/admin/server.ts)。 |
| Upstash Redis | 可保留 | 其 REST 客户端通过 `fetch` 工作，平台层没有 TCP 依赖；仍需在 Workers secrets 注入并跑限流测试。若以后追求全 Cloudflare，可用 Durable Objects 重写原子限流，但这是行为重写而非必要迁移。源码见 [`lib/rate-limit`](https://github.com/CaliCastle/cali.so/tree/9d9b4926e665a9b8f49135a2a7c5945bd9d87a7e/lib/rate-limit)。 |
| Bunny 媒体存储/CDN | 可原样保留；R2 可后迁 | 保留 Bunny 是最小风险。若改 R2，R2 支持 S3 API但并非 100% 操作/参数兼容；浏览器直传可用 presigned PUT + CORS，公开读取应绑定自定义域名以获得 CDN 缓存。参见 [R2 S3 兼容表](https://developers.cloudflare.com/r2/api/s3/api/)、[presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)、[R2 CORS](https://developers.cloudflare.com/r2/buckets/cors/) 和 [R2 CDN 缓存](https://developers.cloudflare.com/cache/interaction-cloudflare-products/r2/)。 |
| Sharp / HEIC 媒体处理 | 主 Worker 高风险 | Sharp 是原生 Node addon，项目还会把 HEIC 解为大 RGBA buffer；Workers 每 isolate 仅 128 MB，图片处理很容易超过内存，且不能假设原生 addon 可在 Workers 部署包运行。Cloudflare Images 又不接受 HEIC。建议首发保留独立 Node 媒体处理服务/CI job，或改为 R2 上传后 Queue 驱动的专用处理服务；不能为了“全 Cloudflare”牺牲功能。参见 [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) 与 [OpenNext 支持的图片格式](https://opennext.js.org/cloudflare/howtos/image#compatibility-notes)。 |
| Vercel Cron | 必须替换 | Cloudflare Cron Trigger 调用 Worker 的 `scheduled()`，不会自动按 Vercel 方式访问 Next route。建议独立 cron Worker 按原 schedule 通过 service binding/受保护 HTTPS 调用两个内部 endpoint，继续校验 `CRON_SECRET`；或给 OpenNext worker 增加受支持的自定义入口。参见 [Cloudflare Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/) 和上游 [`vercel.json`](https://github.com/CaliCastle/cali.so/blob/9d9b4926e665a9b8f49135a2a7c5945bd9d87a7e/vercel.json)。 |
| GitHub Actions | 支持 | 使用最小权限的 `CLOUDFLARE_API_TOKEN` 与 `CLOUDFLARE_ACCOUNT_ID`。构建/部署优先调用 OpenNext CLI 的 `deploy`（它会 build、转换并 populate cache），不要绕过适配器直接手写 `wrangler deploy` 流程。参见 [Cloudflare GitHub Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/) 与 [OpenNext CLI](https://opennext.js.org/cloudflare/cli)。 |
| Vercel Analytics | 必须替换或暂时移除 | UI 不受影响，但事件/页面统计后端会失效。若选择 Cloudflare Web Analytics，需要按其脚本/Beacon 模型重新接入，并为自定义 booking events 另选实现；不能仅改环境变量。上游绑定见 [`lib/analytics.ts`](https://github.com/CaliCastle/cali.so/blob/9d9b4926e665a9b8f49135a2a7c5945bd9d87a7e/lib/analytics.ts)。 |
| Vercel AI Gateway / OIDC | 必须替换 | 上游明确把部署环境的媒体 alt-text 能力绑定到 Vercel OIDC；Cloudflare 上无该身份。应改用显式、最小权限的 AI provider/gateway API key，或 Cloudflare AI Gateway，并保持主/备模型、超时与限流行为。源码见 [`lib/media/alt-text/config.ts`](https://github.com/CaliCastle/cali.so/blob/9d9b4926e665a9b8f49135a2a7c5945bd9d87a7e/lib/media/alt-text/config.ts) 与 [`lib/media/alt-text/gateway.ts`](https://github.com/CaliCastle/cali.so/blob/9d9b4926e665a9b8f49135a2a7c5945bd9d87a7e/lib/media/alt-text/gateway.ts)。 |

## 推荐目标架构

```text
matthew-miao.com
  -> Cloudflare DNS / TLS / CDN
  -> OpenNext Cloudflare Worker
       -> Workers Static Assets（public 与 _next/static）
       -> Cloudflare Images（next/image）
       -> R2（Next incremental cache）
       -> Durable Object Queue（time-based revalidation）
       -> D1 tag cache（revalidateTag；低流量个人站足够）
       -> Hyperdrive -> PostgreSQL / Neon（业务数据）
       -> Clerk（owner auth）
       -> Upstash REST（生产限流）
       -> Bunny（首发媒体；之后可迁 R2）
       -> Stripe / Resend / Google APIs / Tencent bridge

Cloudflare Cron Worker
  -> 受保护地调用 /api/internal/ama/work
  -> 受保护地调用 /api/internal/media/reconcile

独立 Node 媒体处理执行环境
  -> Sharp + HEIC -> Bunny/R2 renditions
```

这里的 D1 与业务数据库是两件事：D1 首发只服务于 OpenNext 的 tag cache。业务数据保留 PostgreSQL，才能最大程度维持上游事务、约束和预约防冲突语义。

## 必要代码和配置改动

### 1. OpenNext 基础接入

按照 [existing app 指南](https://opennext.js.org/cloudflare/get-started) 添加：

- `@opennextjs/cloudflare` 和最新 Wrangler；
- `open-next.config.ts`；
- `wrangler.jsonc`，设置 `.open-next/worker.js`、`.open-next/assets`、`nodejs_compat`、足够新的 compatibility date、self service binding、Images/R2/D1/DO/Hyperdrive bindings；
- `.open-next` 加入 `.gitignore`；
- `preview`、`deploy` 脚本。

本项目启用了 PPR，所以不要启用 cache interception。R2 incremental cache 使用 regional cache；DO queue 处理 time-based revalidation；低流量场景按 OpenNext 建议使用 D1 Next-mode tag cache。

### 2. 平台专用代码隔离

- 删除 `@vercel/functions` 与 `attachDatabasePool`；数据库连接改读 Hyperdrive binding。
- 替换 `@vercel/analytics`。
- 把 Vercel OIDC-only 的 alt-text provider 身份改为显式 secret。
- 移除 `vercel.json` 的部署职责，以 Cloudflare Cron 配置替代。
- 重写 `.github/workflows/*deploy*` 中的 Vercel CLI、Vercel preview URL 校验和 Vercel deployment cleanup。

### 3. 内容文件与 OG

先保留现有仓库 MDX 模型，因为这是 AI Agent 更新博客最清楚、可审阅、可回滚的方式。做一个部署 spike 验证所有 traced content 是否出现在 Workers VFS；若不稳定，则 build 时把文章/字体/图片生成静态 manifest 或 import graph。前台输出不变。

### 4. 数据库策略

首发用 PostgreSQL + Hyperdrive，不改 schema。Cloudflare 官方推荐 `pg`，而上游版本满足要求；但需针对以下行为做集成测试：

- migration 仍在 GitHub Actions 里通过独立 `MIGRATION_DATABASE_URL` 执行；
- runtime 只拿 CRUD 账号，连接串来自 Hyperdrive binding；
- transaction、并发预约、slot claim、rate-limit window 和媒体 publish/purge 全部跑真实数据库测试；
- 不把长期全局 `Pool` 的 Node server 假设照搬进 Worker；遵循 Hyperdrive 文档按请求创建客户端、由 Hyperdrive 池化。

只有在 Cloudflare 首发稳定后，才单独评估 D1 业务迁移。那将需要新的 SQLite schema、数据转换、应用层时间/JSON/数组处理、并发控制和完整双写/切换方案。

### 5. 媒体策略

首发保留 Bunny 存储与 CDN，媒体处理放在兼容 Sharp 的 Node 执行环境。若后续迁 R2：

- originals 放私有 R2；
- renditions 用独立公开 bucket + 自定义域名；
- 浏览器直传使用 presigned PUT 并严格 CORS；
- object key 保持内容哈希/不可变，避免覆盖后的 CDN 一致性问题；Cloudflare 官方说明自定义域名缓存会让覆盖或删除的旧内容持续到 TTL/清除，见 [R2 consistency](https://developers.cloudflare.com/r2/reference/consistency/)。

## GitHub Actions 建议流水线

1. Checkout、pnpm、Node 24（与上游 workflow 保持一致）。
2. `pnpm install --frozen-lockfile`。
3. lint/typecheck/unit/security/localization/deployment tests。
4. 数据库 expand-only 检查与 migration（仅 protected environment 可用 migration secret）。
5. `@opennextjs/cloudflare build`。
6. 检查 Worker 压缩后体积和 startup；OpenNext 提醒 Free/Paid 的 Worker 压缩包限制分别为 3 MiB/10 MiB，见 [OpenNext Worker size note](https://opennext.js.org/cloudflare#note-on-worker-size-limits)。此项目依赖较重，实际部署大概率应以 Workers Paid 为预算基线。
7. 部署 staging Worker/自定义测试域名，populate cache。
8. Playwright hosted suite + Clerk 登录 + OG/image + cron + booking webhook smoke。
9. Production deploy，随后 canary；失败使用 Workers Versions 回滚。

Cloudflare 官方说明 CI 需账号 ID 与 API token，且 token 不应提交仓库，见 [GitHub Actions 官方指南](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)。OpenNext CLI 的 `deploy` 会隐式执行 cache population，见 [OpenNext CLI](https://opennext.js.org/cloudflare/cli#deploy-command)。

## 必须通过的 P0 验证门

在声称“1:1 完成”前，至少逐项验证：

1. `next@16.3.0` 能否通过 OpenNext build、Wrangler bundle 和真实 Worker startup，并保持 Cache Components、PPR、ISR 与 View Transitions 行为。
2. 中英文首页、文章、newsletter、projects、photos、AMA、admin 的桌面和移动视觉截图一致。
3. View Transition、prefetch、主题、locale、dock、WebGPU/降级路径行为一致。
4. 所有 MDX、文章图片、下载内容与 runtime fonts 都能从 Workers VFS 正确读取。
5. `next/image` 的本地/远程/Bunny 图片、GIF/SVG bypass、响应格式和缓存正确。
6. 每种动态 OG 图和 metadata route 在真实 Worker 上正确生成。
7. Clerk signed-out redirect、登录、60 秒 token refresh、owner metadata 拒绝非 owner、API mutation 全部通过。
8. Hyperdrive 下的全部事务和并发预约测试通过；确认没有连接泄漏。
9. Stripe webhook 原始 body/签名、Resend、Google OAuth callback、Google Calendar、Tencent bridge 可用。
10. Upstash 限流在多 PoP 下保持预期；preview/staging 的隔离语义不退化。
11. 两个 Cron schedule 均实际触发、携带正确 bearer secret、具备幂等与可观测性。
12. 媒体上传、分块、校验、HEIC/JPEG 处理、publish、purge、reconcile 端到端通过，并观察 128 MB Worker 内存边界；相关限制见 [Workers limits](https://developers.cloudflare.com/workers/platform/limits/)。
13. ISR 冷/热命中、time revalidation、`revalidateTag`、发布后的 cache purge 均正确；自定义域名才可用 OpenNext automatic cache purge，见 [OpenNext Automatic Cache Purge](https://opennext.js.org/cloudflare/caching#automatic-cache-purge)。
14. CSP/security headers 在 Static Assets 与 Worker responses 上均符合预期；OpenNext 明确指出 Worker 不经过静态资源时，`next.config.ts` headers 不作用于 public/static files，见 [Static Assets Caching](https://opennext.js.org/cloudflare/caching#static-assets-caching)。

## 分阶段实施建议

### Phase A：兼容性 spike（先做，不能跳过）

- 不改 UI/内容，直接对上游 commit 加最小 OpenNext 配置。
- 真实部署一个隔离 Worker，跑 public route、VFS、OG、Images、Cache Components、Clerk、Postgres smoke。
- 单独证明 Worker bundle size、startup、CPU 与内存；Workers 的 HTTP CPU 免费版为 10 ms，付费版默认 30 秒且可配置更高，内存固定 128 MB，详见 [Workers limits](https://developers.cloudflare.com/workers/platform/limits/)。

### Phase B：Cloudflare 首发

- Workers/OpenNext + Cloudflare DNS/CDN/Images/cache。
- PostgreSQL/Neon + Hyperdrive；Clerk、Upstash、Bunny 等保持。
- 替换 Analytics、Cron、AI Gateway identity 和 GitHub deployment。
- 上线前用同一组 golden screenshots 和行为测试对比上游。

### Phase C：外围服务 Cloudflare 化（可选）

- Bunny -> R2；
- Upstash -> Durable Objects；
- 业务 Postgres -> D1（独立迁移项目，优先级最低、风险最高）；
- 媒体处理是否迁 Cloudflare需取决于 HEIC/Sharp 等价方案和内存实测。

## 最终决策

采用“**Cloudflare 承载网站运行时和边缘层，首发保留能确保行为一致的成熟外部服务**”这一方案。它满足“尽可能都放 Cloudflare”，同时把 1:1 产品还原放在平台纯度之前。Cloudflare-only 并非不可能，但 D1 和媒体处理会显著扩大改写范围；应在 Cloudflare Workers 首发稳定之后逐项迁移，而不是作为首次上线的阻塞条件。
