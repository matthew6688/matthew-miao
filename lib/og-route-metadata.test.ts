import type { Metadata } from 'next'
import { describe, expect, it } from 'vitest'

import { localeMetadata } from './locale-metadata'
import { publicPageMetadata } from './public-page-metadata'

function imageAlt(metadata: Metadata) {
  const images = metadata.openGraph?.images
  const image = Array.isArray(images) ? images[0] : images
  return typeof image === 'object' && image && 'alt' in image ? image.alt : undefined
}

function metadataFor(
  locale: 'zh' | 'en',
  path: string,
  title: string,
  description: string,
) {
  return localeMetadata({ locale, path, title, description })
}

describe('social OG image metadata', () => {
  it('uses Matthew’s localized homepage artwork description', () => {
    const chinese = publicPageMetadata.home.zh
    const english = publicPageMetadata.home.en

    expect(imageAlt(metadataFor('zh', '/', chinese.title, chinese.description))).toBe(
      '老苗。Web coding、AI Agent、自动化、outreach 与企业知识系统。',
    )
    expect(imageAlt(metadataFor('en', '/', english.title, english.description))).toBe(
      'Matthew Miao. Web coding, AI agents, automation, outreach, and company knowledge systems.',
    )
  })

  it.each([
    [
      'zh',
      '/blog',
      publicPageMetadata.blog.zh,
      '写作 · Matthew Miao。老苗关于 Web coding、AI Agent、自动化、outreach 与企业知识系统的实践记录。',
    ],
    [
      'en',
      '/blog',
      publicPageMetadata.blog.en,
      'Writing · Matthew Miao. Notes by Matthew on web coding, AI agents, automation, outreach, and company knowledge systems.',
    ],
    [
      'zh',
      '/photos',
      publicPageMetadata.photos.zh,
      '照片 · Matthew Miao。老苗在工作、生活和旅途中留下的一些瞬间。',
    ],
    [
      'en',
      '/photos',
      publicPageMetadata.photos.en,
      'Photos · Matthew Miao. Moments Matthew has kept from work, life, and everywhere in between.',
    ],
    [
      'zh',
      '/projects',
      publicPageMetadata.projects.zh,
      '项目 · Matthew Miao。这些年做过的产品、开源工具和小实验。有些实用，有些只是好玩，但每一个我都认真做过。',
    ],
    [
      'en',
      '/projects',
      publicPageMetadata.projects.en,
      'Projects · Matthew Miao. Products, open-source tools, and small experiments I have made over the years. Some useful, some playful, all made with care.',
    ],
  ] as const)(
    'describes the %s %s artwork with its own content',
    (locale, path, copy, expected) => {
      expect(imageAlt(metadataFor(locale, path, copy.title, copy.description))).toBe(expected)
    },
  )

  it('describes article and newsletter artwork with the localized title', () => {
    expect(
      imageAlt(
        metadataFor(
          'zh',
          '/blog/do-buttons-need-pointer-cursors',
          '按钮真的需要手指光标吗？',
          '文章摘要',
        ),
      ),
    ).toBe('按钮真的需要手指光标吗？ · Matthew Miao')
    expect(
      imageAlt(
        metadataFor(
          'en',
          '/newsletters/1',
          'Cali.so Monthly Update Newsletter 01',
          'Archive summary',
        ),
      ),
    ).toBe('Cali.so Monthly Update Newsletter 01 · Matthew Miao')
  })
})
