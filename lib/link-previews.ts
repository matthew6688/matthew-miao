import previews from '~/content/link-previews.json'
import { linkMediaPath, upstreamLinkMediaUrl } from '~/lib/link-media'
import type { LinkPreviewSnapshot } from '~/lib/link-preview-provider.mjs'

export interface LinkPreview extends LinkPreviewSnapshot {}

const data = previews as Record<string, LinkPreview>

// Build-time snapshot (content/link-previews.json, maintained by
// scripts/refresh-link-previews.mjs) — an open hover card never waits
// on the network.
export function getLinkPreview(url: string): LinkPreview | undefined {
  return data[url]
}

// Bad links in a post degrade to plain anchors instead of reaching the
// first-party preview service or crashing the build.
// Favicons resolve per site, not per page: only the root domain is
// requested, so a deep link that 404s or redirects can't fail the icon.
// Known targets route through the server-side cache at /link-media. A
// link added before the snapshot refreshes remains a plain anchor until
// `node scripts/refresh-link-previews.mjs` records an allowlisted target.
export function faviconUrl(href: string): string | null {
  let origin: string
  try {
    origin = new URL(href).origin
  } catch {
    return null
  }
  if (upstreamLinkMediaUrl('favicon', origin)) return linkMediaPath('favicon', origin)
  return null
}

export function ogImageUrl(href: string): string | null {
  if (upstreamLinkMediaUrl('image', href)) return linkMediaPath('image', href)
  return null
}
