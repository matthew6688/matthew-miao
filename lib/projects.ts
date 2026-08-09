// Project registry ported from v1's Sanity data. Edit freely.
export interface Project {
  name: string
  nameEn: string
  description: string
  descriptionEn?: string
  url: string
  icon: string
  domain: string
}

export const projects: Project[] = [
  {
    name: 'FengTalk.ai',
    nameEn: 'FengTalk.ai',
    description: '探索 Web coding、AI Agent、outreach 与企业知识如何变成真正运行的自动化系统。',
    descriptionEn: 'Hands-on explorations in web coding, AI agents, outreach, and company knowledge systems.',
    url: 'https://fengtalk.ai',
    icon: '/images/projects/fengtalk.svg',
    domain: 'fengtalk.ai',
  },
]
