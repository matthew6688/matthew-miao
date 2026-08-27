import Link from 'next/link'

import { LocalDate, T } from '~/lib/i18n'
import { presentationPath, type Presentation } from '~/lib/presentations'

export function PresentationRow({
  presentation,
}: {
  presentation: Presentation
}) {
  return (
    <Link
      href={presentationPath(presentation.slug)}
      className="project-row hairline-top group"
    >
      <span className="project-icon-frame" aria-hidden="true">
        <svg
          className="project-icon p-2"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        >
          <rect x="2.5" y="4" width="19" height="15" rx="2" />
          <path d="M2.5 8h19" />
          <path d="m10 11 5 2.5-5 2.5Z" fill="currentColor" fillOpacity=".3" />
          <circle cx="5.5" cy="6" r=".6" fill="currentColor" stroke="none" />
          <circle cx="8" cy="6" r=".6" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <span className="project-identity">
        <span className="project-name font-medium">
          <T zh={presentation.title} en={presentation.titleEn} />
        </span>
        <time
          dateTime={presentation.publishedAt.toISOString()}
          className="project-domain text-muted-foreground tabular-nums"
        >
          <LocalDate date={presentation.publishedAt} />
        </time>
      </span>
      <span className="project-description text-muted-foreground">
        <T zh={presentation.description} en={presentation.descriptionEn} />
      </span>
    </Link>
  )
}
