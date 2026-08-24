import { describe, expect, it } from 'vitest'

import { publicPageMetadata } from './public-page-metadata'

describe('public page metadata copy', () => {
  it('uses a timeless homepage title and removes the repeated name from OG artwork', () => {
    expect(publicPageMetadata.home).toEqual({
      zh: {
        title: '老苗',
        description: 'Web coding、AI Agent、自动化、outreach 与企业知识系统。',
        ogDescription: 'Web coding、AI Agent、自动化、outreach 与企业知识系统。',
      },
      en: {
        title: 'Matthew Miao',
        description: 'Web coding, AI agents, automation, outreach, and company knowledge systems.',
        ogDescription: 'Web coding, AI agents, automation, outreach, and company knowledge systems.',
      },
    })
  })

  it('keeps each public section localized and content-specific', () => {
    expect(publicPageMetadata.blog).toEqual({
      zh: {
        title: '写作',
        description: '老苗关于 Web coding、AI Agent、自动化、outreach 与企业知识系统的实践记录。',
      },
      en: {
        title: 'Writing',
        description:
        'Notes by Matthew on web coding, AI agents, automation, outreach, and company knowledge systems.',
      },
    })
    expect(publicPageMetadata.photos).toEqual({
      zh: { title: '照片', description: '老苗在工作、生活和旅途中留下的一些瞬间。' },
      en: {
        title: 'Photos',
        description: 'Moments Matthew has kept from work, life, and everywhere in between.',
      },
    })
    expect(publicPageMetadata['build-in-public']).toEqual({
      zh: {
        title: '公开构建',
        description: '记录我把技能、知识和自动化做成产品的真实尝试：假设、上线、获客、结果与失败。',
      },
      en: {
        title: 'Build in Public',
        description:
          'An honest record of turning my skills, knowledge, and automation into products: bets, launches, distribution, results, and failures.',
      },
    })
    expect(publicPageMetadata.projects).toEqual({
      zh: {
        title: '产品',
        description: '我长期维护的软件产品：从外贸数据、AI 获客到可审核的销售外联工作流。',
      },
      en: {
        title: 'Products',
        description:
          'Software products I maintain across trade data, AI-powered growth, and reviewable sales outreach.',
      },
    })
    expect(publicPageMetadata.ama).toEqual({
      zh: {
        title: '一对一',
        description:
          '从产品设计、工程、职业到独立开发、创业、出海、英语学习与 AI 工作流，用一小时聊清楚怎么判断、怎么取舍、下一步做什么。',
      },
      en: {
        title: 'AMA',
        description:
          'A one-to-one conversation about AI-native work, product strategy, engineering, startups, career moves, and building products.',
      },
    })
  })

  it('keeps section descriptions within social preview budgets', () => {
    for (const section of ['blog', 'build-in-public', 'photos', 'projects', 'ama'] as const) {
      expect(publicPageMetadata[section].zh.description.length, section).toBeLessThanOrEqual(80)
      expect(publicPageMetadata[section].en.description.length, section).toBeLessThanOrEqual(160)
    }
  })
})
