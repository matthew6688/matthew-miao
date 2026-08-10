export type LinkPreviewProviderEndpoint = 'metadata' | 'favicon' | 'image'

export interface LinkPreviewSnapshot {
  domain: string
  title?: string
  titleEn?: string
  description?: string
  descriptionEn?: string
  hasImage?: boolean
}

export function linkPreviewProviderUrl(
  endpoint: LinkPreviewProviderEndpoint,
  target: string,
): string | null

export function normalizeOgMetadata(
  target: string,
  metadata: unknown,
  previous?: LinkPreviewSnapshot,
): LinkPreviewSnapshot | undefined
