import { readFileSync } from 'node:fs'
import path from 'node:path'

import matter from 'gray-matter'
import { z } from 'zod'

import { type ArchivedNewsletterId as PublicArchivedNewsletterId } from './public-content-routes'

export {
  archivedNewsletterIds,
  isArchivedNewsletterId,
} from './public-content-routes'

export type ArchivedNewsletterId = PublicArchivedNewsletterId

const NEWSLETTERS_DIR = path.join(process.cwd(), 'content/newsletters')

const newsletterFrontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
})

export const archivedNewsletterImages: Record<
  string,
  { width: number; height: number }
> = {}

export type ArchivedNewsletter = {
  id: ArchivedNewsletterId
  title: string
  description: string
  titleEn: string
  descriptionEn: string
  body: string
  bodyEn: string
}

const archivedNewsletterCache = new Map<
  ArchivedNewsletterId,
  ArchivedNewsletter
>()

export function getArchivedNewsletter(
  id: ArchivedNewsletterId,
): ArchivedNewsletter {
  const cached = archivedNewsletterCache.get(id)
  if (cached) return cached

  const raw = readFileSync(path.join(NEWSLETTERS_DIR, id, 'index.mdx'), 'utf8')
  const { data, content } = matter(raw)
  const frontmatter = newsletterFrontmatterSchema.parse(data)
  const englishRaw = readFileSync(
    path.join(NEWSLETTERS_DIR, id, 'index.en.mdx'),
    'utf8',
  )
  const { data: englishData, content: englishContent } = matter(englishRaw)
  const englishFrontmatter = newsletterFrontmatterSchema.parse(englishData)

  const newsletter = {
    id,
    ...frontmatter,
    titleEn: englishFrontmatter.title,
    descriptionEn: englishFrontmatter.description,
    body: content,
    bodyEn: englishContent,
  }

  archivedNewsletterCache.set(id, newsletter)
  return newsletter
}
