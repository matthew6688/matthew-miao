import { describe, expect, it, vi } from 'vitest'

vi.mock('next/cache', () => ({ cacheLife: vi.fn() }))

import { publicImageDataUri } from './og'

describe('OG image assets', () => {
  it('embeds the Matthew placeholder as SVG', async () => {
    const badge = await publicImageDataUri('/images/matthew-placeholder-light.svg')

    expect(badge).toMatch(/^data:image\/svg\+xml;base64,/)
  })
})
