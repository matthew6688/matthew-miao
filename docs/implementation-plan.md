# matthew-miao.com 1:1 实施计划

状态：调研完成后的执行草案  
初稿：2026-07-22；基线更新：2026-08-09  
目标：以锁定的 MIT 上游源码为基线，完整复制设计、交互、公开功能与 Owner Admin，只替换为 Matthew 的内容、资产、域名和服务账号。

当前锁定生产基线记录在 `docs/research/upstream-source-audit.md`，使用 Next.js 16.3.0 正式版。上游产品页面、文案、图片和品牌资产不进入 Matthew 站点，但其共享框架修复、安全更新和通用交互改进保留。

## 决策摘要

1. 直接 fork/导入锁定的上游 commit，不重写 UI。
2. “1:1”优先于“全部 Cloudflare”。首发优先使用 Workers + OpenNext，但先用未改 UI 的上游 commit 做真实 compatibility spike；不能通过 P0 门时只回退失败的运行能力，不删功能。
3. 个人内容和受版权保护资产必须全部替换；MIT 源码和设计实现保留。
4. 所有身份替换集中到 Site Profile，避免散落的姓名、域名和社交账号再次硬编码。
5. 博客继续使用仓库内 MDX，并提供项目专属 Agent Skill，使 AI 可以安全地创建、翻译、预览和发布文章。
6. 发布前以自动化测试和视觉差异证明 1:1，而非主观验收。
7. Matthew 于 2026-08-09 明确批准 Cal.com 取代自建公开预约、支付、日历与通知流程；`/ama` 的 1:1 介绍页与 CTA 视觉保持不变，`/ama/book` 和 `/en/ama/book` 成为保留路由并跳转到同一个由浏览器语言本地化的 Cal.com Event Type。这是经 Owner 批准的功能例外，不作为上游视觉漂移回灌到其他页面。

## Phase 0 — 锁定基线与仓库治理

交付：可追溯、可同步上游的干净仓库。

- 将已审计的锁定 commit 导入空仓库 `matthew6688/matthew-miao`
- 添加 `upstream` remote，`origin` 指向 Matthew 仓库
- 建立 `main`、`dev` 和 feature branch 规则
- 原样保留 MIT license 与内容例外说明
- 记录上游 commit、首次导入 diff 和以后同步策略
- 开启 Dependabot、CodeQL、secret scanning 和 branch protection

退出条件：初始导入的 lockfile 安装、typecheck、unit tests、production build 全部通过，且没有身份或业务修改混入基线 commit。

## Phase 1 — 建立 1:1 验收基准

交付：可自动判断“是否还是同一个网站”的基准套件。

- 将锁定生产基线的完整自动化测试套件作为行为基线
- 对中英文关键公开路由和 Admin 壳层建立截图矩阵
- 录制 Dock、Preferences、theme、locale、hover card、书架、唱片、lightbox、route transition 的交互断言
- 固定测试字体、时区、动画时钟、视口和测试数据
- 建立视觉差异阈值；布局、颜色、尺寸和动效为零容忍，个人文字换行与批准素材为显式快照更新
- 保存上游基准报告，之后每个阶段运行相同套件

退出条件：在未替换内容的基线分支上，行为测试和视觉基准稳定可重复。

## Phase 1.5 — Cloudflare/OpenNext P0 compatibility spike

交付：基于真实部署证据决定 Production runtime，而不是按文档推测。

- 在完全不改 UI 与内容的基线 commit 上接入 `@opennextjs/cloudflare` 和 Wrangler
- 配置 Workers Static Assets、Cloudflare Images、R2 incremental cache、Durable Object revalidation queue、D1 tag cache 和 Hyperdrive
- 保持 `enableCacheInterception: false`，验证 Cache Components、PPR、ISR 与 `revalidateTag`
- 删除 `@vercel/functions` 的 pool lifecycle 假设，改为 Hyperdrive 支持的 PostgreSQL连接方式
- 真实部署隔离 Worker，验证 bundle 大小、startup、CPU、128 MB 内存和 Node compatibility
- 验证 MDX、文章资源、OG 字体进入 Worker VFS；必要时在 build 阶段生成静态 manifest，但不改变前台输出
- 验证动态 OG、`next/image`、Clerk 登录/token refresh、Hyperdrive transaction、Stripe webhook 原始 body、Cron、CSP 和静态资源 header
- Sharp/HEIC 媒体处理单独压测；主 Worker 不具备等价能力时放入独立 Node 执行环境

决策门：

- 全部 P0 通过：Production 使用 Cloudflare Workers + OpenNext。
- 个别外围能力不通过：站点仍上 Workers，失败能力由独立 Node 服务或原 provider 承载。
- Next 16.3、核心缓存或路由行为不通过且无小范围修复：runtime 回退 Vercel；Cloudflare继续负责 DNS/TLS，并保留 spike 结果供后续迁移。

