import assert from 'node:assert/strict'
import test from 'node:test'

import { validateShowcases } from './validate-showcases.mjs'

const product = {
  slug: 'sample-product',
  name: '产品',
  nameEn: 'Product',
  description: '说明',
  descriptionEn: 'Description',
  url: 'https://example.com',
  icon: '/images/projects/sample.svg',
  domain: 'example.com',
  category: '软件',
  categoryEn: 'Software',
  status: 'live',
  shelfColor: '#171713',
  shelfInk: '#f7f4ed',
}

const experiment = {
  slug: 'sample-experiment',
  name: '实验',
  nameEn: 'Experiment',
  description: '说明',
  descriptionEn: 'Description',
  hypothesis: '假设',
  hypothesisEn: 'Hypothesis',
  category: 'software',
  categoryLabel: '软件',
  categoryLabelEn: 'Software',
  status: 'building',
  statusLabel: '正在构建',
  statusLabelEn: 'Building',
  tags: ['工具'],
  tagsEn: ['Tool'],
  shelfColor: '#ded7c9',
  shelfInk: '#171713',
  productSlug: 'sample-product',
}

test('accepts linked bilingual products and experiments', () => {
  assert.deepEqual(validateShowcases({ projects: [product] }, [experiment]), {
    products: 1,
    experiments: 1,
  })
})

test('rejects duplicate slugs, unsupported taxonomy, and broken product links', () => {
  assert.throws(
    () => validateShowcases(
      { projects: [product, product] },
      [{ ...experiment, category: 'get-rich-quick', productSlug: 'missing' }],
    ),
    /duplicate product slug:[\s\S]*unsupported category[\s\S]*unknown product/,
  )
})
