import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { repositoryCatalogToSelection } from './repository-publication'

describe('repository photo publication', () => {
  it('exposes only published entries through the existing public selection contract', () => {
    const checksumSha256 = 'a'.repeat(64)
    const selection = repositoryCatalogToSelection({
      version: 1,
      revision: 'photos-2',
      publishedAt: '2026-08-10T02:00:00.000Z',
      items: [
        {
          id: 'creek-portrait',
          published: true,
          width: 1279,
          height: 1706,
          altText: { zhHans: 'Matthew 坐在溪流旁', en: 'Matthew sitting beside a creek' },
          rights: 'owned',
          importedAt: '2026-08-10T01:00:00.000Z',
          renditions: [
            { profileWidth: 640, fileName: 'creek-portrait-640.jpg', width: 640, height: 853, checksumSha256 },
            { profileWidth: 1024, fileName: 'creek-portrait-1024.jpg', width: 1024, height: 1366, checksumSha256 },
            { profileWidth: 1600, fileName: 'creek-portrait-1600.jpg', width: 1279, height: 1706, checksumSha256 },
            { profileWidth: 2560, fileName: 'creek-portrait-2560.jpg', width: 1279, height: 1706, checksumSha256 },
          ],
        },
        {
          id: 'private-draft',
          published: false,
          width: 1200,
          height: 900,
          altText: { zhHans: '未发布照片', en: 'Unpublished photo' },
          rights: 'owned',
          importedAt: '2026-08-10T01:30:00.000Z',
          renditions: [
            { profileWidth: 640, fileName: 'private-draft-640.jpg', width: 640, height: 480, checksumSha256 },
            { profileWidth: 1024, fileName: 'private-draft-1024.jpg', width: 1024, height: 768, checksumSha256 },
            { profileWidth: 1600, fileName: 'private-draft-1600.jpg', width: 1200, height: 900, checksumSha256 },
            { profileWidth: 2560, fileName: 'private-draft-2560.jpg', width: 1200, height: 900, checksumSha256 },
          ],
        },
      ],
    })

    expect(selection).toEqual({
      revision: 'photos-2',
      publishedAt: new Date('2026-08-10T02:00:00.000Z'),
      count: 1,
      items: [
        {
          id: 'creek-portrait',
          width: 1279,
          height: 1706,
          altText: { zhHans: 'Matthew 坐在溪流旁', en: 'Matthew sitting beside a creek' },
          focalPoint: { x: 0.5, y: 0.5 },
          renditions: [
            {
              profileWidth: 640,
              src: '/images/photos/creek-portrait/creek-portrait-640.jpg',
              width: 640,
              height: 853,
            },
            {
              profileWidth: 1024,
              src: '/images/photos/creek-portrait/creek-portrait-1024.jpg',
              width: 1024,
              height: 1366,
            },
            {
              profileWidth: 1600,
              src: '/images/photos/creek-portrait/creek-portrait-1600.jpg',
              width: 1279,
              height: 1706,
            },
            {
              profileWidth: 2560,
              src: '/images/photos/creek-portrait/creek-portrait-2560.jpg',
              width: 1279,
              height: 1706,
            },
          ],
        },
      ],
    })
  })

  it('rejects unsafe ids and rendition paths', () => {
    expect(() =>
      repositoryCatalogToSelection({
        version: 1,
        revision: 'photos-unsafe',
        publishedAt: '2026-08-10T02:00:00.000Z',
        items: [
          {
            id: '../escape',
            published: true,
            width: 100,
            height: 100,
            altText: { zhHans: '测试', en: 'Test' },
            rights: 'owned',
            importedAt: '2026-08-10T01:00:00.000Z',
            renditions: [
              { profileWidth: 100, fileName: '../escape.jpg', width: 100, height: 100 },
            ],
          },
        ],
      }),
    ).toThrow('Invalid repository photo catalog')
  })
})
