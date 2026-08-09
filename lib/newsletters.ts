import matter from 'gray-matter'
import { z } from 'zod'

import { type ArchivedNewsletterId as PublicArchivedNewsletterId } from './public-content-routes'
import { bundledNewsletters } from './generated-worker-content'

export {
  archivedNewsletterIds,
  isArchivedNewsletterId,
} from './public-content-routes'

export type ArchivedNewsletterId = PublicArchivedNewsletterId

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

  const raw = bundledNewsletters[id].zh
  const { data, content } = matter(raw)
  const frontmatter = newsletterFrontmatterSchema.parse(data)
  const englishRaw = bundledNewsletters[id].en
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
