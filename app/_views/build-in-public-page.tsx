import { WritingInkStage } from '~/components/hidden-list-stage'
import { PixelCluster } from '~/components/pixel-cluster'
import { PostArchive } from '~/components/post-archive'
import { getPostsBySeries } from '~/lib/content'
import { T } from '~/lib/i18n'
import type { Locale } from '~/lib/locale-route'
import { publicPageMetadata } from '~/lib/public-page-metadata'

export function BuildInPublicPageView({ locale }: { locale: Locale }) {
  const posts = getPostsBySeries('build-in-public')
  const copy = publicPageMetadata['build-in-public']

  return (
    <div className="mx-auto w-full max-w-[37.5rem] px-6">
      <div className="flex items-start justify-between gap-4">
        <header className="max-w-[34rem]">
          <h1 className="page-eyebrow enter">
            <T zh={copy.zh.title} en={copy.en.title} />
          </h1>
          <p
            className="page-introduction enter mt-4 text-balance"
            style={{ '--enter-delay': '70ms' } as React.CSSProperties}
          >
            <T zh={copy.zh.description} en={copy.en.description} />
          </p>
        </header>
        <PixelCluster variant={2} className="enter shrink-0" />
      </div>

      <WritingInkStage className="mt-10" contentClassName="flex flex-col gap-8">
        <PostArchive posts={posts} locale={locale} />
      </WritingInkStage>
    </div>
  )
}
