import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  inspectRendition: vi.fn(),
  readRendition: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('~/lib/media/storage/server', () => ({
  getMediaStorage: () => mocks,
}))

import { GET } from './route'

function request(path: string[]) {
  return GET(new Request(`https://matthew-miao.com/media/${path.join('/')}`), {
    params: Promise.resolve({ path }),
  })
}

describe('public R2 Rendition delivery', () => {
  it('serves only immutable JPEG Renditions with safe response headers', async () => {
    mocks.inspectRendition.mockResolvedValueOnce({
      byteSize: 4,
      contentType: 'image/jpeg',
      lastModified: new Date('2026-08-09T00:00:00.000Z'),
    })
    mocks.readRendition.mockResolvedValueOnce(
      Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]),
    )

    const response = await request([
      'renditions',
      'asset_01',
      `${'a'.repeat(64)}.jpg`,
    ])

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/jpeg')
    expect(response.headers.get('cache-control')).toBe(
      'public, max-age=31536000, immutable',
    )
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    await expect(response.arrayBuffer()).resolves.toHaveProperty('byteLength', 4)
  })

  it('never exposes Originals or transfer chunks through the public route', async () => {
    mocks.inspectRendition.mockClear()
    mocks.readRendition.mockClear()
    await expect(request(['originals', 'private.heic'])).resolves.toMatchObject({
      status: 404,
    })
    await expect(
      request(['transfer-chunks', 'private.part']),
    ).resolves.toMatchObject({ status: 404 })
    expect(mocks.readRendition).not.toHaveBeenCalled()
  })
})
