import { expect, test } from '@playwright/test'

import photoCatalog from '../../content/photos/catalog.json'
import { expectHealthyPublicDocument, prepareBrowserPage, watchBrowserErrors } from './support'

const publishedPhotos = photoCatalog.items.filter(({ published }) => published)

for (const locale of ['zh', 'en'] as const) {
  const path = locale === 'en' ? '/en/photos' : '/photos'
  const lang = locale === 'en' ? 'en' : 'zh-CN'

  test(`@hosted ${locale} photo wall delivers the complete published catalog`, async ({
    page,
  }) => {
    await prepareBrowserPage(page)
    const browserErrors = watchBrowserErrors(page)
    await expectHealthyPublicDocument(page, path, lang)

    const triggers = page.locator('.photo-masonry .zoom-trigger')
    await expect(triggers).toHaveCount(publishedPhotos.length)
    for (const [index, photo] of publishedPhotos.entries()) {
      const expectedAlt = locale === 'en' ? photo.altText.en : photo.altText.zhHans
      const image = triggers.nth(index).locator('img')
      await expect(image).toHaveAttribute('alt', expectedAlt)
      await expect(image).toHaveJSProperty('complete', true)
      expect(
        await image.evaluate((element) => (element as HTMLImageElement).naturalWidth),
      ).toBeGreaterThan(0)
    }

    if (publishedPhotos.length) {
      const first = triggers.first()
      await first.focus()
      await first.press('Enter')
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).toBeHidden()
      await expect(first).toBeFocused()
    }
    expect(browserErrors).toEqual([])
  })
}

for (const locale of ['zh', 'en'] as const) {
  test(`@hosted ${locale} homepage photo preview matches the first three published photos`, async ({
    page,
  }) => {
    await prepareBrowserPage(page)
    const browserErrors = watchBrowserErrors(page)
    const path = locale === 'en' ? '/en' : '/'
    await expectHealthyPublicDocument(page, path, locale === 'en' ? 'en' : 'zh-CN')

    const photoPath = locale === 'en' ? '/en/photos' : '/photos'
    const previewImages = page.locator(`a[href="${photoPath}"] .nc-polaroid img`)
    const expected = publishedPhotos.slice(0, 3)
    await expect(previewImages).toHaveCount(expected.length)
    for (const [index, photo] of expected.entries()) {
      const image = previewImages.nth(index)
      await expect(image).toHaveAttribute(
        'src',
        new RegExp(`/images/photos/${photo.id}/${photo.id}-640\\.jpg`),
      )
      await expect(image).toHaveCSS(
        'object-position',
        `${photo.focalPoint.x * 100}% ${photo.focalPoint.y * 100}%`,
      )
    }
    expect(browserErrors).toEqual([])
  })
}
