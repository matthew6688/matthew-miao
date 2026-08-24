import { PixelCluster } from '~/components/pixel-cluster'
import { PostArchive } from '~/components/post-archive'
import { SectionTitle } from '~/components/section-title'
import { getPostsByExperiment } from '~/lib/content'
import type { Experiment } from '~/lib/experiments'
import { T } from '~/lib/i18n'
import type { Locale } from '~/lib/locale-route'

export function ExperimentDetailPageView({
  experiment,
  locale,
}: {
  experiment: Experiment
  locale: Locale
}) {
  const posts = getPostsByExperiment(experiment.slug)

  return (
    <div className="mx-auto w-full max-w-[37.5rem] px-6">
      <header>
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="page-eyebrow enter">
              <T zh="公开实验" en="Build in Public" />
            </p>
            <h1 className="enter mt-4 text-[1.75rem] leading-tight font-semibold tracking-[-0.025em] text-balance sm:text-[2rem]">
              <T zh={experiment.name} en={experiment.nameEn} />
            </h1>
          </div>
          <PixelCluster variant={2} className="enter shrink-0" />
        </div>
        <p className="page-introduction enter mt-5 text-balance" style={{ '--enter-delay': '70ms' } as React.CSSProperties}>
          <T zh={experiment.description} en={experiment.descriptionEn} />
        </p>
      </header>

      <dl className="mt-10 text-sm">
        <div className="hairline-top grid grid-cols-[7rem_1fr] gap-4 py-3">
          <dt className="text-muted-foreground"><T zh="状态" en="Status" /></dt>
          <dd><T zh={experiment.statusLabel} en={experiment.statusLabelEn} /></dd>
        </div>
        <div className="hairline-top grid grid-cols-[7rem_1fr] gap-4 py-3">
          <dt className="text-muted-foreground"><T zh="类别" en="Category" /></dt>
          <dd><T zh={experiment.categoryLabel} en={experiment.categoryLabelEn} /></dd>
        </div>
        <div className="hairline-top grid grid-cols-[7rem_1fr] gap-4 py-3">
          <dt className="text-muted-foreground"><T zh="标签" en="Tags" /></dt>
          <dd><T zh={experiment.tags.join(' · ')} en={experiment.tagsEn.join(' · ')} /></dd>
        </div>
      </dl>

      <section className="mt-12">
        <SectionTitle index="01" delay={150}>
          <T zh="假设" en="Hypothesis" />
        </SectionTitle>
        <p className="mt-4 text-sm leading-[1.8] text-muted-foreground">
          <T zh={experiment.hypothesis} en={experiment.hypothesisEn} />
        </p>
      </section>

      <section className="mt-16">
        <SectionTitle index="02" delay={210}>
          <T zh="更新" en="Updates" />
        </SectionTitle>
        {posts.length > 0 ? (
          <div className="mt-5">
            <PostArchive posts={posts} locale={locale} />
          </div>
        ) : (
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            <T zh="还没有公开更新。第一篇记录发布后会自动出现在这里。" en="No public updates yet. The first published entry will appear here automatically." />
          </p>
        )}
      </section>
    </div>
  )
}
