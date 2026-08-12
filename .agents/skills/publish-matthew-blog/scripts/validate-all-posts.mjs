#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const root = path.resolve(
  process.env.BLOG_SKILL_REPO_ROOT ?? path.resolve(import.meta.dirname, '../../../..'),
)
const validator = path.join(import.meta.dirname, 'validate-post.mjs')
const flags = process.argv.slice(2)
const routesUrl = pathToFileURL(path.join(root, 'lib/public-content-routes.ts')).href
const { publishedPostSlugs } = await import(`${routesUrl}?validation=${Date.now()}`)

if (flags.some((flag) => flag !== '--check-links')) {
  console.error('Usage: validate-all-posts.mjs [--check-links]')
  process.exit(1)
}

if (new Set(publishedPostSlugs).size !== publishedPostSlugs.length) {
  console.error('publish-matthew-blog: publishedPostSlugs contains a duplicate')
  process.exit(1)
}

const contentSlugs = readdirSync(path.join(root, 'content/blog'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map(({ name }) => name)
  .sort()
const registeredSlugs = new Set(publishedPostSlugs)

for (const slug of contentSlugs) {
  const mode = registeredSlugs.has(slug) ? [] : ['--draft']
  const result = spawnSync(process.execPath, [validator, slug, ...mode, ...flags], {
    cwd: root,
    encoding: 'utf8',
  })
  process.stdout.write(result.stdout)
  process.stderr.write(result.stderr)
  if (result.status !== 0) process.exit(result.status ?? 1)
}

console.log(
  `publish-matthew-blog: validated ${publishedPostSlugs.length} published and ${contentSlugs.length - publishedPostSlugs.length} draft post(s)`,
)
