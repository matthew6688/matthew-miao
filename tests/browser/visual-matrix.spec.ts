import { expect, test } from '@playwright/test'

import { expectHealthyPublicDocument, prepareBrowserPage } from './support'

test.skip(process.platform !== 'darwin', 'Golden images are recorded on macOS Chromium')

const viewports = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
} as const

const locales = {
  zh: { path: '/', lang: 'zh-CN' as const },
  en: { path: '/en', lang: 'en' as const },
} as const

for (const [viewportName, viewport] of Object.entries(viewports)) {
  for (const [localeName, locale] of Object.entries(locales)) {
    for (const colorScheme of ['light', 'dark'] as const) {
      for (const reducedMotion of ['no-preference', 'reduce'] as const) {
        test(`@visual home ${viewportName} ${localeName} ${colorScheme} ${reducedMotion}`, async ({
          page,
        }) => {
          await prepareBrowserPage(page)
          await page.setViewportSize(viewport)
          await page.emulateMedia({ colorScheme, reducedMotion })
          await expectHealthyPublicDocument(page, locale.path, locale.lang, {
            settleMs: reducedMotion === 'reduce' ? 0 : 1_200,
          })
          await page.locator('html').evaluate((element) => {
            element.classList.add('visual-test-stable')
          })
          await page.addStyleTag({
            content: `
              .visual-test-stable *,
              .visual-test-stable *::before,
              .visual-test-stable *::after {
                animation-delay: 0s !important;
                animation-duration: 0s !important;
                caret-color: transparent !important;
                transition-delay: 0s !important;
                transition-duration: 0s !important;
              }
            `,
          })
          await page.evaluate(() => document.fonts.ready)

          await expect(page).toHaveScreenshot(
            `${viewportName}-${localeName}-${colorScheme}-${reducedMotion}.png`,
            {
              animations: 'disabled',
              fullPage: true,
              mask: [page.locator('.footer-local-time')],
              maxDiffPixelRatio: 0.002,
            },
          )
        })
      }
    }
  }
}
