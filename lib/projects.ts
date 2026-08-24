import { siteProfile } from './site-profile'

// Project registry ported from v1's Sanity data. Edit freely.
export interface Project {
  slug: string
  name: string
  nameEn: string
  description: string
  descriptionEn?: string
  url: string
  icon: string
  domain: string
  category: string
  categoryEn: string
  status: 'live'
  shelfColor: string
  shelfInk: string
}

export const projects: Project[] = [...siteProfile.projects]

export type ProjectSlug = (typeof siteProfile.projects)[number]['slug']

export function isProjectSlug(value: string): value is ProjectSlug {
  return projects.some((project) => project.slug === value)
}

export function getProjectBySlug(slug: ProjectSlug): Project {
  const project = projects.find((entry) => entry.slug === slug)
  if (!project) throw new Error(`Unknown product slug: ${slug}`)
  return project
}
