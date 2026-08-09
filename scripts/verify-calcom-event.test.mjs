import test from 'node:test'
import assert from 'node:assert/strict'

import { siteProfile } from '../lib/site-profile.ts'
import { assertCalcomAmaEvent } from './verify-calcom-event.mjs'

function fixture(overrides = {}) {
  return {
    status: 'success',
    data: [
      {
        bookingUrl: siteProfile.links.calcomBooking,
        lengthInMinutes: 60,
        price: 9_900,
        currency: 'usd',
        hidden: false,
        minimumBookingNotice: 1_440,
        beforeEventBuffer: 15,
        afterEventBuffer: 15,
        disableRescheduling: { disabled: false, minutesBefore: 1_440 },
        locations: [{ type: 'integration', integration: 'google-meet' }],
        ...overrides,
      },
    ],
  }
}

test('accepts the published 60-minute US$99 Cal.com AMA contract', () => {
  assert.equal(
    assertCalcomAmaEvent(fixture()).bookingUrl,
    siteProfile.links.calcomBooking,
  )
})

test('rejects provider drift in price and publication state', () => {
  assert.throws(() => assertCalcomAmaEvent(fixture({ price: 0 })), /price/)
  assert.throws(() => assertCalcomAmaEvent(fixture({ hidden: true })), /public/)
})
