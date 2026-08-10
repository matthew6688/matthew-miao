import { afterEach, describe, expect, it, vi } from 'vitest'

import { adminSecurityHeader, blogSecurityHeader, securityHeaders } from './headers'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('site security headers', () => {
  it('sets a restrictive browser security baseline for every route', () => {
    const headers = Object.fromEntries(
      securityHeaders.map(({ key, value }) => [key.toLowerCase(), value]),
    )

    expect(headers['content-security-policy']).toContain("default-src 'self'")
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'")
    expect(headers['content-security-policy']).toContain("object-src 'none'")
    expect(headers['content-security-policy']).toContain("base-uri 'self'")
    expect(headers['content-security-policy']).toContain("form-action 'self'")
    expect(blogSecurityHeader.value).toContain(
      'frame-src https://www.youtube-nocookie.com https://player.vimeo.com https://*.cloudflarestream.com',
    )
    expect(headers['content-security-policy']).toContain("frame-src 'none'")
    expect(headers['content-security-policy']).toContain("script-src 'self' 'unsafe-inline'")
    expect(headers['content-security-policy']).toContain(
      'https://static.cloudflareinsights.com',
    )
    expect(headers['content-security-policy']).toContain(
      'https://cloudflareinsights.com',
    )
    expect(adminSecurityHeader.value).not.toContain('cloudflareinsights.com')
    expect(headers['content-security-policy']).not.toContain('fontshare.com')
    expect(headers['content-security-policy']).not.toContain("'unsafe-eval'")
    expect(headers['strict-transport-security']).toBe(
      'max-age=63072000; includeSubDomains; preload',
    )
    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(headers['permissions-policy']).toContain('camera=()')
    expect(headers['permissions-policy']).toContain('microphone=()')
    expect(headers['permissions-policy']).toContain('payment=()')
  })

  it('allows the Clerk instance origins only on the admin policies', async () => {
    vi.stubEnv(
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      `pk_test_${Buffer.from('Example.Clerk.Accounts.Dev$').toString('base64')}`,
    )
    const {
      adminSecurityHeader,
      googleOAuthFormSecurityHeader,
      securityHeaders: configuredHeaders,
    } = await import('./headers')
    const publicPolicy = configuredHeaders.find(
      ({ key }) => key === 'Content-Security-Policy',
    )?.value

    for (const policy of [
      adminSecurityHeader.value,
      googleOAuthFormSecurityHeader.value,
    ]) {
      expect(policy).toContain(
        "script-src 'self' 'unsafe-inline' https://example.clerk.accounts.dev",
      )
      expect(policy).toContain(
        "connect-src 'self' https://example.clerk.accounts.dev",
      )
    }
    expect(googleOAuthFormSecurityHeader.value).toContain(
      "form-action 'self' https://accounts.google.com",
    )
    expect(publicPolicy).not.toContain('clerk')
    expect(adminSecurityHeader.value).toContain("frame-src 'none'")
  })

  it('omits Clerk origins when the publishable key is missing or malformed', async () => {
    vi.stubEnv('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'pk_live_not-base64!!')
    const { adminSecurityHeader } = await import('./headers')

    expect(adminSecurityHeader.value).toContain(
      "script-src 'self' 'unsafe-inline'; ",
    )
    expect(adminSecurityHeader.value).toContain("connect-src 'self'; ")
  })

  it('allows only a configured external Media origin for images', async () => {
    vi.stubEnv(
      'MEDIA_PUBLIC_BASE_URL',
      'https://media.example.com/media/',
    )
    const { securityHeaders: configuredHeaders } = await import('./headers')
    const policy = configuredHeaders.find(
      ({ key }) => key === 'Content-Security-Policy',
    )?.value

    expect(policy).toContain(' https://media.example.com')
    expect(policy).not.toContain('/media/')
  })
})