退出条件：每个 P0 项有 pass/fail 证据、hosted URL、日志和明确 runtime 决策。

## Phase 2 — Site Profile 与完整去身份化

交付：代码仍然 1:1，但所有 Cali 身份数据都能从一个 Matthew Profile 驱动。

- 建立类型化 Site Profile：姓名、简介、语言、所在地、坐标、时区、经历、社交、邮箱、域名、版权年份
- 把 `lib/personal.ts`、`lib/projects.ts`、social snapshots、SEO、footer、OG、邮件和安全 AAD 中的身份常量迁入 Profile 或明确的版本化配置
- 替换全部上游域名、身份、品牌与旧账号引用
- 删除上游文章、newsletter、照片、头像、肖像、个人插画和未授权项目资产
- 为尚未提供的个人内容使用明确的 unpublished/empty state；不伪造 Matthew 的经历或项目
- 保留书架/唱片组件结构；内容清单与封面由 Matthew 确认后注入

退出条件：身份扫描不再发现未批准的 Cali 个人数据；设计与交互快照除内容区域外无差异。

## Phase 3 — 内容采集与等结构替换

交付：所有页面拥有 Matthew 的真实内容，同时保持原页面的信息密度和组件形态。

一次性内容问卷覆盖：

- 中英文姓名、四段首页介绍、短/长简介
- 城市、时区、公开坐标精度、联系邮箱
- 工作经历与项目
- X/GitHub/YouTube/Telegram/小红书等账号
- 书籍、唱片与对应合法封面来源
- 头像、横竖肖像、照片墙候选、项目缩略图
- AMA 服务范围、语言、时长、价格、退款规则和可用时间
- 初始文章、newsletter 以及是否需要双语

实施规则：内容长度优先匹配原版节奏；如果真实内容过长，先编辑文案，不改布局。移动端和 CJK/Latin 换行逐页验收。

退出条件：所有公开页面均为真实 Matthew 内容，无占位文案、无未授权个人资产、无死链。

## Phase 4 — 服务环境与安全隔离

交付：Production、Staging、Preview 环境与上游功能等价。

- Cloudflare：Workers/OpenNext runtime、Static Assets、Images、R2/DO/D1 Next cache、Hyperdrive、Cron Worker、Web Analytics、Production/Staging/Preview 环境
- Neon：业务 PostgreSQL；独立 Production project、Staging project 与 preview branches
- Cloudflare R2：Production 与非生产媒体 bucket；Original/Rendition/Chunks 路径和公开读取保护规则
- Clerk：Matthew owner 用户与 `publicMetadata.siteOwner = "yes"`
- Upstash：仅 Production 的 rate limit
- Stripe：测试/生产 webhook、Checkout 与退款
- Google OAuth/Calendar：availability 与 meeting invitation
- Resend：验证 `matthew-miao.com` 发件域名
- Tencent Meeting MCP：若 Matthew 需要此 provider 再配置；否则保持完整凭据对缺失时的 fail-closed 行为
- Cloudflare AI Gateway 或显式 provider key、geocoding、link preview 和社交数据刷新使用 Matthew 的账号；不依赖 Vercel OIDC
- 所有 secret 只进入对应 GitHub Environment/hosting provider，不进仓库

退出条件：Staging 的全部 hosted checks 通过，Production secret 与非生产完全隔离。

## Phase 5 — CI/CD 与数据库迁移链路

交付：每次发布都先迁移、后部署同一个 commit。

- 改写上游 workflow 中的仓库名、环境名、域名和 provider project IDs
- 保留 migration hash lock、expand-only 检查和 migration/runtime database role 分离
- Preview PR 创建/刷新 Neon preview branch，通过 OpenNext CLI 发布稳定 Worker Preview
- `dev` 自动部署 Staging；`main` 仅在完整检查后部署 Production
- 失败时不继续部署；部署摘要必须记录 exact SHA 与 URL
- Cloudflare Cron Worker 定时、带密钥且幂等地调用媒体 reconcile 和 AMA work endpoint

退出条件：一次测试 PR、一次 dev 发布和一次 production dry-run 均有完整证据链。

## Phase 6 — Cloudflare 域名上线

交付：`matthew-miao.com` 正式服务，DNS 与应用职责清晰。

