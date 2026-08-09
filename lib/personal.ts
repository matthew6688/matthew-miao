import { siteProfile } from './site-profile'

// The personal registry — the one file to edit when life moves on.
// Sources: Matthew's content intake; see docs/content/site-profile-draft.md.

export interface Experience {
  company: string
  companyEn: string
  role: string
  roleEn?: string
  from: number
  to?: number
  url?: string
}

export const experience: Experience[] = [...siteProfile.experience]

export interface Record_ {
  artist: string
  album: string
  year: number
  genre: string
  spineColor: string
  spineInk: string
  url?: string
  /** optional sleeve art dropped into public/images/records/ */
  art?: string
}

// Keep shelves empty until Matthew supplies a personal list and licensed artwork.
export const records: Record_[] = []

export interface Book {
  title: string
  author: string
  year: number
  category: string
  spineTitle?: string
  spineAuthor?: string
  spineColor: string
  spineInk: string
  /** cover image in public/images/books/ */
  art?: string
  /** intrinsic cover dimensions; the shelf derives its uncropped display width */
  coverWidth?: number
  coverHeight?: number
  /** spine width in px (18–38 looks right) */
  spine?: number
  url?: string
}

export const books: Book[] = []
