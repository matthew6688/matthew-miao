// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { SiteFooter } from './site-footer'
import { siteProfile } from '~/lib/site-profile'

afterEach(cleanup)

describe('SiteFooter', () => {
  it('renders the canonical copyright year without a runtime cache dependency', () => {
    render(
      <SiteFooter
        github={{ user: 'matthew6688', followers: 0, total: 0, to: '', levels: '' }}
        x={{
          name: 'fengtalk.ai',
          handle: 'fengtalk_ai',
          bio: 'AI Agent 与自动化',
          bioEn: 'AI agents and automation',
        }}
      />,
    )

    expect(screen.getByText(new RegExp(`© ${siteProfile.copyright.year}`))).toBeTruthy()
  })
})
