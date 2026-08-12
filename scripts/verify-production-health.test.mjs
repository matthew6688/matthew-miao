import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  formatHealthReport,
  verifyProductionHealth,
} from './verify-production-health.mjs'

const contract = { path: '/', contentType: 'text/html', contains: '<html' }
const healthyResponse = () =>
  new Response('<html><title>Matthew Miao</title></html>', {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })

test('accepts a healthy production route without retrying', async () => {
  const report = await verifyProductionHealth({
    contracts: [contract],
    fetchImpl: async () => healthyResponse(),
    sleepImpl: async () => assert.fail('healthy routes must not sleep'),
  })

  assert.equal(report.ok, true)
  assert.equal(report.retried, false)
  assert.match(formatHealthReport(report), /Production canary: HEALTHY/)
})

test('recovers from one transient failure without raising an incident', async () => {
  let calls = 0
  const report = await verifyProductionHealth({
    contracts: [contract],
    fetchImpl: async () => {
      calls += 1
      return calls === 1
        ? new Response('temporary', { status: 503, headers: { 'content-type': 'text/plain' } })
        : healthyResponse()
    },
    retryDelayMs: 0,
    sleepImpl: async () => undefined,
  })

  assert.equal(report.ok, true)
  assert.equal(report.retried, true)
  assert.equal(calls, 2)
})

test('reports a persistent Cloudflare Worker exception', async () => {
  const report = await verifyProductionHealth({
    contracts: [contract],
    fetchImpl: async () =>
      new Response('Error 1101: Worker threw exception', {
        status: 500,
        headers: { 'content-type': 'text/html' },
      }),
    retryDelayMs: 0,
    sleepImpl: async () => undefined,
  })

  assert.equal(report.ok, false)
  assert.equal(report.results[0].status, 500)
  assert.match(report.results[0].detail, /Worker exception/)
  assert.match(formatHealthReport(report), /Production canary: BROKEN/)
})
