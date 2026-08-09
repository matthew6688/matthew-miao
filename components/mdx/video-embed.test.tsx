import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { VideoEmbed } from './video-embed'

describe('VideoEmbed', () => {
  it('loads a privacy-enhanced YouTube player only after consent', () => {
    render(
      <VideoEmbed
        provider="youtube"
        id="dQw4w9WgXcQ"
        title="Agent workflow demo"
        caption="A walkthrough"
        locale="en"
      />,
    )

    expect(screen.queryByTitle('Agent workflow demo')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /play embedded video/i }))

    expect(screen.getByTitle('Agent workflow demo').getAttribute('src')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0',
    )
    expect(screen.getByText('A walkthrough')).not.toBeNull()
  })

  it('rejects malformed provider identifiers instead of emitting arbitrary frames', () => {
    expect(() =>
      render(
        <VideoEmbed
          provider="vimeo"
          id="https://evil.example/video"
          title="Unsafe"
          locale="zh"
        />,
      ),
    ).toThrow('Invalid Vimeo video ID')
  })
})
// @vitest-environment jsdom
