import { isPostSlug } from '~/lib/content'
import { bundledAssets } from '~/lib/generated-worker-content'
import type { Locale } from '~/lib/locale-route'
import { isArchivedNewsletterId } from '~/lib/newsletters'
import type { PublicSection } from '~/lib/public-page-metadata'

const PUBLIC_SECTIONS = new Set<PublicSection>(['ama', 'blog', 'photos', 'projects'])
function isLocale(value: string | null): value is Locale {
  return value === 'zh' || value === 'en'
}

function staticImage(key: string) {
  const source = bundledAssets[`/generated-og/${key}.png` as keyof typeof bundledAssets]
  if (!source) return new Response('Not found', { status: 404 })
  return new Response(Uint8Array.from(Buffer.from(source, 'base64')), {
    headers: {
      'content-type': 'image/png',
      'cache-control': 'public, max-age=0, s-maxage=31536000, immutable',
    },
  })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const locale = searchParams.get('locale')
  const path = searchParams.get('path')

  if (!isLocale(locale) || !path?.startsWith('/')) {
    return new Response('Not found', { status: 404 })
  }

  if (path === '/') return staticImage(`${locale}-home`)

  const segments = path.split('/').filter(Boolean)
  const section = segments[0]

  if (section === 'blog' && segments.length === 2 && isPostSlug(segments[1])) {
    return staticImage(`${locale}-blog-${segments[1]}`)
  }

  if (
    section === 'newsletters' &&
    segments.length === 2 &&
    isArchivedNewsletterId(segments[1])
  ) {
    return staticImage(`${locale}-newsletter-${segments[1]}`)
  }

  if (PUBLIC_SECTIONS.has(section as PublicSection)) {
    return staticImage(`${locale}-${section}`)
  }

  return new Response('Not found', { status: 404 })
}
