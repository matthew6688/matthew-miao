#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import sharp from 'sharp'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'

import { videoEmbedUrls } from '../../../../lib/blog/video-embed.ts'

const [slug, ...flags] = process.argv.slice(2)
const draft = flags.includes('--draft')
const checkLinks = flags.includes('--check-links')
const failures = []
const warnings = []
const fail = (message) => failures.push(message)
const allowedComponents = new Set([
  'InlineProductName',
  'PhotoStack',
  'PhotoStackCaption',
  'PhotoStackFrames',
  'TimeAllocationChart',
  'Tweet',
  'VideoEmbed',
])

function parseEdition(edition, source) {
  const parsed = matter(source)
  const rawFrontmatter = source.match(/^---\n([\s\S]*?)\n---/u)?.[1] ?? ''
  let tree
  try {
    tree = unified().use(remarkParse).use(remarkMdx).parse(parsed.content)
  } catch {
    fail(`${edition} is not valid MDX`)
    return { data: parsed.data, rawFrontmatter, links: [], media: [], videos: [] }
  }
  const links = []
  const media = []
  const videos = []
  visit(tree, (node) => {
    if (['mdxjsEsm', 'mdxFlowExpression', 'mdxTextExpression', 'html'].includes(node.type)) {
      fail(`${edition} contains forbidden executable MDX or raw HTML`)
    }
    if (node.type === 'link') links.push(node.url)
    if (node.type === 'image') media.push({ alt: node.alt, url: node.url })
    if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
      if (!allowedComponents.has(node.name)) {
        fail(`${edition} uses unsupported MDX component ${node.name ?? '(fragment)'}`)
        return
      }
      const attributes = {}
      for (const attribute of node.attributes) {
        if (attribute.type !== 'mdxJsxAttribute' || typeof attribute.value !== 'string') {
          fail(`${edition} component attributes must be literal strings`)
          continue
        }
        attributes[attribute.name] = attribute.value
      }
      if (node.name === 'VideoEmbed') videos.push(attributes)
    }
  })
  return { data: parsed.data, rawFrontmatter, links, media, videos }
}

function validateFrontmatter(edition, data, rawFrontmatter) {
  const allowed = edition === 'index.mdx'
    ? ['title', 'description', 'publishedAt', 'cover', 'coverWidth', 'coverHeight', 'coverCaption']
    : ['title', 'description']
  for (const key of Object.keys(data)) {
    if (!allowed.includes(key)) fail(`${edition} has unsupported frontmatter field ${key}`)
  }
  if (typeof data.title !== 'string' || !data.title.trim()) fail(`${edition} needs a title`)
  if (typeof data.description !== 'string' || !data.description.trim()) fail(`${edition} needs a description`)
  if (edition === 'index.mdx') {
    const literal = rawFrontmatter.match(/^publishedAt:\s*["']([^"']+)["']\s*$/mu)?.[1]
    if (Number.isNaN(new Date(literal ?? '').valueOf()) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(literal ?? '')) {
      fail('index.mdx needs publishedAt as an exact ISO UTC timestamp')
    }
  }
}

function validateVideo(edition, attributes) {
  if (!attributes.title?.trim()) fail(`${edition} VideoEmbed needs a descriptive title`)
  try {
    return videoEmbedUrls(attributes).verification
  } catch (error) {
    fail(`${edition} ${error.message}`)
    return null
  }
}

function loadEvidence(directory) {
  const target = path.join(directory, 'publication.json')
  if (!existsSync(target)) return { media: {}, manualChecks: [] }
  try {
    const evidence = JSON.parse(readFileSync(target, 'utf8'))
    return {
      media: evidence.media && typeof evidence.media === 'object' ? evidence.media : {},
      manualChecks: Array.isArray(evidence.manualChecks) ? evidence.manualChecks : [],
    }
  } catch {
    fail('publication.json is invalid JSON')
    return { media: {}, manualChecks: [] }
  }
}

function hasManualCheck(manualChecks, url) {
  return manualChecks.some((check) => {
    if (check?.url !== url || typeof check.note !== 'string' || !check.note.trim()) return false
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(check.checkedAt ?? '')) return false
    const checkedAt = new Date(check.checkedAt)
    const age = Date.now() - checkedAt.valueOf()
    return !Number.isNaN(age) && age >= 0 && age <= 90 * 24 * 60 * 60 * 1000
  })
}

async function verifyResource(url, manualChecks) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)
  try {
    let response = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal })
    if (response.status === 405 || response.status === 403) {
      response = await fetch(url, { method: 'GET', headers: { range: 'bytes=0-0' }, redirect: 'follow', signal: controller.signal })
    }
    if (response.ok) return
    if (hasManualCheck(manualChecks, url)) {
      warnings.push(`manual check accepted for HTTP ${response.status}: ${url}`)
      return
    }
    fail(`resource returned HTTP ${response.status}: ${url}`)
  } catch {
    if (hasManualCheck(manualChecks, url)) warnings.push(`manual check accepted for unreachable resource: ${url}`)
    else fail(`resource is unreachable: ${url}`)
  } finally {
    clearTimeout(timeout)
  }
}

