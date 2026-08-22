import { describe, expect, it } from 'vitest'

import nextConfig from '../next.config'

describe('server output tracing', () => {
  it('packages content and OG dependencies for runtime routes', () => {
    expect(nextConfig.outputFileTracingIncludes).toMatchObject({
      '/blog/**': expect.arrayContaining([
        './content/blog/**/*',
        './app/_fonts/FrexSansGB-OG-*.ttf',
      ]),
      '/en/blog/**': expect.arrayContaining([
        './content/blog/**/*',
        './app/_fonts/FrexSansGB-OG-*.ttf',
      ]),
      '/newsletters/**': expect.arrayContaining([
        './content/newsletters/**/*',
        './app/_fonts/FrexSansGB-OG-*.ttf',
      ]),
      '/en/newsletters/**': expect.arrayContaining([
        './content/newsletters/**/*',
        './app/_fonts/FrexSansGB-OG-*.ttf',
      ]),
      '/content/\\[\\.\\.\\.path\\]': [
        './content/blog/**/*',
        './content/newsletters/**/*',
      ],
    })
  })
})

describe('route security headers', () => {
  it('keeps public fonts self-hosted across every route', async () => {
    const rules = await nextConfig.headers!()
    const globalPolicy = rules
      .find(({ source }) => source === '/:path*')
      ?.headers.find(({ key }) => key === 'Content-Security-Policy')?.value

    expect(globalPolicy).toContain("font-src 'self' data:")
    expect(rules).not.toContainEqual(
      expect.objectContaining({ source: '/retired-product/:path*' }),
    )
    expect(rules).not.toContainEqual(
      expect.objectContaining({ source: '/en/retired-product/:path*' }),
    )
  })

  it('allows the Google OAuth form redirect only from AMA settings', async () => {
    const rules = await nextConfig.headers!()
    const globalPolicy = rules
      .find(({ source }) => source === '/:path*')
      ?.headers.find(({ key }) => key === 'Content-Security-Policy')?.value
    const googleOAuthPolicy = rules
      .find(({ source }) => source === '/admin/ama/settings')
      ?.headers.find(({ key }) => key === 'Content-Security-Policy')?.value

    expect(globalPolicy).toContain("form-action 'self'")
    expect(globalPolicy).not.toContain('https://accounts.google.com')
    expect(googleOAuthPolicy).toContain(
      "form-action 'self' https://accounts.google.com",
    )
  })

  it('scopes Google font access to standalone presentations', async () => {
    const rules = await nextConfig.headers!()
    const globalPolicy = rules
      .find(({ source }) => source === '/:path*')
      ?.headers.find(({ key }) => key === 'Content-Security-Policy')?.value
    const presentationPolicy = rules
      .find(({ source }) => source === '/presentations/:path*')
      ?.headers.find(({ key }) => key === 'Content-Security-Policy')?.value

    expect(globalPolicy).not.toContain('fonts.googleapis.com')
    expect(globalPolicy).not.toContain('fonts.gstatic.com')
    expect(presentationPolicy).toContain('https://fonts.googleapis.com')
    expect(presentationPolicy).toContain('https://fonts.gstatic.com')
  })
})

describe('presentation routes', () => {
  it('publishes the approved deck at its clean public URL', async () => {
    const rewrites = await nextConfig.rewrites!()

    expect(rewrites).toContainEqual({
      source: '/presentations/youtube-monetization-me-too-me-better',
      destination:
        '/presentations/youtube-monetization-me-too-me-better/index.html',
    })
  })
})
