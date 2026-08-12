#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

export const localBuildEnvironment = {
  ADMIN_EMAIL: 'owner@example.com',
  AMA_ENCRYPTION_KEY: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
  DATABASE_URL: 'postgresql://build:build@127.0.0.1:5432/matthew',
  MEDIA_ENCRYPTION_KEY: 'AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI=',
  MEDIA_PUBLIC_BASE_URL: 'https://media-build.example.com/media/',
  PHOTO_PUBLICATION_MODE: 'repository-bootstrap',
  RATE_LIMIT_HASH_KEY: 'AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=',
  SITE_URL: 'https://matthew-miao.com',
}

export function buildEnvironment(baseEnvironment = process.env) {
  const environment = { ...localBuildEnvironment }
  for (const [key, value] of Object.entries(baseEnvironment)) {
    if (value !== undefined && value !== '') environment[key] = value
  }
  return environment
}

function main() {
  const result = spawnSync('pnpm', ['build:cloudflare'], {
    cwd: path.resolve(import.meta.dirname, '..'),
    env: buildEnvironment(),
    stdio: 'inherit',
  })
  if (result.error) throw result.error
  process.exitCode = result.status ?? 1
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main()
