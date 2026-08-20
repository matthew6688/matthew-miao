# cali.so 书架、唱片与项目功能调研

调研日期：2026-08-20

调研对象：[CaliCastle/cali.so](https://github.com/CaliCastle/cali.so) 与 [cali.so](https://cali.so) 公开页面

Matthew 站锁定上游：[`9d9b4926e665a9b8f49135a2a7c5945bd9d87a7e`](https://github.com/CaliCastle/cali.so/tree/9d9b4926e665a9b8f49135a2a7c5945bd9d87a7e)
本次核查时上游 `main`：[`5f657390b9ffb3bc047e8b8da11d12de306f582e`](https://github.com/CaliCastle/cali.so/tree/5f657390b9ffb3bc047e8b8da11d12de306f582e)（2026-08-15；比锁定基线多 19 个 commit）

## 结论

原模板确实同时有音乐和书：Cali 首页把 14 张唱片放在“循环播放中 / On rotation”，把 15 本书放在“珍藏书架 / Books I Love”；只要对应数组为空，整个区块就不会渲染。当前线上首页也公开显示这两个标题。[首页条件渲染源码](https://github.com/CaliCastle/cali.so/blob/5f657390b9ffb3bc047e8b8da11d12de306f582e/app/_views/home-page.tsx#L174-L193)、[线上首页](https://cali.so)

Matthew 最值得先借鉴的是“喜欢看的书”，同时把若干本人公开 GitHub 仓库加入现有项目页：

1. 书架能表达长期兴趣，比复制 Cali 的唱片口味更贴合个人站。
2. 项目页原生支持 GitHub 外链；上游自己就把两个 GitHub 仓库作为普通项目展示，因此 Matthew 的原创项目不需要新页面或 GitHub 自动同步。[项目注册表](https://github.com/CaliCastle/cali.so/blob/5f657390b9ffb3bc047e8b8da11d12de306f582e/lib/projects.ts#L40-L84)、[线上项目页](https://cali.so/projects)
3. 书、唱片和项目的组件结构可以继续复用；Cali 的个人选择、说明、封面和项目图不能照搬。

项目策展采用 Matthew 已确认的硬规则：**只展示原创项目**。GitHub 标记为 fork 的普通派生仓库不列为 Matthew 的作品；仅仅公开源码也不等于开源，只有仓库包含明确的开放源代码许可证时，网站才把它称为“开源项目”。GitHub 官方说明，公开仓库要真正成为 open source 必须授予他人使用、修改和分发代码的许可证；没有许可证时默认版权法生效，作者保留全部权利。[GitHub Docs：Licensing a repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository)

## 三个功能实际是什么

| 功能 | 页面与行为 | 数据来源 | 推荐复用方式 |
| --- | --- | --- | --- |
| 唱片架 | 首页横向重叠唱片套；支持点击、键盘、触摸拖动和横向滚轮；选中项下方链接 Apple Music | `lib/personal.ts` 中的 `records` 静态数组 | 组件保留，等 Matthew 提供真实音乐清单后再启用 |
| 书架 | 首页 3D 手风琴书架；一次展开一本，支持方向键/Home/End；选中项下方链接出版方或作者页面 | `lib/personal.ts` 中的 `books` 静态数组 | 优先启用；先收集 6–10 本本人确实喜欢的书 |
| 项目 | `/projects` 与 `/en/projects` 双语列表；首页卡片自动显示项目数量；外链新标签打开 | `lib/projects.ts` 静态注册表 | 把精选 GitHub 仓库与真实产品放在同一列表，不做全量自动抓取 |
| GitHub 卡 | 首页介绍和 footer 的 GitHub hover card，显示 26 周热力图、全年贡献数和 followers，并链接个人主页 | 上游运行时 API + committed JSON fallback | 与项目列表分开；Matthew 站继续用构建期/提交快照，避免共享 chrome 的运行时缓存风险 |

上游唱片架的交互和空数组退出点见 [`components/vinyl-shelf.tsx`](https://github.com/CaliCastle/cali.so/blob/5f657390b9ffb3bc047e8b8da11d12de306f582e/components/vinyl-shelf.tsx#L603-L747)，书架的键盘语义、空数组退出和外链见 [`components/bookshelf.tsx`](https://github.com/CaliCastle/cali.so/blob/5f657390b9ffb3bc047e8b8da11d12de306f582e/components/bookshelf.tsx#L455-L603)。项目页面由注册表逐项渲染名称、域名、双语描述和本地图标，[内部路径使用本地化路由，外部路径使用新标签](https://github.com/CaliCastle/cali.so/blob/5f657390b9ffb3bc047e8b8da11d12de306f582e/app/_views/projects-page.tsx#L39-L85)。

## 数据结构

### 书

上游 [`Book`](https://github.com/CaliCastle/cali.so/blob/5f657390b9ffb3bc047e8b8da11d12de306f582e/lib/personal.ts#L51-L69) 字段：

| 字段 | 用途 |
| --- | --- |
| `title`, `author`, `year`, `category` | 书的公共信息 |
| `spineTitle`, `spineAuthor` | 可选的窄书脊缩写 |
| `spineColor`, `spineInk` | 书脊底色与文字色 |
| `art` | 可选本地封面；省略时组件生成文字封面 |
| `coverWidth`, `coverHeight` | 可选封面原始比例，用于无裁切展开 |
| `spine` | 可选书脊宽度，源码建议 18–38 px |
| `url` | 可选外部详情/购买链接 |

### 唱片

上游 [`Record_`](https://github.com/CaliCastle/cali.so/blob/5f657390b9ffb3bc047e8b8da11d12de306f582e/lib/personal.ts#L21-L32) 字段为 `artist`、`album`、`year`、`genre`、`spineColor`、`spineInk`，并可选 `art` 与 `url`。封面缺失时组件也能生成纯文字唱片套，而不是要求一定复制第三方封面。

### 项目

上游 [`Project`](https://github.com/CaliCastle/cali.so/blob/5f657390b9ffb3bc047e8b8da11d12de306f582e/lib/projects.ts#L1-L10) 字段：

| 字段 | 用途 |
| --- | --- |
| `name`, `nameEn` | 中英文项目名 |
| `description`, `descriptionEn` | 中英文一句话介绍；英文可回退中文 |
| `url` | GitHub、产品官网或站内路径 |
| `icon` | 本地 36×36 项目图标资源 |
| `domain` | 列表中显示的来源域名，例如 `github.com` |

首页项目卡的数量直接来自 `projects.length`，[不需要额外维护数字](https://github.com/CaliCastle/cali.so/blob/5f657390b9ffb3bc047e8b8da11d12de306f582e/components/nav-cards.tsx#L83-L88)。

## GitHub 项目与 GitHub 卡不是一回事

项目页没有调用 GitHub API，也不会自动列出 pinned repositories。它只是一个由站点所有者策展的静态项目注册表；GitHub 仓库只需把 `url` 指向仓库、`domain` 写成 `github.com`，并配一个本人可用的项目图标。上游目前的 ChatGPT Slack Bot 与 PopMenu 就采用这种模式。[源码示例](https://github.com/CaliCastle/cali.so/blob/5f657390b9ffb3bc047e8b8da11d12de306f582e/lib/projects.ts#L40-L84)

GitHub hover card 是另一条链路。上游通过 GitHub 用户 API和一个第三方 contributions API取 followers 与贡献热力图，失败时回退到 `content/github.json`；卡片只显示 26 周热力图，但统计数字是过去一年。[抓取逻辑](https://github.com/CaliCastle/cali.so/blob/5f657390b9ffb3bc047e8b8da11d12de306f582e/lib/social-live.ts#L19-L46)、[卡片结构](https://github.com/CaliCastle/cali.so/blob/5f657390b9ffb3bc047e8b8da11d12de306f582e/components/social-cards.tsx#L18-L29)、[热力图与统计](https://github.com/CaliCastle/cali.so/blob/5f657390b9ffb3bc047e8b8da11d12de306f582e/components/social-cards.tsx#L224-L255)

上游还提供 [`scripts/refresh-github.mjs`](https://github.com/CaliCastle/cali.so/blob/5f657390b9ffb3bc047e8b8da11d12de306f582e/scripts/refresh-github.mjs#L1-L30)，可把抓取结果校验后写回 committed fallback；它仍不会替项目页挑选仓库。

对 Matthew 的建议是：

- 项目页只展示 4–8 个代表性仓库/产品，不因 GitHub API 排序变化而自动改版。
- 候选仓库必须先通过原创性门禁：排除 GitHub API 中 `fork: true` 的普通 fork、镜像、教程照抄、模板复制和只改配置的部署仓库。GitHub 官方把 fork 定义为“从另一个 upstream repository 的副本开始，并继续与 upstream 相连”的仓库，因此普通 fork 不能直接作为 Matthew 原创项目陈列。[GitHub Docs：About forks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/about-forks)
- “原创”与“开源”分开核验：原创项目仍需 `LICENSE` 或 GitHub 可识别的 license 才写“开源”；无许可证的本人原创 public repo 可以作为普通项目展示，但不得写成开源项目。
- 每个项目由 Agent 根据 README 写一条准确的中英文简介，并优先使用仓库自带且许可允许的 logo；没有 logo 时制作不含第三方商标的中性项目图标。
- GitHub 卡使用经构建或手动刷新的 committed snapshot，不把有限时效的外部抓取放回所有页面共享的运行时 chrome。这符合本站现有 production cache safety 约束。

## 锁定版本与当前上游差异

书架、唱片数据和两个互动组件在 Matthew 锁定 commit 与 2026-08-20 核查到的上游 `main` 之间没有变化。项目功能只有两项相关更新：

- 上游新增一个站内项目 Cali Baby，使线上数量从锁定版本的 7 个变成当前 8 个。[当前注册表](https://github.com/CaliCastle/cali.so/blob/5f657390b9ffb3bc047e8b8da11d12de306f582e/lib/projects.ts#L12-L21)
- 项目页增加站内 `url` 识别：以 `/` 开头时使用本地化内部导航，否则仍为外部新标签。[当前渲染逻辑](https://github.com/CaliCastle/cali.so/blob/5f657390b9ffb3bc047e8b8da11d12de306f582e/app/_views/projects-page.tsx#L47-L80)

Matthew 现在要增加 GitHub 外链项目，并不依赖这次上游改动；只有未来增加本站内部项目详情页时，才需要单独评估同步内部导航支持。

## Matthew 站当前准备度

- `lib/personal.ts` 已保留同一 `Book` 与 `Record_` schema，但两个数组为空。
- `lib/site-profile.ts` 的 `features.personalShelves` 当前为 `false`；首页还同时要求数组非空，因此不会出现空书架。
- `siteProfile.projects` 已发布 FengTalk.ai，继续添加条目即可复用现有 `/projects` 设计与首页自动计数。
- GitHub hover card 已指向 `matthew6688`，但任何贡献快照都应来自 Matthew 本人的可验证公开数据，不应继续使用上游人的热力图数据作视觉填充。

因此“书架 + 精选 GitHub 项目”主要是内容与合法素材录入，不需要重做 UI。

## 内容和素材边界

上游 MIT 许可只覆盖原创应用源码，明确排除个人写作、照片、艺术、身份、品牌和第三方资产；这些内容不能因为在公开仓库里就直接复制。[LICENSE 的内容与资产例外](https://github.com/CaliCastle/cali.so/blob/5f657390b9ffb3bc047e8b8da11d12de306f582e/LICENSE#L23-L30)、[README 的 fork 要求](https://github.com/CaliCastle/cali.so/blob/5f657390b9ffb3bc047e8b8da11d12de306f582e/README.md#L153-L163)

尤其注意：

- Cali 的书单与唱片单是个人口味数据，Matthew 只有真的喜欢同一本书/唱片时才可独立选择同一项目，不能整批复制。
- 上游把封面记录为 Apple Music、出版社、作者或零售商提供的 promotional artwork，但来源记录本身不是复用授权；上游也明确说外部标志的 sourcing decision 不是通用授权。[封面来源表](https://github.com/CaliCastle/cali.so/blob/5f657390b9ffb3bc047e8b8da11d12de306f582e/docs/asset-sources.md#L1-L4)、[权利说明](https://github.com/CaliCastle/cali.so/blob/5f657390b9ffb3bc047e8b8da11d12de306f582e/docs/asset-sources.md#L19-L32)
- 不复制 `public/images/books/*`、`public/images/records/*` 或 Cali 的项目图。
- 最保守的首发方案是先省略 `art`，使用组件自带的文字封面；若加入封面，应为每一项保存来源 URL、获取日期、允许的用途或许可证证据。
- GitHub 项目描述可基于仓库 README 做简短事实性改写；不要复制大段 README、截图、logo 或第三方品牌资产。项目图标应遵守对应仓库许可证与品牌规范。

## 建议实施顺序

1. Matthew 给出 6–10 本真正喜欢、愿意公开的书：书名、作者、是否读完、希望链接到哪里；不需要先提供封面。
2. 从 `matthew6688` 公开仓库中人工确认 4–8 个代表项目；Agent 读取 README 后生成中英文一句话介绍，Matthew 只需确认是否确实希望公开关联。
3. 先用文字书封与自有/中性项目图标部署 Preview，检查中英文、移动端、键盘和 reduced-motion。
4. 只有在来源和使用条件明确后再补真实书封；唱片架继续关闭，直到 Matthew 提供真实音乐清单。

这条路线保留上游 1:1 的交互设计，同时不引入 Cali 的个人内容或未经确认的第三方封面。

其中第 2 步的机器筛选顺序应固定为：`fork === false` → 能从 README/commit history 证明是 Matthew 原创 → 检查许可证 → 才进入人工确认。未通过任一步的仓库不自动发布。
