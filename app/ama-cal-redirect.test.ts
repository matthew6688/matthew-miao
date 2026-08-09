import { redirect } from 'next/navigation'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import EnglishAmaBookPage from './(en)/en/ama/book/page'
import ChineseAmaBookPage from './(zh)/ama/book/page'

vi.mock('next/navigation', () => ({ redirect: vi.fn() }))

describe('Cal.com booking handoff', () => {
  beforeEach(() => vi.mocked(redirect).mockClear())

  it.each([
    ['Chinese', ChineseAmaBookPage],
    ['English', EnglishAmaBookPage],
  ])('redirects the %s booking route to the confirmed public event', (_locale, page) => {
    page()

    expect(redirect).toHaveBeenCalledOnce()
    expect(redirect).toHaveBeenCalledWith('https://cal.com/matthew-miao/ama')
  })
})
