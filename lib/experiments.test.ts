import { describe, expect, it } from 'vitest'

import {
  experiments,
  experimentSlugs,
  getExperimentBySlug,
  isExperimentSlug,
} from './experiments'
import { isProjectSlug } from './projects'

describe('Build in Public experiment registry', () => {
  it('publishes the two confirmed experiments with bilingual copy', () => {
    expect(experimentSlugs).toEqual(['youtube-channel', 'classroom-randomizer'])
    expect(new Set(experimentSlugs).size).toBe(experimentSlugs.length)

    for (const experiment of experiments) {
      expect(experiment.name).toBeTruthy()
      expect(experiment.nameEn).toBeTruthy()
      expect(experiment.description).toBeTruthy()
      expect(experiment.descriptionEn).toBeTruthy()
      expect(experiment.hypothesis).toBeTruthy()
      expect(experiment.hypothesisEn).toBeTruthy()
      expect(experiment.tags.length).toBe(experiment.tagsEn.length)
      expect(isExperimentSlug(experiment.slug)).toBe(true)
      expect(getExperimentBySlug(experiment.slug)).toEqual(experiment)
      if (experiment.productSlug) expect(isProjectSlug(experiment.productSlug)).toBe(true)
    }
  })

  it('rejects unregistered experiment slugs', () => {
    expect(isExperimentSlug('unverified-revenue-test')).toBe(false)
  })
})
