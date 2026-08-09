import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { getMediaAdminPageServices } from './server'

const mediaEnvironmentNames = [
  'MEDIA_PUBLIC_BASE_URL',
  'MEDIA_ENCRYPTION_KEY',
] as const

const previousEnvironment = Object.fromEntries(
  mediaEnvironmentNames.map((name) => [name, process.env[name]]),
)

afterEach(() => {
  for (const name of mediaEnvironmentNames) {
    const value = previousEnvironment[name]
    if (value === undefined) delete process.env[name]
    else process.env[name] = value
  }
})

describe('Media admin page services', () => {
  it('does not initialize write-only secrets while listing assets', () => {
    for (const name of mediaEnvironmentNames) delete process.env[name]
    process.env.MEDIA_PUBLIC_BASE_URL = 'https://matthew-miao.com/media/'

    const services = getMediaAdminPageServices()

    expect(services).toEqual({
      getDraft: expect.any(Function),
      listAssets: expect.any(Function),
      listTransfers: expect.any(Function),
    })
    expect(services).not.toHaveProperty('review')
    expect(services).not.toHaveProperty('selection')
  })
})
