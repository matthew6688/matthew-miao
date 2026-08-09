import 'server-only'

import { getCloudflareContext } from '@opennextjs/cloudflare'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { getServerEnv } from '~/lib/ama/server-env'

let database: ReturnType<typeof createDatabase> | undefined

declare global {
  interface CloudflareEnv {
    HYPERDRIVE?: { connectionString: string }
  }
}

function runtimeConnectionString() {
  try {
    const hyperdrive = getCloudflareContext().env.HYPERDRIVE
    if (hyperdrive?.connectionString) return hyperdrive.connectionString
  } catch {
    // Next build, tests, and local Node execution have no Worker context.
  }
  return getServerEnv().DATABASE_URL
}

function createDatabase() {
  const pool = new Pool({
    connectionString: runtimeConnectionString(),
    max: 1,
  })
  return drizzle({ client: pool })
}

export function getDatabase() {
  database ??= createDatabase()
  return database
}
