import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { siteProfile } from '../lib/site-profile.ts'

const bookingUrl = new URL(siteProfile.links.calcomBooking)
const [username, eventSlug] = bookingUrl.pathname.split('/').filter(Boolean)
const EVENT_TYPES_API = new URL('/v2/event-types', 'https://api.cal.com')
EVENT_TYPES_API.searchParams.set('username', username)
EVENT_TYPES_API.searchParams.set('eventSlug', eventSlug)

export function assertCalcomAmaEvent(payload) {
  assert.equal(payload?.status, 'success')
  assert.ok(Array.isArray(payload.data), 'Cal.com event response needs data')

  const event = payload.data.find(
    (candidate) => candidate?.bookingUrl === siteProfile.links.calcomBooking,
  )
  assert.ok(event, 'Cal.com AMA event is missing')
  assert.equal(event.lengthInMinutes, 60, 'Cal.com AMA duration')
  assert.equal(event.price, 9_900, 'Cal.com AMA price in USD cents')
  assert.equal(event.currency, 'usd', 'Cal.com AMA currency')
  assert.equal(event.hidden, false, 'Cal.com AMA must be public')
  assert.equal(event.minimumBookingNotice, 1_440, 'Cal.com AMA booking notice')
  assert.equal(event.beforeEventBuffer, 15, 'Cal.com AMA before buffer')
  assert.equal(event.afterEventBuffer, 15, 'Cal.com AMA after buffer')
  assert.deepEqual(event.disableRescheduling, {
    disabled: false,
    minutesBefore: 1_440,
  })
  assert.ok(
    event.locations?.some(
      (location) =>
        location?.type === 'integration' &&
        location.integration === 'google-meet',
    ),
    'Cal.com AMA needs Google Meet',
  )

  return event
}

async function main() {
  const apiKey = process.env.CALCOM_API_KEY
  assert.ok(apiKey, 'CALCOM_API_KEY is required')

  const response = await fetch(EVENT_TYPES_API, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'cal-api-version': '2024-06-14',
    },
  })
  assert.equal(response.status, 200, 'Cal.com event-types response')
  assertCalcomAmaEvent(await response.json())
  console.log('Verified the public Cal.com AMA event')
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main()
}
