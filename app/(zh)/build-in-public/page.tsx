import { BuildInPublicPageView } from '../../_views/build-in-public-page'
import { localeMetadata } from '~/lib/locale-metadata'
import { publicPageMetadata } from '~/lib/public-page-metadata'

const copy = publicPageMetadata['build-in-public'].zh

export const metadata = localeMetadata({
  locale: 'zh',
  path: '/build-in-public',
  ...copy,
})

export default function ChineseBuildInPublicPage() {
  return <BuildInPublicPageView locale="zh" />
}
