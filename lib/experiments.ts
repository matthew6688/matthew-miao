import type { ProjectSlug } from './projects'

export const experimentSlugs = ['youtube-channel', 'classroom-randomizer'] as const

export type ExperimentSlug = (typeof experimentSlugs)[number]
export type ExperimentCategory = 'content' | 'software'
export type ExperimentStatus = 'active' | 'building'

export interface Experiment {
  slug: ExperimentSlug
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  hypothesis: string
  hypothesisEn: string
  category: ExperimentCategory
  categoryLabel: string
  categoryLabelEn: string
  status: ExperimentStatus
  statusLabel: string
  statusLabelEn: string
  tags: readonly string[]
  tagsEn: readonly string[]
  cover: string
  shelfColor: string
  shelfInk: string
  productSlug?: ProjectSlug
}

export const experiments: readonly Experiment[] = [
  {
    slug: 'youtube-channel',
    name: 'YouTube 频道',
    nameEn: 'YouTube Channel',
    description: '持续制作视频，验证内容能否形成可重复的受众增长和收入来源。',
    descriptionEn: 'Publishing videos to test whether content can become a repeatable source of audience growth and revenue.',
    hypothesis: '稳定发布并持续复盘选题、制作与分发，可能逐步形成可以积累的内容资产。',
    hypothesisEn: 'Consistent publishing and review of topics, production, and distribution may compound into a durable content asset.',
    category: 'content',
    categoryLabel: '内容',
    categoryLabelEn: 'Content',
    status: 'active',
    statusLabel: '进行中',
    statusLabelEn: 'Active',
    tags: ['YouTube', '视频'],
    tagsEn: ['YouTube', 'Video'],
    cover: '/images/showcases/experiments/youtube-channel-cover.svg',
    shelfColor: '#b5402d',
    shelfInk: '#f7f4ed',
  },
  {
    slug: 'classroom-randomizer',
    name: '课堂随机抽选工具',
    nameEn: 'Classroom Randomizer',
    description: '一个面向学校老师的轻量随机抽选工具，帮助课堂快速、公平地完成点名与选择。',
    descriptionEn: 'A lightweight random selection tool for teachers to make quick, fair classroom picks.',
    hypothesis: '一个足够简单、打开就能用的教师工具，可能通过真实课堂场景找到稳定需求。',
    hypothesisEn: 'A simple tool that works immediately may find durable demand through real classroom use.',
    category: 'software',
    categoryLabel: '软件',
    categoryLabelEn: 'Software',
    status: 'building',
    statusLabel: '正在构建',
    statusLabelEn: 'Building',
    tags: ['教师工具', '随机抽选'],
    tagsEn: ['Teacher tool', 'Randomizer'],
    cover: '/images/showcases/experiments/classroom-randomizer-cover.svg',
    shelfColor: '#d5b738',
    shelfInk: '#171713',
  },
] as const

export function isExperimentSlug(value: string): value is ExperimentSlug {
  return experimentSlugs.includes(value as ExperimentSlug)
}

export function getExperimentBySlug(slug: ExperimentSlug): Experiment {
  const experiment = experiments.find((entry) => entry.slug === slug)
  if (!experiment) throw new Error(`Unknown experiment slug: ${slug}`)
  return experiment
}
