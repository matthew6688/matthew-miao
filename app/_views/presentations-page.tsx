import { PixelCluster } from '~/components/pixel-cluster'
import { PresentationRow } from '~/components/presentation-row'
import { T } from '~/lib/i18n'
import type { Locale } from '~/lib/locale-route'
import { presentations } from '~/lib/presentations'
import { publicPageMetadata } from '~/lib/public-page-metadata'

export function PresentationsPageView({ locale }: { locale: Locale }) {
  const copy = publicPageMetadata.presentations

  return (
    <div className="relative mx-auto w-full max-w-[37.5rem] px-6">
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
        <PixelCluster variant={1} className="enter shrink-0" />
      </div>

      <ul className="focus-list mt-10 flex flex-col">
        {presentations.map((presentation, index) => (
          <li
            key={presentation.slug}
            className="enter-swing"
            style={{ '--enter-delay': `${120 + index * 50}ms` } as React.CSSProperties}
          >
            <PresentationRow presentation={presentation} />
          </li>
        ))}
      </ul>
    </div>
  )
}
