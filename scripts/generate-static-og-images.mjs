import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { archivedNewsletterIds, publishedPostSlugs } from '../lib/public-content-routes.ts'

const root = process.cwd()
const outputDir = path.join(root, 'public/generated-og')
await mkdir(outputDir, { recursive: true })
const escapeXml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
const wrap = (value, length = 34) => { const chars = [...value]; const lines = []; while (chars.length) lines.push(chars.splice(0, length).join('')); return lines.slice(0, 3) }
async function render(file, title, description) {
  const lines = wrap(description)
  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="630" fill="#f4f0e8"/><rect x="54" y="44" width="1092" height="542" rx="8" fill="#f9f8f5" stroke="#dedbd2"/><path d="M82 96h72M82 108h48" stroke="#b8b2a6" stroke-width="3" stroke-linecap="round"/><text x="104" y="260" fill="#0a0a0a" font-family="Arial,sans-serif" font-size="68" font-weight="700">${escapeXml(title)}</text>${lines.map((line, i) => `<text x="108" y="${338 + i * 50}" fill="#737373" font-family="Arial,sans-serif" font-size="30">${escapeXml(line)}</text>`).join('')}<text x="108" y="532" fill="#8b867b" font-family="Arial,sans-serif" font-size="22">matthew-miao.com</text></svg>`
  await sharp(Buffer.from(svg)).png().toFile(path.join(outputDir, file))
}
const sections = {
  home: { zh: ['老苗', 'Web coding、AI Agent、自动化、outreach 与企业知识系统。'], en: ['Matthew Miao', 'Web coding, AI agents, automation, outreach, and company knowledge systems.'] },
  blog: { zh: ['写作', '关于 AI Agent、自动化与产品实践的记录。'], en: ['Writing', 'Notes on AI agents, automation, and building products.'] },
  photos: { zh: ['照片', '工作、生活和旅途中留下的一些瞬间。'], en: ['Photos', 'Moments from work, life, and everywhere in between.'] },
  projects: { zh: ['项目', '认真做过的产品、工具和小实验。'], en: ['Projects', 'Products, tools, and small experiments made with care.'] },
  ama: { zh: ['一对一', '用一小时聊清楚判断、取舍与下一步。'], en: ['AMA', 'A focused one-to-one conversation about what to do next.'] },
}
for (const [section, locales] of Object.entries(sections)) for (const [locale, [title, description]] of Object.entries(locales)) await render(`${locale}-${section}.png`, title, description)
for (const slug of publishedPostSlugs) for (const locale of ['zh', 'en']) {
  const source = await readFile(path.join(root, 'content/blog', slug, locale === 'zh' ? 'index.mdx' : 'index.en.mdx'), 'utf8')
  await render(`${locale}-blog-${slug}.png`, source.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? slug, source.match(/^description:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? '')
}
for (const id of archivedNewsletterIds) for (const locale of ['zh', 'en']) {
  const source = await readFile(path.join(root, 'content/newsletters', id, locale === 'zh' ? 'index.mdx' : 'index.en.mdx'), 'utf8')
  await render(`${locale}-newsletter-${id}.png`, source.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? `Newsletter ${id}`, source.match(/^description:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? '')
}
console.log('Generated static Open Graph images')