if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  fail('provide one lowercase kebab-case slug')
} else {
  const root = process.cwd()
  const directory = path.join(root, 'content', 'blog', slug)
  const editions = {}
  for (const edition of ['index.mdx', 'index.en.mdx']) {
    const target = path.join(directory, edition)
    if (!existsSync(target)) {
      fail(`missing ${path.relative(root, target)}`)
      continue
    }
    const source = readFileSync(target, 'utf8')
    if (/\b(?:TODO|PLACEHOLDER)\b/u.test(source)) fail(`${edition} contains a placeholder`)
    editions[edition] = parseEdition(edition, source)
    validateFrontmatter(edition, editions[edition].data, editions[edition].rawFrontmatter)
  }

  const zh = editions['index.mdx']
  const en = editions['index.en.mdx']
  if (zh?.data.description && [...zh.data.description].length > 80) fail('Chinese description exceeds 80 characters')
  if (en?.data.description && en.data.description.length > 160) fail('English description exceeds 160 characters')

  const evidence = loadEvidence(directory)
  const referencedMedia = new Set()
  if (zh?.data.cover) {
    const { cover, coverWidth, coverHeight } = zh.data
    if (typeof cover !== 'string' || !/^\.\/[A-Za-z0-9_.-]+$/.test(cover)) fail('cover must use ./file.ext format')
    if (!Number.isInteger(coverWidth) || coverWidth <= 0 || !Number.isInteger(coverHeight) || coverHeight <= 0) {
      fail('cover requires exact positive coverWidth and coverHeight')
    } else {
      const file = cover.slice(2)
      const target = path.join(directory, file)
      referencedMedia.add(file)
      if (!existsSync(target)) fail(`cover references missing media ${cover}`)
      else {
        const metadata = await sharp(target).metadata()
        if (metadata.width !== coverWidth || metadata.height !== coverHeight) {
          fail(`${file} is ${metadata.width}x${metadata.height}, not ${coverWidth}x${coverHeight}`)
        }
      }
    }
  } else if (zh && (zh.data.coverWidth || zh.data.coverHeight || zh.data.coverCaption)) {
    fail('cover metadata requires cover')
  }

  const resources = new Set()
  for (const [edition, parsed] of Object.entries(editions)) {
    for (const href of parsed.links) {
      if (/^https:\/\//i.test(href)) resources.add(href)
      else if (/^mailto:[^\s@]+@[^\s@]+$/i.test(href) || /^#[A-Za-z0-9_-]+$/.test(href) || /^\/(?!\/)[^\s]*$/.test(href)) {
        // Explicitly permitted same-site, heading, and email destinations.
      } else {
        fail(`${edition} link must use HTTPS or a safe same-site destination: ${href}`)
      }
    }
    for (const image of parsed.media) {
      if (!image.alt?.trim()) fail(`${edition} has an image without alt text`)
      const match = image.url.match(/^\.\/([A-Za-z0-9_.-]+\.(?:png|jpe?g|webp|gif|avif))#(\d+)x(\d+)$/iu)
      if (!match) {
        fail(`${edition} image needs ./file.ext#WIDTHxHEIGHT format`)
        continue
      }
      const [, file, width, height] = match
      referencedMedia.add(file)
      const target = path.join(directory, file)
      if (!existsSync(target)) fail(`${edition} references missing media ${file}`)
      else {
        const metadata = await sharp(target).metadata()
        if (metadata.width !== Number(width) || metadata.height !== Number(height)) {
          fail(`${file} is ${metadata.width}x${metadata.height}, not ${width}x${height}`)
        }
      }
    }
    for (const video of parsed.videos) {
      const verification = validateVideo(edition, video)
      if (verification) resources.add(verification)
    }
  }

  const allMediaFiles = readdirSync(directory).filter((file) => /\.(?:png|jpe?g|webp|gif|avif|svg)$/i.test(file))
  for (const file of allMediaFiles.filter((file) => /\.svg$/i.test(file))) {
    fail(`unsupported SVG media must be converted to WebP or Mermaid: ${file}`)
  }
  const mediaFiles = allMediaFiles.filter((file) => !/\.svg$/i.test(file))
  for (const file of mediaFiles) {
    if (!referencedMedia.has(file)) fail(`unreferenced media file must be removed: ${file}`)
    const record = evidence.media[file]
    if (!record || !['owned', 'generated', 'licensed', 'public-domain'].includes(record.rights) || typeof record.source !== 'string' || !record.source.trim()) {
      fail(`publication.json needs source and rights evidence for ${file}`)
    }
  }
  for (const file of Object.keys(evidence.media)) {
    if (!mediaFiles.includes(file)) fail(`publication.json references missing media ${file}`)
  }

  const routesPath = path.join(root, 'lib/public-content-routes.ts')
  const transitionsPath = path.join(root, 'lib/view-transition-name.ts')
  if (!existsSync(routesPath) || !existsSync(transitionsPath)) fail('missing publication route registries')
  else {
    const registered = readFileSync(routesPath, 'utf8').includes(`'${slug}'`)
    const transitioned = readFileSync(transitionsPath, 'utf8').includes(`case '${slug}':`)
    if (draft && (registered || transitioned)) fail('draft slug is already exposed through a public registry')
    if (!draft && !registered) fail('slug is not in publishedPostSlugs')
    if (!draft && !transitioned) fail('slug has no view-transition ID')
  }

  if (checkLinks) for (const url of resources) await verifyResource(url, evidence.manualChecks)
}

for (const warning of warnings) console.warn(`publish-matthew-blog: warning: ${warning}`)
if (failures.length) {
  for (const message of failures) console.error(`publish-matthew-blog: ${message}`)
  process.exitCode = 1
} else {
  console.log(`publish-matthew-blog: ${slug} is valid (${draft ? 'draft' : 'publish'})`)
}
