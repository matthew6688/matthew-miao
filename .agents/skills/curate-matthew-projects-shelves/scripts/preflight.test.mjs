import assert from 'node:assert/strict'
import test from 'node:test'

import { parseTrustedOrigin } from './preflight.mjs'

test('accepts only exact uncredentialed Matthew GitHub remotes', () => {
  assert.equal(
    parseTrustedOrigin('https://github.com/matthew6688/matthew-miao.git'),
    'github.com/matthew6688/matthew-miao',
  )
  assert.equal(
    parseTrustedOrigin('git@github.com:matthew6688/matthew-miao.git'),
    'github.com/matthew6688/matthew-miao',
  )
})

test('rejects credential-bearing and suffix-confusion remotes', () => {
  assert.throws(() => parseTrustedOrigin(
    'https://x-oauth-basic:ghp_SECRET@github.com/matthew6688/matthew-miao.git',
  ))
  assert.throws(() => parseTrustedOrigin(
    'https://evil.example/github.com/matthew6688/matthew-miao',
  ))
  assert.throws(() => parseTrustedOrigin(
    'https://github.com.evil.example/matthew6688/matthew-miao',
  ))
})
