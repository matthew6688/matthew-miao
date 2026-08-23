import { GeistPixelSquare } from 'geist/font/pixel'

import { PostRow } from '~/components/post-row'
import { RevealScope } from '~/components/reveal-scope'
import type { Post } from '~/lib/content'
import type { Locale } from '~/lib/locale-route'

export function PostArchive({ posts, locale }: { posts: Post[]; locale: Locale }) {
  const postsByYear = new Map<number, Post[]>()

  for (const post of posts) {
    const year = post.publishedAt.getUTCFullYear()
    const yearPosts = postsByYear.get(year)
    if (yearPosts) yearPosts.push(post)
    else postsByYear.set(year, [post])
  }

  return [...postsByYear].map(([year, yearPosts]) => {
    const center = (yearPosts.length - 1) / 2

    return (
      <section key={year} aria-labelledby={`posts-${year}`} className="relative">
        <span aria-hidden className={`ghost-folio ${GeistPixelSquare.className}`}>
          {String(year).slice(2)}
        </span>
        <h2
          id={`posts-${year}`}
          className="enter text-sm font-medium text-muted-foreground tabular-nums"
        >
          {year}
        </h2>
        <RevealScope as="ul" className="focus-list mt-2 flex flex-col">
          {yearPosts.map((post, index) => (
            <li
              key={post.slug}
              className="enter-swing"
              style={
                {
                  '--enter-delay': `${120 + Math.abs(index - center) * 50}ms`,
                } as React.CSSProperties
              }
            >
              <PostRow
                post={post}
                headingLevel="h3"
                dateStyle="month-day"
                locale={locale}
                listStageId={post.slug}
              />
            </li>
          ))}
        </RevealScope>
      </section>
    )
  })
}
