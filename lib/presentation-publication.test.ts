import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const deck = readFileSync(
  path.join(
    process.cwd(),
    'public/presentations/youtube-monetization-me-too-me-better/index.html',
  ),
  'utf8',
)

describe('YouTube monetization presentation', () => {
  it('keeps attribution in metadata without showing a credit line', () => {
    expect(deck).toContain('name="design-system-attribution"')
    expect(deck).toContain('rel="license"')
    expect(deck).not.toContain('>Layout system by ESTHER')
    expect(deck).toContain(
      'src="/presentations/youtube-monetization-me-too-me-better/fengtalk-circle-logo.png"',
    )
  })
})
