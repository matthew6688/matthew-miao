import { PresentationsPageView } from '../../_views/presentations-page'
import { localeMetadata } from '~/lib/locale-metadata'
import { publicPageMetadata } from '~/lib/public-page-metadata'

const copy = publicPageMetadata.presentations.zh

export const metadata = localeMetadata({
  locale: 'zh',
  path: '/presentations',
  ...copy,
})

export default function ChinesePresentationsPage() {
  return <PresentationsPageView locale="zh" />
}
