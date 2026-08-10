import { describe, expect, it } from 'vitest'

import { checkBrowserMutationRequest } from './request-policy'

const canonicalOrigin = new URL('https://matthew-miao.com')

function mutationRequest(headers: HeadersInit = {}) {
  return new Request('https://matthew-miao.com/api/admin/ama/availability', {
    method: 'POST',
    headers,
  })
}

describe('browser mutation request policy', () => {
  it('accepts an exact same-origin browser request', () => {
    expect(
      checkBrowserMutationRequest(
        mutationRequest({ origin: 'https://matthew-miao.com', 'sec-fetch-site': 'same-origin' }),
        canonicalOrigin,
      ),
    ).toBeNull()
  })

  it.each([
    [{ 'sec-fetch-site': 'same-origin' }, 'missing-origin'],
    [{ origin: 'null', 'sec-fetch-site': 'same-origin' }, 'origin-mismatch'],
    [
      { origin: 'https://attacker.example', 'sec-fetch-site': 'cross-site' },
      'origin-mismatch',
    ],
    [{ origin: 'http://matthew-miao.com', 'sec-fetch-site': 'same-origin' }, 'origin-mismatch'],
    [{ origin: 'https://matthew-miao.com:444', 'sec-fetch-site': 'same-origin' }, 'origin-mismatch'],
    [{ origin: 'https://matthew-miao.com' }, 'missing-fetch-metadata'],
    [{ origin: 'https://matthew-miao.com', 'sec-fetch-site': 'same-site' }, 'cross-site-context'],
    [{ origin: 'https://matthew-miao.com', 'sec-fetch-site': 'cross-site' }, 'cross-site-context'],
    [{ origin: 'https://matthew-miao.com', 'sec-fetch-site': 'none' }, 'cross-site-context'],
  ] as const)('rejects unsafe browser context %#', (headers, reason) => {
    expect(checkBrowserMutationRequest(mutationRequest(headers), canonicalOrigin)).toBe(
      reason,
    )
  })
})
