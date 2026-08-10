import { describe, expect, it } from 'vitest'

import { upstreamLinkMediaUrl } from './link-media'
import { faviconUrl, ogImageUrl } from './link-previews'

describe('link preview media URLs', () => {
  it('routes known targets through the cached first-party proxy', () => {
    // astro.build is in content/link-previews.json with hasImage: true
    expect(faviconUrl('https://astro.build/')).toBe(
      '/link-media/favicon?url=https%3A%2F%2Fastro.build',
    )
    expect(ogImageUrl('https://astro.build/')).toBe(
      '/link-media/image?url=https%3A%2F%2Fastro.build%2F',
    )
  })

  it('requests favicons against the root domain only', () => {
    // deep paths under a known origin collapse to that origin's icon
    expect(faviconUrl('https://astro.build/blog/some-post?x=1#y')).toBe(
      '/link-media/favicon?url=https%3A%2F%2Fastro.build',
    )
  })

  it('falls back to the service for targets missing from the snapshot', () => {
    expect(faviconUrl('https://not-in-snapshot.example/articles/design')).toBe(
      'https://www.google.com/s2/favicons?domain_url=https%3A%2F%2Fnot-in-snapshot.example&sz=64',
    )
    expect(ogImageUrl('https://not-in-snapshot.example/articles/design')).toBe(
      'https://api.microlink.io/?url=https%3A%2F%2Fnot-in-snapshot.example%2Farticles%2Fdesign&embed=image.url',
    )
  })

  it('degrades bad links to null instead of throwing', () => {
    expect(faviconUrl('not a url')).toBeNull()
    expect(faviconUrl('javascript:alert(1)')).toBeNull()
    expect(faviconUrl('http://localhost/admin')).toBeNull()
  })
})

describe('link media proxy allowlist', () => {
  it('resolves allowlisted targets to their neutral upstream', () => {
    expect(upstreamLinkMediaUrl('favicon', 'https://astro.build')).toBe(
      'https://www.google.com/s2/favicons?domain_url=https%3A%2F%2Fastro.build&sz=64',
    )
    expect(upstreamLinkMediaUrl('favicon', 'https://astro.build/deep/page')).toBe(
      'https://www.google.com/s2/favicons?domain_url=https%3A%2F%2Fastro.build&sz=64',
    )
    expect(upstreamLinkMediaUrl('image', 'https://astro.build/')).toBe(
      'https://api.microlink.io/?url=https%3A%2F%2Fastro.build%2F&embed=image.url',
    )
  })

  it('rejects unknown legacy origins', () => {
    expect(upstreamLinkMediaUrl('favicon', 'https://legacy.example')).toBeNull()
  })

  it('rejects everything else', () => {
    expect(upstreamLinkMediaUrl('favicon', 'https://not-in-snapshot.example')).toBeNull()
    // images match the exact page URL, never the bare origin
    expect(upstreamLinkMediaUrl('image', 'https://astro.build/blog/some-post')).toBeNull()
    expect(upstreamLinkMediaUrl('favicon', 'not a url')).toBeNull()
    expect(upstreamLinkMediaUrl('metadata', 'https://astro.build')).toBeNull()
  })
})
