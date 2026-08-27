import { PresentationsPageView } from '../../../_views/presentations-page'
import { localeMetadata } from '~/lib/locale-metadata'
import { publicPageMetadata } from '~/lib/public-page-metadata'

const copy = publicPageMetadata.presentations.en

export const metadata = localeMetadata({
  locale: 'en',
  path: '/presentations',
  ...copy,
})

export default function EnglishPresentationsPage() {
  return <PresentationsPageView locale="en" />
}
