#!/usr/bin/env node

import path from 'node:path'
import sharp from 'sharp'

const [input, output, mode = 'inline'] = process.argv.slice(2)
if (!input || !output || !['inline', 'cover'].includes(mode)) {
  console.error('usage: prepare-image.mjs INPUT OUTPUT [inline|cover]')
  process.exit(1)
}
if (path.extname(output).toLowerCase() !== '.webp') {
  console.error('output must use the .webp extension')
  process.exit(1)
}

let pipeline = sharp(input).rotate()
pipeline = mode === 'cover'
  ? pipeline.resize(1600, 900, { fit: 'cover', position: 'attention' })
  : pipeline.resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })

await pipeline.webp({ quality: 86, effort: 5 }).toFile(output)
const metadata = await sharp(output).metadata()
console.log(JSON.stringify({
  file: path.basename(output),
  width: metadata.width,
  height: metadata.height,
  markdown: `![ALT](./${path.basename(output)}#${metadata.width}x${metadata.height} "CAPTION")`,
}, null, 2))
