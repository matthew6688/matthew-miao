import Image from 'next/image'
import Link from 'next/link'

import { ExternalLabel } from '~/components/external-mark'
import { PixelCluster } from '~/components/pixel-cluster'
import { PostArchive } from '~/components/post-archive'
import { SectionTitle } from '~/components/section-title'
import { getPostsByExperiment } from '~/lib/content'
import { experiments } from '~/lib/experiments'
import { T } from '~/lib/i18n'
import { localePath, type Locale } from '~/lib/locale-route'
import type { Project } from '~/lib/projects'

export function ProductDetailPageView({
  locale,
  project,
}: {
  locale: Locale
  project: Project
}) {
  const relatedExperiments = experiments.filter(
    (experiment) => experiment.productSlug === project.slug,
  )
  const relatedPosts = relatedExperiments.flatMap((experiment) =>
    getPostsByExperiment(experiment.slug),
  )

  return (
    <div className="mx-auto w-full max-w-[37.5rem] px-6">
      <header className="relative">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="page-eyebrow enter">
              <T zh="产品" en="Product" />
            </p>
            <h1 className="enter mt-4 text-[1.75rem] leading-tight font-semibold tracking-[-0.025em] text-balance sm:text-[2rem]">
              <T zh={project.name} en={project.nameEn} />
            </h1>
          </div>
          <div className="enter flex shrink-0 items-center gap-3">
            <Image src={project.icon} alt="" width={48} height={48} className="rounded-[10px]" />
            <PixelCluster variant={3} className="hidden sm:block" />
          </div>
        </div>
        <p className="page-introduction enter mt-5 text-balance" style={{ '--enter-delay': '70ms' } as React.CSSProperties}>
          <T zh={project.description} en={project.descriptionEn ?? project.description} />
        </p>
      </header>

      <dl className="mt-10 text-sm">
        <div className="hairline-top grid grid-cols-[7rem_1fr] gap-4 py-3">
          <dt className="text-muted-foreground"><T zh="状态" en="Status" /></dt>
          <dd><T zh="已上线" en="Live" /></dd>
        </div>
        <div className="hairline-top grid grid-cols-[7rem_1fr] gap-4 py-3">
          <dt className="text-muted-foreground"><T zh="类型" en="Type" /></dt>
          <dd><T zh={project.category} en={project.categoryEn} /></dd>
        </div>
        <div className="hairline-top grid grid-cols-[7rem_1fr] gap-4 py-3">
          <dt className="text-muted-foreground"><T zh="访问" en="Visit" /></dt>
          <dd>
            <a href={project.url} target="_blank" rel="noreferrer" className="font-medium transition-colors duration-150 hover:text-muted-foreground">
              <ExternalLabel>{project.domain}</ExternalLabel>
            </a>
          </dd>
        </div>
      </dl>

      {relatedExperiments.length > 0 && (
        <section className="mt-16">
          <SectionTitle index="01" delay={160}>
            <T zh="相关实验" en="Related experiments" />
          </SectionTitle>
          <ul className="focus-list mt-4 flex flex-col">
            {relatedExperiments.map((experiment) => (
              <li key={experiment.slug} className="hairline-top py-3">
                <Link href={localePath(locale, `/build-in-public/${experiment.slug}`)} className="group flex items-baseline justify-between gap-4">
                  <span className="font-medium group-hover:text-muted-foreground">
                    <T zh={experiment.name} en={experiment.nameEn} />
                  </span>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    <T zh={experiment.statusLabel} en={experiment.statusLabelEn} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {relatedPosts.length > 0 && (
        <section className="mt-16">
          <SectionTitle index="02" delay={220}>
            <T zh="构建记录" en="Build log" />
          </SectionTitle>
          <div className="mt-5">
            <PostArchive posts={relatedPosts} locale={locale} />
          </div>
        </section>
      )}
    </div>
  )
}
