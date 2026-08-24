import { describe, expect, it } from 'vitest'

import { getProjectBySlug, isProjectSlug, projects } from './projects'

describe('product registry', () => {
  it('publishes the three confirmed products with stable unique slugs', () => {
    expect(projects.map((project) => project.slug)).toEqual([
      'fengtalk',
      'tradescope',
      'fengreach',
    ])
    expect(new Set(projects.map((project) => project.slug)).size).toBe(projects.length)

    for (const project of projects) {
      expect(project.url).toMatch(/^https:\/\//)
      expect(project.name).toBeTruthy()
      expect(project.nameEn).toBeTruthy()
      expect(project.description).toBeTruthy()
      expect(project.descriptionEn).toBeTruthy()
      expect(isProjectSlug(project.slug)).toBe(true)
      if (isProjectSlug(project.slug)) expect(getProjectBySlug(project.slug)).toEqual(project)
    }
  })

  it('rejects unregistered product slugs', () => {
    expect(isProjectSlug('unknown-product')).toBe(false)
  })
})
