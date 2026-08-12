export const siteProfile = {
  name: {
    zh: '老苗',
    en: 'Matthew Miao',
    displayEn: 'Matthew',
  },
  email: 'hi@fengtalk.ai',
  domain: 'matthew-miao.com',
  copyright: {
    year: 2026,
    zh: '老苗 / Matthew Miao',
    en: 'Matthew Miao',
  },
  bio: {
    zh: 'Web coding、AI Agent、自动化、outreach 与企业知识系统。',
    en: 'Web coding, AI agents, automation, outreach, and company knowledge systems.',
  },
  location: {
    city: 'Brisbane',
    country: 'Australia',
    timeZone: 'Australia/Brisbane',
    utcLabel: 'UTC+10',
    latitude: '27.4698° S',
    longitude: '153.0251° E',
  },
  links: {
    githubUsername: 'matthew6688',
    fengtalk: 'https://fengtalk.ai',
    uchat: 'https://uchat.au',
    calcomBooking: 'https://cal.com/matthew-miao/ama',
    x: {
      handle: 'fengtalk_ai',
      url: 'https://x.com/fengtalk_ai',
    },
    wechatService: {
      searchName: 'matthewmiao',
      qrImage: '/images/social/wechat-service-matthewmiao.png',
    },
    wechatSubscription: {
      searchName: 'fengtalk.ai',
      qrImage: '/images/social/wechat-subscription-fengtalk.png',
    },
    youtube: null,
    telegram: null,
    xiaohongshu: null,
  },
  experience: [
    {
      company: 'UChat',
      companyEn: 'UChat',
      role: '首席营销官',
      roleEn: 'Chief Marketing Officer',
      from: 2020,
      url: 'https://uchat.au',
    },
  ],
  projects: [
    {
      name: 'FengTalk.ai',
      nameEn: 'FengTalk.ai',
      description: '探索 Web coding、AI Agent、outreach 与企业知识如何变成真正运行的自动化系统。',
      descriptionEn: 'Hands-on explorations in web coding, AI agents, outreach, and company knowledge systems.',
      url: 'https://fengtalk.ai',
      icon: '/images/projects/fengtalk.svg',
      domain: 'fengtalk.ai',
    },
  ],
  features: {
    personalShelves: false,
  },
} as const
