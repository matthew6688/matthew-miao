import { notFound } from 'next/navigation'

import { ProductDetailPageView } from '../../../../_views/product-detail-page'
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
    locale: 'en',
    path: `/projects/${slug}`,
    title: project.nameEn,
    description: project.descriptionEn ?? project.description,
  })
}

export default async function EnglishProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (!isProjectSlug(slug)) notFound()
  return <ProductDetailPageView locale="en" project={getProjectBySlug(slug)} />
}
