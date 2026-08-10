import { describe, expect, it } from 'vitest'

import {
  linkPreviewProviderUrl,
  normalizeOgMetadata,
} from './link-preview-provider.mjs'

describe('neutral link preview providers', () => {
  it('builds encoded provider URLs for public targets', () => {
    const target = 'https://example.com/articles/design?lang=en#preview'

    expect(linkPreviewProviderUrl('metadata', target)).toBe(
      'https://api.microlink.io/?url=https%3A%2F%2Fexample.com%2Farticles%2Fdesign%3Flang%3Den%23preview',
    )
    expect(linkPreviewProviderUrl('favicon', target)).toBe(
      'https://www.google.com/s2/favicons?domain_url=https%3A%2F%2Fexample.com&sz=64',
    )
    expect(linkPreviewProviderUrl('image', target)).toBe(
      'https://api.microlink.io/?url=https%3A%2F%2Fexample.com%2Farticles%2Fdesign%3Flang%3Den%23preview&embed=image.url',
    )
  })

  it.each([
    'javascript:alert(1)',
    'file:///etc/passwd',
    'http://localhost/admin',
    'http://metadata/private',
    'http://127.0.0.1/private',
    'http://[::1]/private',
    'http://[::ffff:127.0.0.1]/private',
    'http://[::7f00:1]/private',
    'http://[fec0::1]/private',
    'http://[ff02::1]/private',
    'http://[2001:db8::1]/private',
    'http://192.0.0.1/private',
    'http://192.0.2.1/private',
    'http://198.18.0.1/private',
    'http://198.51.100.1/private',
    'http://203.0.113.1/private',
  ])('rejects non-public targets: %s', (target) => {
    expect(linkPreviewProviderUrl('metadata', target)).toBeNull()
  })

  it('allows globally routable IPv4 and IPv6 targets', () => {
    expect(linkPreviewProviderUrl('metadata', 'http://1.1.1.1/')).not.toBeNull()
    expect(linkPreviewProviderUrl('metadata', 'http://[2606:4700:4700::1111]/')).not.toBeNull()
  })

  it('normalizes documented metadata while preserving localized copy', () => {
    expect(
      normalizeOgMetadata(
        'https://studio.example/work',
        {
          title: 'Example Design Studio',
          ogDescription: 'A design studio for people with good taste.',
          image: { type: 'image/png', url: 'https://studio.example/opengraph-image' },
        },
        {
          domain: 'studio.example',
          titleEn: 'Example Design Studio',
          descriptionEn: 'A design studio for people with good taste.',
        },
      ),
    ).toEqual({
      domain: 'studio.example',
      title: 'Example Design Studio',
      titleEn: 'Example Design Studio',
      description: 'A design studio for people with good taste.',
      descriptionEn: 'A design studio for people with good taste.',
      hasImage: true,
    })
  })

  it('sanitizes dashes and promotes prior source copy when new metadata contains Han', () => {
    expect(
      normalizeOgMetadata(
        'https://example.com',
        {
          ogTitle: '设计 — Example',
          ogDescription: '面向设计师的平台',
          ogImage: [],
        },
        {
          domain: 'example.com',
          title: 'Example for designers',
          description: 'A platform for designers',
        },
      ),
    ).toEqual({
      domain: 'example.com',
      title: '设计 - Example',
      titleEn: 'Example for designers',
      description: '面向设计师的平台',
      descriptionEn: 'A platform for designers',
      hasImage: false,
    })
  })

  it('preserves prior Chinese copy when fresh service metadata is English', () => {
    expect(
      normalizeOgMetadata(
        'https://studio.example',
        {
          title: 'Example Design Studio',
          ogDescription: 'A design studio for people with good taste.',
          image: { url: 'https://studio.example/opengraph-image' },
        },
        {
          domain: 'studio.example',
          title: '佐玩（AI 原生设计工作室）',
          titleEn: 'Example AI-native Design Studio',
          description: '一家位于深圳的 AI 原生设计工作室，打造产品、品牌与数字体验。',
          descriptionEn: 'A Shenzhen-based AI-native design studio.',
        },
      ),
    ).toEqual({
      domain: 'studio.example',
      title: '佐玩（AI 原生设计工作室）',
      titleEn: 'Example Design Studio',
      description: '一家位于深圳的 AI 原生设计工作室，打造产品、品牌与数字体验。',
      descriptionEn: 'A design studio for people with good taste.',
      hasImage: true,
    })
  })

  it('keeps Han-only metadata when no English fallback exists', () => {
    expect(
      normalizeOgMetadata('https://example.com', {
        ogTitle: '纯中文标题',
        ogDescription: '只有中文的页面描述。',
        ogImage: [],
      }),
    ).toEqual({
      domain: 'example.com',
      title: '纯中文标题',
      titleEn: undefined,
      description: '只有中文的页面描述。',
      descriptionEn: undefined,
      hasImage: false,
    })
  })
})
