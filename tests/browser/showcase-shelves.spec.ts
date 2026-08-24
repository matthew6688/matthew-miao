import { expect, test } from '@playwright/test'

import { prepareBrowserPage, watchBrowserErrors } from './support'

test('@hosted English shelf links preserve locale and expose official product links', async ({
  page,
}) => {
  await prepareBrowserPage(page)
  const browserErrors = watchBrowserErrors(page)
  await page.goto('/en')

  const products = page.getByRole('list', { name: "Matthew's software products" })
  await expect(products).toBeVisible()
  await expect(products.getByRole('button')).toHaveCount(3)
  await expect(products.locator('img[src*="/images/showcases/products/"]')).toHaveCount(3)
  await page.getByRole('link', { name: /FengTalk\.ai · AI export growth/ }).click()
  await expect(page).toHaveURL(/\/en\/projects\/fengtalk$/)
  await expect(page.getByRole('heading', { level: 1, name: 'FengTalk.ai' })).toBeVisible()
  await expect(page.getByRole('link', { name: /fengtalk\.ai/ })).toHaveAttribute(
    'target',
    '_blank',
  )
  expect(browserErrors).toEqual([])
})

test('@hosted Build in Public shelf opens a registered experiment with honest empty state', async ({
  page,
}) => {
  await prepareBrowserPage(page)
  const browserErrors = watchBrowserErrors(page)
  await page.goto('/build-in-public')

  const experiments = page.getByRole('list', { name: '正在进行的赚钱实验' })
  await expect(experiments).toBeVisible()
  await expect(experiments.getByRole('button')).toHaveCount(2)
  await expect(experiments.locator('img[src*="/images/showcases/experiments/"]')).toHaveCount(2)
  await page.getByRole('link', { name: /课堂随机抽选工具 · 软件/ }).click()
  await expect(page).toHaveURL(/\/build-in-public\/classroom-randomizer$/)
  await expect(page.getByRole('heading', { level: 1, name: '课堂随机抽选工具' })).toBeVisible()
  await expect(page.getByText('还没有公开更新。第一篇记录发布后会自动出现在这里。')).toBeVisible()
  expect(browserErrors).toEqual([])
})
