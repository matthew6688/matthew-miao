import { describe, expect, it, vi } from 'vitest'

vi.mock('~/lib/content', () => ({
  getPost: vi.fn(),
  isPostSlug: vi.fn(() => false),
}))

vi.mock('~/lib/newsletters', () => ({
  getArchivedNewsletter: vi.fn(),
  isArchivedNewsletterId: vi.fn(() => false),
}))

vi.mock('~/lib/og-image', () => ({
  createHomeOgImage: vi.fn(),
  createNewsletterOgImage: vi.fn(),
  createPostOgImage: vi.fn(),
  createSectionOgImage: vi.fn(),
}))

import { GET } from './route'

describe('retired product OG image route', () => {
  it.each(['zh', 'en'] as const)(
    'returns 404 for the retired %s retired product page',
    async (locale) => {
      const response = await GET(
        new Request(
          `https://matthew-miao.com/og?locale=${locale}&path=%2Fretired-product`,
        ),
      )

      expect(response.status).toBe(404)
    },
  )
})
