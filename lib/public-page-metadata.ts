import { siteProfile } from './site-profile'

export const publicPageMetadata = {
  home: {
    zh: {
      title: '老苗',
      description: siteProfile.bio.zh,
      ogDescription: siteProfile.bio.zh,
    },
    en: {
      title: 'Matthew Miao',
      description: siteProfile.bio.en,
      ogDescription: siteProfile.bio.en,
    },
  },
  blog: {
    zh: {
      title: '写作',
      description: '老苗关于 Web coding、AI Agent、自动化、outreach 与企业知识系统的实践记录。',
    },
    en: {
      title: 'Writing',
      description:
        'Notes by Matthew on web coding, AI agents, automation, outreach, and company knowledge systems.',
    },
  },
  'build-in-public': {
    zh: {
      title: '公开构建',
      description: '记录我把技能、知识和自动化做成产品的真实尝试：假设、上线、获客、结果与失败。',
    },
    en: {
      title: 'Build in Public',
      description:
        'An honest record of turning my skills, knowledge, and automation into products: bets, launches, distribution, results, and failures.',
    },
  },
  photos: {
    zh: { title: '照片', description: '老苗在工作、生活和旅途中留下的一些瞬间。' },
    en: {
      title: 'Photos',
      description: 'Moments Matthew has kept from work, life, and everywhere in between.',
    },
  },
  projects: {
    zh: {
      title: '产品',
      description: '我长期维护的软件产品：从外贸数据、AI 获客到可审核的销售外联工作流。',
    },
    en: {
      title: 'Products',
      description: 'Software products I maintain across trade data, AI-powered growth, and reviewable sales outreach.',
    },
  },
  presentations: {
    zh: {
      title: '视频演示',
      description: '我为视频讲解制作的浏览器 Presentation：把产品、实验和思考拆成可以顺着讲清楚的页面。',
    },
    en: {
      title: 'Presentations',
      description:
        'Browser presentations made for my videos—structured walkthroughs of products, experiments, and working ideas.',
    },
  },
  ama: {
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
  },
} as const

export type PublicSection = Exclude<keyof typeof publicPageMetadata, 'home'>
