import { siteProfile } from './site-profile'

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

export const projects: Project[] = [...siteProfile.projects]
