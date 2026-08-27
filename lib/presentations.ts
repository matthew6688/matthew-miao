export interface Presentation {
  slug: string
  title: string
  titleEn: string
  description: string
  descriptionEn: string
  publishedAt: Date
}

export const presentations: readonly Presentation[] = [
  {
    slug: 'six-months-two-ai-products',
    title: '半年，两款 AI 产品：我为什么决定开始公开记录',
    titleEn: 'Six months, two AI products—and why I am starting to build in public',
    description: '海关数据分析、AI 虚拟外贸业务员，以及从 Demo 走向生产环境真正困难的部分。',
    descriptionEn:
      'Customs-data analysis, an AI export sales agent, and what actually gets hard after the demo works.',
    publishedAt: new Date('2026-08-27T12:00:00Z'),
  },
  {
    slug: 'youtube-monetization-me-too-me-better',
    title: '做 YouTube 变现，我的第一步是先抄一个能跑通的频道',
    titleEn: 'My first YouTube monetization step: study a channel that already works',
    description: '从 Me Too 到 Me Better：筛选新频道、拆解内容骨架，再用真实数据逐步改进。',
    descriptionEn:
      'From Me Too to Me Better: find a recent channel, unpack its content system, then improve with real data.',
    publishedAt: new Date('2026-08-22T12:00:00Z'),
  },
]

export function presentationPath(slug: string) {
  return `/presentations/${encodeURIComponent(slug)}`
}
