import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { parseMediaPublicBaseUrl } from './config'

describe('Cloudflare Media public route configuration', () => {
  it('accepts only the canonical HTTPS media route', () => {
    expect(
      parseMediaPublicBaseUrl({
        MEDIA_PUBLIC_BASE_URL: 'https://matthew-miao.com/media/',
      }),
    ).toEqual(new URL('https://matthew-miao.com/media/'))

    expect(() =>
      parseMediaPublicBaseUrl({
        MEDIA_PUBLIC_BASE_URL: 'https://media.example.com/',
      }),
    ).toThrow('MEDIA_PUBLIC_BASE_URL')
  })
})
