#!/usr/bin/env node

import path from 'node:path'
import { existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const colorPattern = /^#[0-9a-f]{6}$/i
const localImagePattern = /^\/images\/[a-z0-9/_-]+\.(?:avif|jpe?g|png|svg|webp)$/i

function validateLocalImage(failures, owner, field, value) {
  if (typeof value !== 'string' || !localImagePattern.test(value)) {
    failures.push(`${owner} needs a safe local ${field}`)
  }
}

export function validateShowcases(siteProfile, experiments) {
  const failures = []
  const productSlugs = new Set()
  const experimentSlugs = new Set()

  for (const product of siteProfile.projects ?? []) {
    if (!slugPattern.test(product.slug ?? '')) failures.push('product needs a lowercase kebab-case slug')
    if (productSlugs.has(product.slug)) failures.push(`duplicate product slug: ${product.slug}`)
    productSlugs.add(product.slug)
    for (const field of ['name', 'nameEn', 'description', 'descriptionEn', 'category', 'categoryEn', 'domain']) {
      if (typeof product[field] !== 'string' || !product[field].trim()) failures.push(`${product.slug ?? 'product'} needs ${field}`)
    }
    validateLocalImage(failures, product.slug ?? 'product', 'icon', product.icon)
    validateLocalImage(failures, product.slug ?? 'product', 'cover', product.cover)
    if (!Number.isInteger(product.coverWidth) || product.coverWidth <= 0 || !Number.isInteger(product.coverHeight) || product.coverHeight <= 0) {
      failures.push(`${product.slug ?? 'product'} needs positive integer cover dimensions`)
    }
    try {
      const url = new URL(product.url)
      if (url.protocol !== 'https:') failures.push(`${product.slug} URL must use HTTPS`)
    } catch {
      failures.push(`${product.slug ?? 'product'} needs a valid URL`)
    }
    if (product.status !== 'live') failures.push(`${product.slug} has unsupported status ${product.status}`)
    if (!colorPattern.test(product.shelfColor ?? '') || !colorPattern.test(product.shelfInk ?? '')) {
      failures.push(`${product.slug} needs six-digit shelf colors`)
    }
  }

  for (const experiment of experiments ?? []) {
    if (!slugPattern.test(experiment.slug ?? '')) failures.push('experiment needs a lowercase kebab-case slug')
    if (experimentSlugs.has(experiment.slug)) failures.push(`duplicate experiment slug: ${experiment.slug}`)
    experimentSlugs.add(experiment.slug)
    for (const field of ['name', 'nameEn', 'description', 'descriptionEn', 'hypothesis', 'hypothesisEn', 'categoryLabel', 'categoryLabelEn', 'statusLabel', 'statusLabelEn']) {
      if (typeof experiment[field] !== 'string' || !experiment[field].trim()) failures.push(`${experiment.slug ?? 'experiment'} needs ${field}`)
    }
    if (!['content', 'software'].includes(experiment.category)) failures.push(`${experiment.slug} has unsupported category ${experiment.category}`)
    if (!['active', 'building', 'paused', 'completed', 'stopped'].includes(experiment.status)) failures.push(`${experiment.slug} has unsupported status ${experiment.status}`)
    if (!Array.isArray(experiment.tags) || !experiment.tags.length || !Array.isArray(experiment.tagsEn) || !experiment.tagsEn.length) {
      failures.push(`${experiment.slug} needs bilingual tags`)
    }
    validateLocalImage(failures, experiment.slug ?? 'experiment', 'cover', experiment.cover)
    if (experiment.productSlug && !productSlugs.has(experiment.productSlug)) {
      failures.push(`${experiment.slug} references unknown product ${experiment.productSlug}`)
    }
    if (!colorPattern.test(experiment.shelfColor ?? '') || !colorPattern.test(experiment.shelfInk ?? '')) {
      failures.push(`${experiment.slug} needs six-digit shelf colors`)
    }
  }

  if (failures.length) throw new Error(failures.join('\n'))
  return { products: productSlugs.size, experiments: experimentSlugs.size }
}

export function validateAssetFiles(root, siteProfile, experiments) {
  const missing = []
  const assets = [
    ...(siteProfile.projects ?? []).flatMap((product) => [product.icon, product.cover]),
    ...(experiments ?? []).map((experiment) => experiment.cover),
  ]

  for (const asset of assets) {
    if (typeof asset !== 'string' || !localImagePattern.test(asset)) continue
    const file = path.resolve(root, 'public', asset.slice(1))
    if (!existsSync(file)) missing.push(asset)
  }

  if (missing.length) throw new Error(`missing showcase assets:\n${missing.join('\n')}`)
  return { assets: assets.length }
}

function parseRepo(argv) {
  const index = argv.indexOf('--repo')
  return path.resolve(index >= 0 ? argv[index + 1] : process.cwd())
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const root = parseRepo(process.argv.slice(2))
    const cacheKey = `?validate=${Date.now()}`
    const [{ siteProfile }, { experiments }] = await Promise.all([
      import(`${pathToFileURL(path.join(root, 'lib/site-profile.ts')).href}${cacheKey}`),
      import(`${pathToFileURL(path.join(root, 'lib/experiments.ts')).href}${cacheKey}`),
    ])
    const report = validateShowcases(siteProfile, experiments)
    const assetReport = validateAssetFiles(root, siteProfile, experiments)
    process.stdout.write(`curate-matthew-projects-shelves: ${report.products} products, ${report.experiments} experiments, and ${assetReport.assets} local assets are valid\n`)
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
