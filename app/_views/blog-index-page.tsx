import { WritingInkStage } from '~/components/hidden-list-stage'
import { PixelCluster } from '~/components/pixel-cluster'
import { PostArchive } from '~/components/post-archive'
import { getAllPosts } from '~/lib/content'
import { T } from '~/lib/i18n'
import type { Locale } from '~/lib/locale-route'

export function BlogIndexPageView({ locale }: { locale: Locale }) {
  const posts = getAllPosts()

  return (
    <div className="mx-auto w-full max-w-[37.5rem] px-6">
      <header className="enter flex items-center justify-between">
        <h1 className="page-eyebrow">
          <T zh="写作" en="Writing" />
        </h1>
        <PixelCluster variant={1} />
      </header>
      <WritingInkStage className="mt-6" contentClassName="flex flex-col gap-8">
        <PostArchive posts={posts} locale={locale} />
      </WritingInkStage>
    </div>
  )
}
