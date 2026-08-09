#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const slug = process.argv[2]
const fail = (message) => {
  console.error(`publish-matthew-blog: ${message}`)
  process.exitCode = 1
}

if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  fail('provide one lowercase kebab-case slug')
} else {
  const root = process.cwd()
  const directory = path.join(root, 'content', 'blog', slug)
  const files = ['index.mdx', 'index.en.mdx']
  const source = {}

  for (const file of files) {
    const target = path.join(directory, file)
    if (!existsSync(target)) {
      fail(`missing ${path.relative(root, target)}`)
      continue
    }
    source[file] = readFileSync(target, 'utf8')
    const frontmatter = source[file].match(/^---\n([\s\S]*?)\n---/u)?.[1] ?? ''
    if (!/^title:\s*["'].+["']\s*$/mu.test(frontmatter)) fail(`${file} needs a title`)
    if (!/^description:\s*["'].+["']\s*$/mu.test(frontmatter)) {
      fail(`${file} needs a description`)
    }
    if (/\b(?:TODO|PLACEHOLDER)\b/u.test(source[file])) fail(`${file} contains a placeholder`)
  }

  if (source['index.mdx']) {
    if (!/^publishedAt:\s*["'].+["']\s*$/mu.test(source['index.mdx'])) {
      fail('index.mdx needs publishedAt')
    }
    const description = source['index.mdx'].match(/^description:\s*["'](.+)["']\s*$/mu)?.[1]
    if (description && [...description].length > 80) fail('Chinese description exceeds 80 characters')
  }

  if (source['index.en.mdx']) {
    const description = source['index.en.mdx'].match(/^description:\s*["'](.+)["']\s*$/mu)?.[1]
    if (description && description.length > 160) fail('English description exceeds 160 characters')
  }

  const checkedMedia = new Set()
  for (const [edition, body] of Object.entries(source)) {
    const markdownImages = [...body.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/gu)]
    for (const image of markdownImages) {
      const alt = image[1].trim()
      if (!alt) fail(`${edition} has an image without alt text`)
      const media = image[2].match(/^\.\/([A-Za-z0-9_.-]+)#(\d+)x(\d+)(?:\s+"[^"]*")?$/u)
      if (!media) {
        fail(`${edition} image needs ./file.ext#WIDTHxHEIGHT format`)
        continue
      }
      const [, file, declaredWidth, declaredHeight] = media
      const target = path.join(directory, file)
      if (!existsSync(target)) {
        fail(`${edition} references missing media ${file}`)
        continue
      }
      const key = `${file}:${declaredWidth}x${declaredHeight}`
      if (checkedMedia.has(key)) continue
      checkedMedia.add(key)
      const metadata = await sharp(target).metadata()
      if (metadata.width !== Number(declaredWidth) || metadata.height !== Number(declaredHeight)) {
        fail(`${file} is ${metadata.width}x${metadata.height}, not ${declaredWidth}x${declaredHeight}`)
      }
    }
  }

  const routes = readFileSync(path.join(root, 'lib/public-content-routes.ts'), 'utf8')
  if (!routes.includes(`'${slug}'`)) fail('slug is not in publishedPostSlugs')
  const transitions = readFileSync(path.join(root, 'lib/view-transition-name.ts'), 'utf8')
  if (!transitions.includes(`case '${slug}':`)) fail('slug has no view-transition ID')
}

if (!process.exitCode) console.log(`publish-matthew-blog: ${slug} is valid`)
