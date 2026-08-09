# cali.so v3 上游源码审计

初次审计：2026-07-22；基线更新：2026-08-09  
目标上游：[CaliCastle/cali.so](https://github.com/CaliCastle/cali.so)  
锁定生产基线：[`9d9b4926e665a9b8f49135a2a7c5945bd9d87a7e`](https://github.com/CaliCastle/cali.so/commit/9d9b4926e665a9b8f49135a2a7c5945bd9d87a7e)（2026-08-08 `main`）

## 结论

`matthew-miao.com` 应当从上游 commit 直接派生，而不是根据截图重新实现。这样才能保留公开页面、后台、动效、可访问性、SEO、Feed、缓存和安全边界的实际行为。视觉与交互代码保持不变；只替换 Cali 的个人文字、文章、照片、项目、社交信息、地理信息、品牌资产和所有第三方账号。

第一阶段不建议把 PostgreSQL 改写为 D1，也不建议把媒体处理搬进 Cloudflare Workers。原因不是 Cloudflare 本身不足，而是上游的完整功能已经明确依赖 PostgreSQL 专有并发约束和 Node 原生图像工具。上游已从 Next.js preview 升级到 16.3.0 正式版，降低了 OpenNext 版本风险，但不消除业务数据库和图像处理的移植边界。

## 上游规模与边界

当前生产基线包含大规模的应用代码、完整自动化测试和版本化 PostgreSQL migrations，实施时以锁定 commit 的实际清单为准，不沿用旧基线的文件数量：

- 公开页面、Route Handlers 与 Owner Admin
- 单元、集成、部署和浏览器测试套件
- 版本化 PostgreSQL migrations
- 中文无前缀路由与英文 `/en` 路由
- 首页、博客、文章、项目、照片、AMA 预约、管理链接、Owner Admin、媒体库、照片策展、RSS、OG 图片与链接预览

上游 README 明确记录了 [Next.js 16.3、React 19、MDX、Clerk、Neon、Bunny Media、GitHub Actions 部署架构](https://github.com/CaliCastle/cali.so/blob/9d9b4926e665a9b8f49135a2a7c5945bd9d87a7e/README.md)。

## 1:1 的定义

### 必须保持

- DOM 页面层级和公开 URL 家族
- Geist / Frex Sans GB 字体与字重
- warm-paper 色阶、暗色模式、signal 色和表面层级
- 37.5rem 内容栏、底部 Dock、footer、技术印刷装饰
- 页面进场、route defocus/focus、共享元素过渡、书架/唱片/照片物理动效
- hover card 的延时、固定尺寸、服务专属内容和 touch fallback
- 图片 lightbox、reduced-motion、键盘导航和 focus-visible
- 中英文 metadata、canonical、hreflang、RSS、sitemap、robots 和 OG
- Owner Admin、媒体上传与照片发布工作流
- AMA slot hold、Stripe 支付、日历、会议、邮件、管理链接和退款工作流
- CSP、同源 mutation、rate limit、审计和凭据隔离

这些行为在上游的 [Design Language](https://github.com/CaliCastle/cali.so/blob/9d9b4926e665a9b8f49135a2a7c5945bd9d87a7e/docs/design-language.md) 和 [handoff](https://github.com/CaliCastle/cali.so/blob/9d9b4926e665a9b8f49135a2a7c5945bd9d87a7e/docs/handoff.md) 中有可执行定义。

### 必须替换

- Cali Castle 的姓名、简介、经历、联系方式和地理位置
- Zolplay 与 Cali 的项目注册表
- 文章、newsletter 和其中的媒体
- 头像、肖像、照片、项目图、个人插画
- 唱片和书籍封面：只有在 Matthew 确实选择相同项目且封面使用权允许时才保留
- X、GitHub、YouTube、Telegram、小红书数据与账号
- `cali.so`、`beta.cali.so`、`CaliCastle`、`calicastle` 等硬编码
- analytics、Clerk、Neon、Bunny、Stripe、Google、Resend、Upstash、AI Gateway 等账号

上游 [License](https://github.com/CaliCastle/cali.so/blob/9d9b4926e665a9b8f49135a2a7c5945bd9d87a7e/LICENSE) 允许使用 MIT 源码，但明确排除了作者的文章、照片、艺术、身份、品牌与个人数据。

## 不适合直接替换为 D1 的原因

AMA 的 slot claim 使用 PostgreSQL `tstzrange`、GiST `EXCLUDE` 约束和带缓冲区的不可重叠时间段；媒体生命周期使用 transaction advisory lock。它们是防止重复预约和并发媒体操作冲突的正确性边界，而不只是普通数据存储：

- [AMA booking migration](https://github.com/CaliCastle/cali.so/blob/9d9b4926e665a9b8f49135a2a7c5945bd9d87a7e/db/migrations/0011_ama_booking_system.sql)
- [媒体生命周期锁](https://github.com/CaliCastle/cali.so/blob/9d9b4926e665a9b8f49135a2a7c5945bd9d87a7e/lib/media/catalog/lifecycle-locks.ts)

如果改成 D1，需要重新设计并验证并发模型，不能称为基础设施等价替换。

## Cloudflare 原生运行时的主要移植点

- 数据层当前使用 `pg`、`drizzle-orm/node-postgres` 和 `@vercel/functions` 的连接池生命周期：[db/index.ts](https://github.com/CaliCastle/cali.so/blob/9d9b4926e665a9b8f49135a2a7c5945bd9d87a7e/db/index.ts)
- 博客资源、newsletter、OG 字体和图片依赖部署包中的 Node 文件系统：[next.config.ts](https://github.com/CaliCastle/cali.so/blob/9d9b4926e665a9b8f49135a2a7c5945bd9d87a7e/next.config.ts)
- Media Library 用 Sharp、HEIC decoder 和 EXIF 解析在服务端生成 rendition：[lib/media/processing/image.ts](https://github.com/CaliCastle/cali.so/blob/9d9b4926e665a9b8f49135a2a7c5945bd9d87a7e/lib/media/processing/image.ts)
- 部署流程当前围绕 Neon 分支、migration-before-deploy 和 Vercel exact commit deployment：[deploy action](https://github.com/CaliCastle/cali.so/blob/9d9b4926e665a9b8f49135a2a7c5945bd9d87a7e/.github/actions/deploy-neon-vercel/action.yml)
- 动态缓存、Cache Components、Partial Prefetching、ISR 和 Next.js 16.3 stable 必须逐项用目标适配器验证，不能假定普通 Next.js 兼容即代表等价。

## 建议的首发架构

先对未改 UI 的上游 commit 做一次真实 OpenNext/Workers compatibility spike。若 P0 验证门全部通过，则以 Cloudflare runtime 首发；若媒体处理、缓存或平台专属行为无法等价，则只把失败的能力留在已验证的外部服务，不降低 1:1 验收标准。

| 能力 | 首发选择 | 原因 |
| --- | --- | --- |
| DNS、域名、TLS、WAF | Cloudflare | 用户已持有域名；不改变应用行为 |
| Next.js runtime | Cloudflare Workers + OpenNext（P0 spike 后） | 尽可能 Cloudflare 化；必须实测 Next 16.3 stable、Cache Components、VFS、图片和 OG |
| Next cache | R2 + Durable Objects + D1 tag cache | 只承载 ISR/`use cache`，不是业务数据库 |
| PostgreSQL | Neon + Hyperdrive | 保留上游 schema、分支预览和并发约束；Workers 通过 Hyperdrive 连接 |
| 图片库与 CDN | Bunny | 保留原始图、rendition、保护路径和上传流程 |
| Owner auth | Clerk | 保留上游授权和 session refresh 边界 |
| Rate limit | Upstash + Neon fallback | 与上游一致 |
| 支付 | Stripe | 与上游 webhook/退款逻辑一致 |
| 日历与会议 | Google Calendar + Tencent MCP（按需） | 与上游 capability 模型一致 |
| 邮件 | Resend | 与上游模板和操作流程一致 |
| CI/CD | GitHub Actions + OpenNext CLI | 保留 migration-before-deploy 和 exact SHA 发布 |
| 边缘层 | Cloudflare DNS/TLS/CDN/Workers Static Assets/Images | 与 Workers runtime 一起做 hosted 验收 |

P0 spike 若未通过，运行时回退 Vercel作为确定性兜底，Cloudflare继续负责 DNS/TLS；失败项进入独立兼容性任务。这个回退不允许删功能或修改视觉合同。

## 验收证据

- 上游完整测试集在派生仓库继续通过
- 关键路由在 375×812、768×1024、1280×720 三个视口建立截图基线
- light/dark、中文/英文、reduced motion、touch/fine pointer 各有覆盖
- 首页、博客列表、文章、项目、照片、AMA、预约、manage token、登录、Admin、媒体上传、照片发布均有 Playwright 流程
- 对公开页面进行 visual diff；只有文本换行和已批准个人素材造成的差异可以进入白名单
- canonical、hreflang、RSS、sitemap、robots、OG、404/403/500 和安全 header 有自动验证
