import { notFound } from 'next/navigation'

import { ProductDetailPageView } from '../../../_views/product-detail-page'
import { localeMetadata } from '~/lib/locale-metadata'
import { getProjectBySlug, isProjectSlug, projects } from '~/lib/projects'

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!isProjectSlug(slug)) return {}
  const project = getProjectBySlug(slug)
  return localeMetadata({
    locale: 'zh',
    path: `/projects/${slug}`,
    title: project.name,
    description: project.description,
  })
}

export default async function ChineseProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (!isProjectSlug(slug)) notFound()
  return <ProductDetailPageView locale="zh" project={getProjectBySlug(slug)} />
}
