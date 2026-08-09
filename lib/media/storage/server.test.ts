import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  bucket: {},
  getCloudflareContext: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: mocks.getCloudflareContext,
}))

import { getMediaStorage } from './server'

describe('Media Storage runtime wiring', () => {
  it('uses the Cloudflare R2 binding and canonical public media route', () => {
    mocks.getCloudflareContext.mockReturnValue({
      env: { MEDIA_R2_BUCKET: mocks.bucket },
    })
    process.env.MEDIA_PUBLIC_BASE_URL = 'https://matthew-miao.com/media/'

    const storage = getMediaStorage()

    expect(storage.publicRenditionUrl('renditions/photo.jpg')).toBe(
      'https://matthew-miao.com/media/renditions/photo.jpg',
    )
  })
})
