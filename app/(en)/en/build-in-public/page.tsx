import { BuildInPublicPageView } from '../../../_views/build-in-public-page'
import { localeMetadata } from '~/lib/locale-metadata'
import { publicPageMetadata } from '~/lib/public-page-metadata'

const copy = publicPageMetadata['build-in-public'].en

export const metadata = localeMetadata({
  locale: 'en',
  path: '/build-in-public',
  ...copy,
})

export default function EnglishBuildInPublicPage() {
  return <BuildInPublicPageView locale="en" />
}
