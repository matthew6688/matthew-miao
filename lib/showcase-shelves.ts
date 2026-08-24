import { experiments } from './experiments'
import { projects } from './projects'

export const productShelfItems = projects.map((project) => ({
  title: project.name,
  titleEn: project.nameEn,
  author: project.category,
  authorEn: project.categoryEn,
  category: project.category,
  spineAuthor: project.domain,
  spineColor: project.shelfColor,
  spineInk: project.shelfInk,
  spine: 24,
  url: `/projects/${project.slug}`,
  external: false,
}))

export const experimentShelfItems = experiments.map((experiment) => ({
  artist: experiment.categoryLabel,
  artistEn: experiment.categoryLabelEn,
  album: experiment.name,
  albumEn: experiment.nameEn,
  genre: experiment.statusLabel,
  genreEn: experiment.statusLabelEn,
  spineColor: experiment.shelfColor,
  spineInk: experiment.shelfInk,
  url: `/build-in-public/${experiment.slug}`,
  external: false,
}))
