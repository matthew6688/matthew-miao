import type { MetadataRoute } from 'next'

import { getAllPosts } from '~/lib/content'
import { experiments } from '~/lib/experiments'
import { localeRoutePair } from '~/lib/locale-metadata'
import { archivedNewsletterIds } from '~/lib/newsletters'
import { projects } from '~/lib/projects'
import { presentations, presentationPath } from '~/lib/presentations'
import { seo } from '~/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts()
  // newest first per getAllPosts — the site "changed" when the latest post landed
  const latest = posts[0]?.publishedAt

  const pairedEntry = (path: string, lastModified?: Date): MetadataRoute.Sitemap => {
    const pair = localeRoutePair(path)
    const alternates = { languages: pair.languages }

    return [
      { url: pair.zh.href, lastModified, alternates },
      { url: pair.en.href, lastModified, alternates },
    ]
  }

  return [
    ...pairedEntry('/', latest),
    ...pairedEntry('/blog', latest),
    ...pairedEntry('/build-in-public', latest),
    ...pairedEntry('/photos', latest),
    ...pairedEntry('/presentations', latest),
    ...pairedEntry('/projects', latest),
    ...presentations.map((presentation) => ({
      url: new URL(presentationPath(presentation.slug), seo.url).href,
      lastModified: presentation.publishedAt,
    })),
    ...projects.flatMap((project) => pairedEntry(`/projects/${project.slug}`, latest)),
    ...experiments.flatMap((experiment) =>
      pairedEntry(`/build-in-public/${experiment.slug}`, latest),
    ),
    ...pairedEntry('/ama'),
    ...archivedNewsletterIds.flatMap((id) => pairedEntry(`/newsletters/${id}`)),
    ...posts.flatMap((post) => pairedEntry(`/blog/${post.slug}`, post.publishedAt)),
  ]
}
