import assert from 'node:assert/strict'
import test from 'node:test'

import { buildEnvironment, localBuildEnvironment } from './build-cloudflare-local.mjs'

test('local Cloudflare builds receive complete non-secret reference-provider shapes', () => {
  for (const key of [
    'ADMIN_EMAIL',
    'AMA_ENCRYPTION_KEY',
    'DATABASE_URL',
    'MEDIA_ENCRYPTION_KEY',
    'MEDIA_PUBLIC_BASE_URL',
    'PHOTO_PUBLICATION_MODE',
    'RATE_LIMIT_HASH_KEY',
    'SITE_URL',
  ]) {
    assert.equal(typeof localBuildEnvironment[key], 'string')
    assert.notEqual(localBuildEnvironment[key], '')
  }
  assert.doesNotMatch(JSON.stringify(localBuildEnvironment), /(?:sk|pk|re|cal)_live_/)
})

test('explicit environment values override local build defaults', () => {
  assert.equal(buildEnvironment({ ADMIN_EMAIL: 'agent@example.com' }).ADMIN_EMAIL, 'agent@example.com')
  assert.equal(buildEnvironment({ ADMIN_EMAIL: '' }).ADMIN_EMAIL, 'owner@example.com')
})
