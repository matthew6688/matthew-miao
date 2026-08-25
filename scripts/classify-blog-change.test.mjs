import assert from 'node:assert/strict'
import { test } from 'node:test'

import { classifyChangedFiles } from './classify-blog-change.mjs'

test('classifies an existing article media update as blog-only', () => {
  const result = classifyChangedFiles([
    'content/blog/example/cover.webp',
    'content/blog/example/index.mdx',
    'content/blog/example/publication.json',
    'lib/generated-worker-content.ts',
  ])

  assert.equal(result.scope, 'blog-only')
  assert.deepEqual(result.changedSlugs, ['example'])
})

test('classifies routine new article registration and generated assets as blog-only', () => {
  const result = classifyChangedFiles([
    'content/blog/new-post/index.mdx',
    'content/blog/new-post/index.en.mdx',
    'lib/public-content-routes.ts',
    'lib/view-transition-name.ts',
    'content/legacy-url-manifest.json',
    'app/_fonts/FrexSansGB-OG-Regular.ttf',
    'public/generated-og/zh-blog-new-post.png',
  ])

  assert.equal(result.blogOnly, true)
  assert.deepEqual(result.changedSlugs, ['new-post'])
})

test('uses the full gate when application code changes', () => {
  const result = classifyChangedFiles([
    'content/blog/example/index.mdx',
    'app/_views/blog-post-page.tsx',
  ])

  assert.equal(result.scope, 'full')
})

test('does not treat generated files without an article change as blog-only', () => {
  const result = classifyChangedFiles(['lib/generated-worker-content.ts'])

  assert.equal(result.blogOnly, false)
  assert.deepEqual(result.changedSlugs, [])
})
