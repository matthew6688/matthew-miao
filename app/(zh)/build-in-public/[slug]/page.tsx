import { notFound } from 'next/navigation'

import { ExperimentDetailPageView } from '../../../_views/experiment-detail-page'
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
    locale: 'zh',
    path: `/build-in-public/${slug}`,
    title: experiment.name,
    description: experiment.description,
  })
}

export default async function ChineseExperimentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (!isExperimentSlug(slug)) notFound()
  return <ExperimentDetailPageView locale="zh" experiment={getExperimentBySlug(slug)} />
}
