import { createHash } from 'node:crypto'

import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { MediaStorageError } from './errors'
import { createR2MediaStorage } from './r2'

function fakeBucket() {
  return {
    delete: vi.fn(async () => undefined),
    get: vi.fn(),
    head: vi.fn(),
    put: vi.fn(async (key: string, bytes: Uint8Array, options: unknown) => ({
      key,
      size: bytes.byteLength,
      uploaded: new Date('2026-08-09T00:00:00.000Z'),
      httpMetadata: (options as { httpMetadata: object }).httpMetadata,
    })),
  }
}

describe('Cloudflare R2 Media Storage', () => {
  it('stores protected Originals with SHA-256 integrity and HTTP metadata', async () => {
    const bucket = fakeBucket()
    const storage = createR2MediaStorage({
      bucket,
      publicBaseUrl: new URL('https://matthew-miao.com/media/'),
    })
    const bytes = new TextEncoder().encode('private image bytes')
    const checksumSha256 = createHash('sha256').update(bytes).digest('hex')

    await storage.storeOriginal({
      key: 'originals/asset_01/revision_01.heic',
      bytes,
      contentType: 'image/heic',
      checksumSha256,
    })

    expect(bucket.put).toHaveBeenCalledWith(
      'originals/asset_01/revision_01.heic',
      bytes,
      {
        httpMetadata: { contentType: 'image/heic' },
        sha256: expect.any(ArrayBuffer),
      },
    )
    const options = bucket.put.mock.calls[0]?.[2]
    expect(
      Buffer.from((options as { sha256: ArrayBuffer }).sha256),
    ).toEqual(Buffer.from(checksumSha256, 'hex'))
  })

  it('keeps Rendition URLs immutable and inside the public media route', async () => {
    const bucket = fakeBucket()
    const storage = createR2MediaStorage({
      bucket,
      publicBaseUrl: new URL('https://matthew-miao.com/media/'),
    })
    const bytes = new TextEncoder().encode('public jpeg bytes')
    const checksumSha256 = createHash('sha256').update(bytes).digest('hex')
    const key = `renditions/asset_01/1600-${checksumSha256}.jpg`

    await expect(
      storage.storeRendition({
        key,
        bytes,
        checksumSha256,
        contentType: 'image/jpeg',
      }),
    ).resolves.toBe(`https://matthew-miao.com/media/${key}`)
  })

  it('normalizes missing and unavailable R2 reads without provider details', async () => {
    const missingBucket = fakeBucket()
    missingBucket.head.mockResolvedValueOnce(null)
    const missing = createR2MediaStorage({
      bucket: missingBucket,
      publicBaseUrl: new URL('https://matthew-miao.com/media/'),
    })

    await expect(
      missing.inspectOriginal('originals/asset_01/revision_01.heic'),
    ).rejects.toEqual(new MediaStorageError('not_found'))

    const failedBucket = fakeBucket()
    failedBucket.get.mockRejectedValueOnce(new Error('raw R2 account detail'))
    const failed = createR2MediaStorage({
      bucket: failedBucket,
      publicBaseUrl: new URL('https://matthew-miao.com/media/'),
    })
    const read = failed.readRendition('renditions/asset_01/photo.jpg')

    await expect(read).rejects.toEqual(
      new MediaStorageError('provider_unavailable'),
    )
    await expect(read).rejects.not.toThrow(/raw R2 account detail/)
  })

  it('treats R2 deletion as the complete immutable Rendition purge', async () => {
    const bucket = fakeBucket()
    const storage = createR2MediaStorage({
      bucket,
      publicBaseUrl: new URL('https://matthew-miao.com/media/'),
    })
    const key = 'renditions/asset_01/photo.jpg'

    await storage.deleteRendition(key)
    await storage.purgeRendition(key)

    expect(bucket.delete).toHaveBeenCalledOnce()
    expect(bucket.delete).toHaveBeenCalledWith(key)
  })
})