- 将通过 P0 的 Production Worker 绑定 `matthew-miao.com`，`www` 指向同一 zone
- 主域设为 `https://matthew-miao.com`，`www` 永久跳转主域
- 验证 Workers Static Assets 与动态 Worker response 的缓存和安全 header 均符合合同
- 验证 TLS、CAA、DNSSEC、邮件 SPF/DKIM/DMARC、Google/Stripe/Clerk callback
- 验证真实客户端 IP、CSP、streaming、ISR、图片缓存、webhook body 与 rate limit
- 配置最小 WAF/速率规则，先在 Staging 复验，不与应用层 Upstash 规则重复计数

退出条件：Production smoke、SEO、Feed、OG、支付 webhook、登录和媒体访问全部通过，旧 URL 不泄漏。

## Phase 7 — 内容与照片 Agent Skills

交付：仓库内 `.agents/skills/publish-matthew-blog/SKILL.md`、
`.agents/skills/manage-matthew-photos/SKILL.md` 与安全脚本。

Skill 支持：

- 从主题、提纲或草稿创建 MDX
- 按上游 frontmatter schema 校验 slug、日期、locale、category 与 metadata
- 中英文文章成对创建或明确标记单语
- 图片复制到文章同目录，生成稳定引用、尺寸和 alt text
- 运行格式、链接、内容、OG、RSS、typecheck、unit 和文章页面 Playwright 检查
- 默认创建草稿分支，不直接推送 `main`
- 默认先临时注册到共享 Cloudflare Preview 并返回中英文审阅链接；明确“直接发布”时可跳过人工等待，但不能跳过验证、受保护 PR 或 Production hosted checks
- 发布前展示 diff、URL、SEO 摘要和缺失项
- 支持更新旧文、撤稿、重命名 slug，并维护 redirect/legacy manifest
- 明确禁止把 secret、私人照片原图位置、EXIF 或未授权素材写入公开内容

同时更新根 `AGENTS.md`，告诉后续 Agent：先读 Site Profile、内容 schema、Design Language 和发布门禁；博客任务不得改变视觉组件。

照片 Skill 负责把 Matthew 授权的 HEIC/HEIF/JPEG/PNG 原图转换为无 EXIF/GPS 的多尺寸衍生图，提供双语 alt text、Preview 验收、发布、下架和带精确确认短语的永久衍生图删除。原图始终留在 Git 之外，任何“从网站移除”默认解释为可恢复的下架。Repository Photo Publication 与后续 Owner Admin 共用同一个公开 Photo Selection 合同；切换到数据库是显式、验证后、fail-closed 的环境模式变更。

退出条件：用 Skill 从零创建一篇双语测试文章，在 Preview 完成全套验证后安全撤回测试内容。

## Phase 8 — 完整发布验收

必须全部通过：

- frozen lockfile install、typecheck、unit、localization、AMA、security、media、deployment、production build
- Chromium 完整 Playwright、WebKit smoke、hosted Staging tests
- 三视口 × 双主题 × 双语言 × reduced-motion 的视觉矩阵
- 首页、文章、项目、照片、AMA、Checkout test mode、manage link、Admin、上传、策展和发布流程
- SEO、canonical、hreflang、RSS、sitemap、robots、OG 和 structured metadata
- 404、403、500、provider 缺失、数据库不可用、CDN 图片失败和社交 API 失败的降级行为
- Lighthouse/性能结果不得因身份替换出现显著回退
- 最终身份与版权扫描

发布完成后保存 cutover record、回滚 commit、provider dashboard 清单和恢复步骤。

## 更深层 Cloudflare 原生化：后续独立项目

这不应阻塞首发，也不应与内容替换同时进行。建议顺序：

1. ✅ 已将 Bunny storage adapter 替换为 R2 adapter，并保留 rendition 路径与权限合同；Production 与 Staging 使用独立媒体 bucket，只有 `/media/renditions/*` 可公开读取。
2. 评估 Upstash 到 Durable Objects 的严格等价限流。
3. 继续使用 Neon PostgreSQL + Hyperdrive；不为“纯 Cloudflare”提前牺牲 PostgreSQL并发正确性。
4. 把 Sharp/HEIC 处理移到 Cloudflare Containers、Workflows、队列消费者或独立图像服务；不在普通 request Worker 内强行等价实现。
5. 只有在 PostgreSQL 并发合同有经过证明的 D1/Durable Objects 等价设计后，才讨论业务 D1。
6. 每个外围迁移都必须让完整基准套件零回归后才切生产。

## 需要用户参与的节点

实施开始后只在这些地方需要 Matthew：

1. 提供个人内容和合法资产。
2. 创建或授权第三方服务账号；Secret 由 Matthew 在 dashboard 输入或明确授权操作。
3. 确认 AMA 的商业规则和支付上线。
4. Production 切换前确认 DNS 与真实支付/邮件/日历测试。

除此之外，代码导入、去身份化、测试、预览和文档可以由 Agent 连续完成。
