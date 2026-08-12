import { describe, expect, it, vi } from 'vitest'

import github from '~/content/github.json'
import social from '~/content/social.json'
import { siteProfile } from '~/lib/site-profile'

import { getGitHub, getSocial } from './social-live'

describe('shared social snapshots', () => {
  it('renders committed GitHub data without a runtime network dependency', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    expect(getGitHub()).toEqual(github)
    expect(fetchSpy).not.toHaveBeenCalled()

    fetchSpy.mockRestore()
  })

  it('keeps the confirmed X identity canonical without a runtime network dependency', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const snapshot = getSocial()

    expect(snapshot.x).toEqual({
      ...social.x,
      handle: siteProfile.links.x.handle,
    })
    expect(fetchSpy).not.toHaveBeenCalled()

    fetchSpy.mockRestore()
  })
})
