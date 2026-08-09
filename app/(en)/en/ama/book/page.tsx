import { redirect } from 'next/navigation'

import { amaBookMetadata } from '../../../../_views/ama-book-page'
import { siteProfile } from '../../../../../lib/site-profile'

export const metadata = amaBookMetadata('en')

export default function EnglishAmaBookPage() {
  redirect(siteProfile.links.calcomBooking)
}
