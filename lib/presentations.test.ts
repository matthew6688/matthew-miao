import { describe, expect, it } from 'vitest'

import { presentations, presentationPath } from './presentations'
import { formatDate } from './date'

describe('presentation registry', () => {
  it('uses unique safe slugs in newest-first order', () => {
    const slugs = presentations.map(({ slug }) => slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(slugs.every((slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))).toBe(true)

    const timestamps = presentations.map(({ publishedAt }) => publishedAt.getTime())
    expect(timestamps).toEqual([...timestamps].sort((a, b) => b - a))
  })

  it('builds clean standalone paths', () => {
    expect(presentationPath('six-months-two-ai-products')).toBe(
      '/presentations/six-months-two-ai-products',
    )
  })

  it('preserves the intended publication day in the site timezone', () => {
    expect(presentations.map(({ publishedAt }) => formatDate(publishedAt))).toEqual([
      '2026年8月27日',
      '2026年8月22日',
    ])
  })
})
