import { NextRequest } from 'next/server'
import type { NextFetchEvent } from 'next/server'
import { describe, expect, it } from 'vitest'

import { middleware, siteProxy } from '../middleware'
import { securityHeaders } from './security/headers'

const event = {
  passThroughOnException() {},
  waitUntil() {},
} as unknown as NextFetchEvent

describe('public content proxy', () => {
  it('redirects the www hostname to the canonical origin', () => {
    const response = siteProxy(
      new NextRequest('https://www.matthew-miao.com/en/blog?source=www'),
    )

    expect(response.status).toBe(308)
    expect(response.headers.get('location')).toBe(
      'https://matthew-miao.com/en/blog?source=www',
    )
  })

  it.each([
    '/blog/not-a-published-post',
    '/en/blog/not-a-published-post',
    '/newsletters/not-an-id',
    '/en/newsletters/not-an-id',
  ])('rewrites an unknown content route before streaming: %s', (pathname) => {
    const response = siteProxy(new NextRequest(`https://cali.so${pathname}`))

    expect(response.status).toBe(404)
    expect(response.headers.get('x-middleware-rewrite')).toBe(
      'https://cali.so/_not-found',
    )
  })

  it.each(['/confirm/legacy-token', '/en/confirm/legacy-token'])(
    'returns a hardened 404 for a retired confirmation route: %s',
    (pathname) => {
      const response = siteProxy(
        new NextRequest(`https://matthew-miao.com${pathname}`),
      )

      expect(response.status).toBe(404)
      expect(response.headers.get('content-type')).toBe(
        'text/plain; charset=utf-8',
      )
      for (const { key, value } of securityHeaders) {
        expect(response.headers.get(key)).toBe(value)
      }
    },
  )

  it.each([
    '/blog/building-in-public-with-ai-agents',
    '/en/blog/building-in-public-with-ai-agents',
    '/newsletters/1',
    '/en/newsletters/1',
  ])('passes through a published content route without Clerk: %s', async (pathname) => {
    const response = await middleware(
      new NextRequest(`https://cali.so${pathname}`),
      event,
    )

    expect(response?.status).toBe(200)
    expect(response?.headers.get('x-middleware-next')).toBe('1')
    expect(response?.headers.has('x-middleware-rewrite')).toBe(false)
  })

  it.each([
    '/blog/opengraph-image-generated',
    '/en/blog/opengraph-image-generated',
  ])('does not mistake a generated metadata route for a post slug: %s', (pathname) => {
    const response = siteProxy(new NextRequest(`https://cali.so${pathname}`))

    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-next')).toBe('1')
    expect(response.headers.has('x-middleware-rewrite')).toBe(false)
  })
})
