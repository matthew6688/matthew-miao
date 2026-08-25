#!/usr/bin/env node

import { appendFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const routineBlogFiles = new Set([
  'content/legacy-url-manifest.json',
  'lib/generated-worker-content.ts',
  'lib/public-content-routes.ts',
  'lib/view-transition-name.ts',
])

const routineBlogPrefixes = [
  'app/_fonts/',
  'content/blog/',
  'public/generated-og/',
]

export function classifyChangedFiles(files) {
  const normalizedFiles = [...new Set(files.map((file) => file.trim()).filter(Boolean))]
  const changedSlugs = [...new Set(normalizedFiles.flatMap((file) => {
    const match = file.match(/^content\/blog\/([^/]+)\//u)
    return match ? [match[1]] : []
  }))].sort()
  const routineBlogOnly = normalizedFiles.length > 0
    && changedSlugs.length > 0
    && normalizedFiles.every((file) => (
      routineBlogFiles.has(file)
      || routineBlogPrefixes.some((prefix) => file.startsWith(prefix))
    ))

  return {
    blogOnly: routineBlogOnly,
    changedSlugs,
    files: normalizedFiles,
    scope: routineBlogOnly ? 'blog-only' : 'full',
  }
}

function changedFiles(baseSha, headSha) {
  return execFileSync(
    'git',
    ['diff', '--name-only', '--diff-filter=ACMR', baseSha, headSha],
    { encoding: 'utf8' },
  ).split('\n')
}

function writeGitHubOutput(result) {
  if (!process.env.GITHUB_OUTPUT) return
  appendFileSync(process.env.GITHUB_OUTPUT, [
    `scope=${result.scope}`,
    `blog_only=${result.blogOnly}`,
    `changed_slugs=${result.changedSlugs.join(',')}`,
    '',
  ].join('\n'))
}

const isEntryPoint = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href

if (isEntryPoint) {
  const [baseSha, headSha] = process.argv.slice(2)
  if (!baseSha || !headSha) {
    console.error('Usage: classify-blog-change.mjs <base-sha> <head-sha>')
    process.exit(1)
  }
  const result = classifyChangedFiles(changedFiles(baseSha, headSha))
  writeGitHubOutput(result)
  console.log(JSON.stringify(result))
}
