import { expect, test } from '@playwright/test'

import { publishedPostSlugs } from '../../lib/public-content-routes'
import { expectHealthyPublicDocument, prepareBrowserPage, watchBrowserErrors } from './support'

const expectedOrigin = process.env.PLAYWRIGHT_BASE_URL
  ? new URL(process.env.PLAYWRIGHT_BASE_URL).origin
  : 'https://matthew-miao.com'

for (const slug of publishedPostSlugs) {
  for (const locale of ['zh', 'en'] as const) {
    const path = locale === 'en' ? `/en/blog/${slug}` : `/blog/${slug}`
    const lang = locale === 'en' ? 'en' : 'zh-CN'

    test(`@hosted published ${locale} article ${slug} keeps its complete page contract`, async ({
      page,
    }) => {
      await prepareBrowserPage(page)
      const browserErrors = watchBrowserErrors(page)
      await expectHealthyPublicDocument(page, path, lang)

      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        `${expectedOrigin}${path}`,
      )
      await expect(page.locator('link[rel="alternate"][hreflang="zh-CN"]')).toHaveAttribute(
        'href',
        `${expectedOrigin}/blog/${slug}`,
      )
      await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
        'href',
        `${expectedOrigin}/en/blog/${slug}`,
      )

      const images = page.locator('article img')
      for (let index = 0; index < await images.count(); index += 1) {
        await expect(images.nth(index)).toHaveJSProperty('complete', true)
        expect(
          await images.nth(index).evaluate((image) => (image as HTMLImageElement).naturalWidth),
        ).toBeGreaterThan(0)
      }

      const unsafeExternalLinks = await page.locator('article a[href]').evaluateAll((links) =>
        links
          .map((link) => link.getAttribute('href') ?? '')
          .filter((href) => /^[a-z][a-z0-9+.-]*:/i.test(href) && !/^https:|^mailto:/i.test(href)),
      )
      expect(unsafeExternalLinks).toEqual([])
      const videos = page.locator('article .post-video')
      for (let index = 0; index < await videos.count(); index += 1) {
        const video = videos.nth(index)
        await expect(video.locator('iframe')).toHaveCount(0)
        await video.getByRole('button').click()
        const frame = video.locator('iframe')
        await expect(frame).toBeVisible()
        await expect(frame).toHaveAttribute(
          'src',
          /^https:\/\/(?:www\.youtube-nocookie\.com|player\.vimeo\.com|[^/]+\.cloudflarestream\.com)\//,
        )
      }
      expect(browserErrors).toEqual([])
    })
  }

  test(`@hosted discovery surfaces published article ${slug}`, async ({ request }) => {
    const sitemap = await request.get('/sitemap.xml')
    const chineseFeed = await request.get('/feed.xml')
    const englishFeed = await request.get('/feed.en.xml')

    expect(sitemap.status()).toBe(200)
    expect(chineseFeed.status()).toBe(200)
    expect(englishFeed.status()).toBe(200)
    expect(await sitemap.text()).toContain(`${expectedOrigin}/blog/${slug}`)
    expect(await chineseFeed.text()).toContain(`${expectedOrigin}/blog/${slug}`)
    expect(await englishFeed.text()).toContain(`${expectedOrigin}/en/blog/${slug}`)
  })
}
