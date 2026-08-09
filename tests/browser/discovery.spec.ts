import { expect, test } from '@playwright/test'

import { prepareBrowserPage, watchBrowserErrors } from './support'

const expectedOrigin = process.env.PLAYWRIGHT_BASE_URL
  ? new URL(process.env.PLAYWRIGHT_BASE_URL).origin
  : 'https://matthew-miao.com'

const metadataCases = [
  {
    locale: 'Chinese',
    path: '/projects',
    canonical: `${expectedOrigin}/projects`,
    openGraphLocale: 'zh_CN',
    socialLocale: 'zh',
  },
  {
    locale: 'English',
    path: '/en/projects',
    canonical: `${expectedOrigin}/en/projects`,
    openGraphLocale: 'en_US',
    socialLocale: 'en',
  },
]

for (const metadata of metadataCases) {
  test(`@hosted ${metadata.locale} metadata keeps its canonical locale contract`, async ({
    page,
  }) => {
    await prepareBrowserPage(page)
    const browserErrors = watchBrowserErrors(page)
    await page.goto(metadata.path)

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      metadata.canonical,
    )
    await expect(page.locator('link[rel="alternate"][hreflang="zh-CN"]')).toHaveAttribute(
      'href',
      `${expectedOrigin}/projects`,
    )
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
      'href',
      `${expectedOrigin}/en/projects`,
    )
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
      'content',
      metadata.openGraphLocale,
    )

    const socialImage = await page
      .locator('meta[property="og:image"]')
      .getAttribute('content')
    expect(socialImage).not.toBeNull()
    const socialImageUrl = new URL(socialImage!)
    expect(socialImageUrl.origin).toBe(expectedOrigin)
    expect(socialImageUrl.pathname).toBe('/og')
    expect(socialImageUrl.searchParams.get('locale')).toBe(metadata.socialLocale)
    expect(socialImageUrl.searchParams.get('path')).toBe('/projects')
    expect(browserErrors).toEqual([])
  })
}

test('@hosted feeds and localized social images return their public media contracts', async ({
  request,
}) => {
  const chineseFeed = await request.get('/feed.xml')
  const englishFeed = await request.get('/feed.en.xml')
  const socialImage = await request.get('/og?locale=en&path=%2Fprojects')

  expect(chineseFeed.status()).toBe(200)
  expect(chineseFeed.headers()['content-type']).toContain('xml')
  expect(await chineseFeed.text()).toContain(`${expectedOrigin}/blog/`)

  expect(englishFeed.status()).toBe(200)
  expect(englishFeed.headers()['content-type']).toContain('xml')
  expect(await englishFeed.text()).toContain(`${expectedOrigin}/en/blog/`)

  expect(socialImage.status()).toBe(200)
  expect(socialImage.headers()['content-type']).toContain('image/png')
  expect((await socialImage.body()).byteLength).toBeGreaterThan(10_000)
})
