import { upstreamLinkMediaUrl } from '~/lib/link-media'

// Link media are small; the cap defends the data cache against a
// pathological upstream response.
const MAX_MEDIA_BYTES = 4 * 1024 * 1024

// Link favicons and Open Graph images are optional. This route deliberately
// avoids the Next runtime data cache: browser/edge response headers provide
// bounded caching without introducing an expiry rebuild into Worker execution.
async function fetchLinkMedia(upstream: string) {
  let media: { body: Uint8Array<ArrayBuffer>; contentType: string } | null = null

  try {
    const res = await fetch(upstream, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    })
    const contentType = res.headers.get('content-type')?.trim() ?? ''

    // Reject an oversized *declared* length before buffering the body at
    // all; an absent or non-numeric header falls through to the
    // post-buffer check below.
    const declaredLength = Number(res.headers.get('content-length'))
    const declaredLengthIsSafe =
      !Number.isFinite(declaredLength) || declaredLength <= MAX_MEDIA_BYTES

    if (
      res.ok &&
      contentType.toLowerCase().startsWith('image/') &&
      declaredLengthIsSafe
    ) {
      const body = new Uint8Array(await res.arrayBuffer())
      if (body.byteLength && body.byteLength <= MAX_MEDIA_BYTES) {
        media = { body, contentType }
      }
    }
  } catch {
    // Network failures, timeouts, and interrupted bodies are expected for
    // optional third-party media. The missing-media response below is the
    // observable contract.
  }

  if (!media) {
    return null
  }

  return media
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ kind: string }> },
) {
  const { kind } = await params
  const target = new URL(request.url).searchParams.get('url')
  const upstream = target ? upstreamLinkMediaUrl(kind, target) : null
  if (!upstream) {
    // cacheable briefly so probe traffic doesn't re-hit the server
    return new Response('Not found', {
      status: 404,
      headers: { 'Cache-Control': 'public, max-age=300' },
    })
  }

  const media = await fetchLinkMedia(upstream)
  if (!media) {
    // A missing asset keeps the existing non-blocking <img> error path
    // without turning an optional upstream failure into a production 5xx.
    return new Response('Not found', {
      status: 404,
      headers: { 'Cache-Control': 'public, max-age=60' },
    })
  }

  return new Response(media.body, {
    headers: {
      'Content-Type': media.contentType,
      // browsers keep a copy for a day, the CDN for a week (serving
      // stale while the next origin request refreshes it). The strict
      // media CSP (sandbox) comes from next.config.ts, which already
      // sends the global security headers — setting it here as well
      // would emit a duplicate Content-Security-Policy header.
      'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800',
    },
  })
}
