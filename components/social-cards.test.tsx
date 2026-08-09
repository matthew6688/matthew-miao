// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import social from '~/content/social.json'

import { siteProfile } from '~/lib/site-profile'

import { WeChatCardBody, XCardBody } from './social-cards'

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} />
  ),
}))

afterEach(cleanup)

describe('X hover card', () => {
  it('renders the current profile description and both relationship counts', () => {
    const { container } = render(<XCardBody data={social.x} />)

    expect(container.textContent).toContain(social.x.bio)
    expect(container.textContent).toContain(social.x.bioEn)
  })

  it('uses the confirmed FengTalk account', () => {
    expect(siteProfile.links.x.url).toBe('https://x.com/fengtalk_ai')
    expect(siteProfile.links.x.handle).toBe('fengtalk_ai')
    expect(social.x.handle).toBe(siteProfile.links.x.handle)
  })
})

describe('WeChat hover cards', () => {
  it.each([
    ['service', 'matthewmiao', '/images/social/wechat-service-matthewmiao.png'],
    ['subscription', 'fengtalk.ai', '/images/social/wechat-subscription-fengtalk.png'],
  ] as const)('renders the confirmed %s account and QR asset', (account, searchName, qrImage) => {
    const { container } = render(<WeChatCardBody account={account} />)

    expect(container.textContent).toContain(searchName)
    expect(container.querySelector('img')?.getAttribute('src')).toBe(qrImage)
  })
})
