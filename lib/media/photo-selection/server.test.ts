import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getPublishedSelection: vi.fn(),
  getRepositoryPhotoSelection: vi.fn(),
}))

vi.mock('server-only', () => ({}))
// The 'use cache' directive is inert under Vitest, so the function body
// runs directly; cacheTag/cacheLife just need to be no-ops.
vi.mock('next/cache', () => ({
  cacheTag: () => undefined,
  cacheLife: () => undefined,
}))
vi.mock('~/db', () => ({ getDatabase: vi.fn() }))
vi.mock('./repository', () => ({
  PUBLIC_PHOTO_SELECTION_CACHE_TAG: 'media:published-photo-selection',
  createPublicPhotoSelectionRepository: () => ({
    getPublishedSelection: mocks.getPublishedSelection,
  }),
}))
vi.mock('./repository-publication', () => ({
  getRepositoryPhotoSelection: mocks.getRepositoryPhotoSelection,
}))
vi.mock('../storage/config', () => ({
  parseMediaPublicBaseUrl: () => new URL('https://matthew-miao.com/media/'),
}))

import { getPublishedPhotoSelection } from './server'

beforeEach(() => {
  vi.stubEnv('PHOTO_PUBLICATION_MODE', 'database')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

describe('Published Photo Selection server read', () => {
  it('restores dates serialized by the cache', async () => {
    mocks.getPublishedSelection.mockResolvedValueOnce({
      revision: 'selection-1',
      publishedAt: '2026-07-15T09:00:00.000Z',
      count: 2,
      items: [
        {
          id: 'photo-1',
          width: 1600,
          height: 1200,
          altText: { zhHans: '海边', en: 'The coast' },
          renditions: [],
          capturedAt: '2026-07-14T08:30:00.000Z',
        },
        {
          id: 'photo-2',
          width: 1200,
          height: 1600,
          altText: { zhHans: '街道', en: 'A street' },
          renditions: [],
        },
      ],
    })

    const selection = await getPublishedPhotoSelection()

    expect(selection?.publishedAt).toEqual(
      new Date('2026-07-15T09:00:00.000Z'),
    )
    expect(selection?.publishedAt).toBeInstanceOf(Date)
    expect(selection?.items[0]?.capturedAt).toEqual(
      new Date('2026-07-14T08:30:00.000Z'),
    )
    expect(selection?.items[0]?.capturedAt).toBeInstanceOf(Date)
    expect(selection?.items[1]).not.toHaveProperty('capturedAt')
  })

  it('returns the empty public state when the database is unavailable', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    mocks.getPublishedSelection.mockRejectedValueOnce(
      new Error('Database unavailable'),
    )

    await expect(getPublishedPhotoSelection()).resolves.toBeNull()
    consoleError.mockRestore()
  })

  it('uses repository publication only in explicit bootstrap mode', async () => {
    vi.stubEnv('PHOTO_PUBLICATION_MODE', 'repository-bootstrap')
    const repositorySelection = {
      revision: 'repository-1',
      publishedAt: new Date('2026-08-10T02:00:00.000Z'),
      count: 1,
      items: [],
    }
    mocks.getRepositoryPhotoSelection.mockReturnValueOnce(repositorySelection)

    await expect(getPublishedPhotoSelection()).resolves.toBe(repositorySelection)
    expect(mocks.getPublishedSelection).not.toHaveBeenCalled()
  })

  it('treats an active empty database publication as authoritative', async () => {
    const emptySelection = {
      revision: 'selection-empty',
      publishedAt: new Date('2026-08-10T02:00:00.000Z'),
      count: 0,
      items: [],
    }
    mocks.getPublishedSelection.mockResolvedValueOnce(emptySelection)
    mocks.getRepositoryPhotoSelection.mockReturnValueOnce({ items: [{}] })

    await expect(getPublishedPhotoSelection()).resolves.toEqual(emptySelection)
    expect(mocks.getRepositoryPhotoSelection).not.toHaveBeenCalled()
  })

  it('logs the swallowed error before rendering the empty state', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const failure = new Error('Database unavailable')
    mocks.getPublishedSelection.mockRejectedValueOnce(failure)

    await expect(getPublishedPhotoSelection()).resolves.toBeNull()
    expect(consoleError).toHaveBeenCalledWith(
      '[photo-selection] read failed; rendering the fail-closed empty state',
      failure,
    )
    consoleError.mockRestore()
  })

  it('rethrows from the cached read on Vercel so a deploy fails loudly, while the caller still renders the empty state at runtime', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const failure = new Error('Database unavailable')
    mocks.getPublishedSelection.mockRejectedValueOnce(failure)

    await expect(getPublishedPhotoSelection()).resolves.toBeNull()
    expect(consoleError).toHaveBeenCalledWith(
      '[photo-selection] public read failed; rendering the fail-closed empty state',
      failure,
    )
    consoleError.mockRestore()
  })
})
