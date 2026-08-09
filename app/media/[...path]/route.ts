import { MediaStorageError } from '~/lib/media/storage/errors'
import { getMediaStorage } from '~/lib/media/storage/server'

const PUBLIC_RENDITION_KEY =
  /^renditions\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]*[a-f0-9]{64}\.jpg$/

function notFound() {
  return new Response('Not found', {
    status: 404,
    headers: { 'cache-control': 'no-store' },
  })
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const key = (await params).path.join('/')
  if (!PUBLIC_RENDITION_KEY.test(key)) return notFound()

  try {
    const storage = getMediaStorage()
    const metadata = await storage.inspectRendition(key)
    if (metadata.contentType !== 'image/jpeg') return notFound()
    const bytes = await storage.readRendition(key)
    if (bytes.byteLength !== metadata.byteSize) {
      return new Response('Unavailable', {
        status: 503,
        headers: { 'cache-control': 'no-store', 'retry-after': '5' },
      })
    }
    return new Response(bytes, {
      headers: {
        'cache-control': 'public, max-age=31536000, immutable',
        'content-length': String(bytes.byteLength),
        'content-type': 'image/jpeg',
        'last-modified': metadata.lastModified.toUTCString(),
        'x-content-type-options': 'nosniff',
      },
    })
  } catch (error) {
    if (error instanceof MediaStorageError && error.code === 'not_found') {
      return notFound()
    }
    return new Response('Unavailable', {
      status: 503,
      headers: { 'cache-control': 'no-store', 'retry-after': '5' },
    })
  }
}
