import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { presentations } from './presentations'

describe('published presentations', () => {
  it('keeps the registry and public files aligned', () => {
    for (const presentation of presentations) {
      const file = path.join(
        process.cwd(),
        'public/presentations',
        presentation.slug,
        'index.html',
      )
      expect(existsSync(file), presentation.slug).toBe(true)

      const deck = readFileSync(file, 'utf8')
      expect(deck).toContain('name="design-system-attribution"')
      expect(deck).toContain('rel="license"')
      expect(deck).not.toContain('>Layout system by ESTHER')
      expect(deck).not.toMatch(/file:\/\/|\/Users\/|src="\.\//)
    }
  })

  it('keeps the original deck on its approved FengTalk asset', () => {
    const deck = readFileSync(
      path.join(
        process.cwd(),
        'public/presentations/youtube-monetization-me-too-me-better/index.html',
      ),
      'utf8',
    )
    expect(deck).toContain(
      'src="/presentations/youtube-monetization-me-too-me-better/fengtalk-circle-logo.png"',
    )
  })

  it('publishes the new deck from its registered content artifact', () => {
    const deck = readFileSync(
      path.join(
        process.cwd(),
        'public/presentations/six-months-two-ai-products/index.html',
      ),
      'utf8',
    )
    expect(deck).toContain('"content_project_id":"c942ec69-2a44-497c-934c-ca629551a400"')
    expect(deck).toContain('"skill":"esther-design-system"')
    expect(deck).toContain('src="data:image/jpeg;base64,')
  })
})
