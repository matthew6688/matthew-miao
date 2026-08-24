import { notFound } from 'next/navigation'

import { ExperimentDetailPageView } from '../../../../_views/experiment-detail-page'
import {
  experimentSlugs,
  getExperimentBySlug,
  isExperimentSlug,
} from '~/lib/experiments'
import { localeMetadata } from '~/lib/locale-metadata'

export function generateStaticParams() {
  return experimentSlugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!isExperimentSlug(slug)) return {}
  const experiment = getExperimentBySlug(slug)
  return localeMetadata({
    locale: 'en',
    path: `/build-in-public/${slug}`,
    title: experiment.nameEn,
    description: experiment.descriptionEn,
  })
}

export default async function EnglishExperimentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (!isExperimentSlug(slug)) notFound()
  return <ExperimentDetailPageView locale="en" experiment={getExperimentBySlug(slug)} />
}
