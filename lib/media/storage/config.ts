import { z } from 'zod'

const mediaPublicBaseUrl = z.url().transform((value, context) => {
  const url = new URL(value)
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/media/'
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Media public base URL must be an HTTPS /media/ route',
    })
    return z.NEVER
  }
  return url
})

export function parseMediaPublicBaseUrl(
  source: Record<string, string | undefined>,
) {
  const result = mediaPublicBaseUrl.safeParse(source.MEDIA_PUBLIC_BASE_URL)
  if (result.success) return result.data
  throw new Error('Invalid Media environment: MEDIA_PUBLIC_BASE_URL')
}
