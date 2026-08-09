import { redirect } from 'next/navigation'

import { amaBookMetadata } from '../../../_views/ama-book-page'
import { siteProfile } from '../../../../lib/site-profile'

export const metadata = amaBookMetadata('zh')

export default function ChineseAmaBookPage() {
  redirect(siteProfile.links.calcomBooking)
}
