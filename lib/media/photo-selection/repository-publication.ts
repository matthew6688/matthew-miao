import 'server-only'

import { z } from 'zod'

import repositoryCatalog from '~/content/photos/catalog.json'

import type { PublicPhotoSelection } from './repository'

const idSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
const fileNameSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*-[1-9][0-9]*\.jpg$/)
const profileWidths = [640, 1024, 1600, 2560] as const

const catalogSchema = z.object({
  version: z.literal(1),
  revision: z.string().min(1),
  publishedAt: z.string().datetime({ offset: true }).nullable(),
  items: z.array(
    z.object({
      id: idSchema,
      published: z.boolean(),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
      altText: z.object({
        zhHans: z.string().trim().min(1),
        en: z.string().trim().min(1),
      }),
      rights: z.literal('owned'),
      importedAt: z.string().datetime({ offset: true }),
      focalPoint: z
        .object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) })
        .optional(),
      renditions: z.array(
        z.object({
          profileWidth: z.number().int().positive(),
          fileName: fileNameSchema,
          width: z.number().int().positive(),
          height: z.number().int().positive(),
          checksumSha256: z.string().regex(/^[a-f0-9]{64}$/),
        }),
      ).length(profileWidths.length),
    }),
  ),
})

export function repositoryCatalogToSelection(input: unknown): PublicPhotoSelection | null {
  const result = catalogSchema.safeParse(input)
  if (!result.success) throw new Error('Invalid repository photo catalog')

  const catalog = result.data
  const ids = new Set<string>()
  for (const item of catalog.items) {
    if (ids.has(item.id)) throw new Error('Invalid repository photo catalog')
    ids.add(item.id)
    if (
      new Set(item.renditions.map(({ profileWidth }) => profileWidth)).size !==
        profileWidths.length ||
      item.renditions.some(
        ({ profileWidth, fileName }) =>
          !profileWidths.includes(profileWidth as (typeof profileWidths)[number]) ||
          fileName !== `${item.id}-${profileWidth}.jpg`,
      ) ||
      item.renditions.some(
        ({ width, height }) =>
          Math.abs(width / height - item.width / item.height) > 0.003,
      )
    ) {
      throw new Error('Invalid repository photo catalog')
    }
  }

  const published = catalog.items.filter(({ published }) => published)
  if (published.length === 0) return null
  if (!catalog.publishedAt) throw new Error('Invalid repository photo catalog')

  return {
    revision: catalog.revision,
    publishedAt: new Date(catalog.publishedAt),
    count: published.length,
    items: published.map(({ published: _published, renditions, focalPoint, rights: _rights, importedAt: _importedAt, ...item }) => ({
      ...item,
      focalPoint: focalPoint ?? { x: 0.5, y: 0.5 },
      renditions: renditions.map(({ fileName, checksumSha256: _checksum, ...rendition }) => ({
        ...rendition,
        src: `/images/photos/${item.id}/${fileName}`,
      })),
    })),
  }
}

export function getRepositoryPhotoSelection() {
  return repositoryCatalogToSelection(repositoryCatalog)
}
