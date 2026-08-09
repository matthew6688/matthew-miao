import { expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const pool = { end: vi.fn() }
  const transaction = vi.fn(
    async (callback: (transaction: { driver: string }) => Promise<unknown>) =>
      callback({ driver: 'transaction-capable' }),
  )
  return {
    poolOptions: undefined as unknown,
    pool,
    transaction,
  }
})

vi.mock('~/lib/ama/server-env', () => ({
  getServerEnv: () => ({
    DATABASE_URL: 'postgresql://runtime:runtime@localhost:5432/cali',
  }),
}))

vi.mock('server-only', () => ({}))

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: () => {
    throw new Error('No Worker context in unit tests')
  },
}))

vi.mock('pg', () => ({
  Pool: class Pool {
    constructor(options: unknown) {
      mocks.poolOptions = options
      return mocks.pool
    }
  },
}))

vi.mock('drizzle-orm/node-postgres', () => ({
  drizzle: () => ({ transaction: mocks.transaction }),
}))

import { getDatabase } from './index'

it('provides interactive transactions through the shared database client', async () => {
  const result = await getDatabase().transaction(
    async (transaction) => transaction,
  )

  expect(result).toEqual({ driver: 'transaction-capable' })
  expect(mocks.poolOptions).toEqual({
    connectionString: 'postgresql://runtime:runtime@localhost:5432/cali',
    max: 1,
  })
})
