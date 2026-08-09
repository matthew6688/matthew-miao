import { expect, test } from '@playwright/test'

import { prepareBrowserPage, watchBrowserErrors } from './support'

for (const publicPath of ['/', '/en']) {
  test(`@hosted ${publicPath} avoids Vercel Analytics and Clerk on public routes`, async ({ page }) => {
    await prepareBrowserPage(page)
    const browserErrors = watchBrowserErrors(page)
    await page.goto(publicPath)

    await expect(page.locator('script[src*="/_vercel/insights/"]')).toHaveCount(0)
    await expect(page.locator('script[src*="clerk"]')).toHaveCount(0)
    expect(browserErrors).toEqual([])
  })
}

test('@hosted signed-out admin navigation stops at the authentication boundary', async ({
  request,
}) => {
  const response = await request.get('/admin', { maxRedirects: 0 })
  const headers = response.headers()
  const responseBody = await response.text()

  expect(responseBody).not.toContain('/_vercel/insights/script.js')

  if (response.status() === 404) {
    // Clerk reports the same fail-closed rewrite with an environment-specific
    // signed-out reason: Preview lacks the development browser token, while
    // Production lacks both a session token and UAT.
    expect(responseBody).not.toContain('Invalid server environment')
    return
  }

  expect([302, 307]).toContain(response.status())
  const location = new URL(headers.location)
  expect(location.hostname).not.toContain('cali.so')
  expect(location.pathname).toBe('/sign-in')
  expect(new URL(location.searchParams.get('redirect_url')!).pathname).toBe('/admin')
})
