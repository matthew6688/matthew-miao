#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

function command(args, cwd) {
  const result = spawnSync(args[0], args.slice(1), { cwd, encoding: 'utf8' })
  if (result.error || result.status !== 0) return null
  return result.stdout.trim()
}

export function parseTrustedOrigin(remote) {
  const sshMatch = /^git@github\.com:matthew6688\/matthew-miao(?:\.git)?$/.test(remote)
  if (sshMatch) return 'github.com/matthew6688/matthew-miao'

  try {
    const url = new URL(remote)
    const trustedPath = /^\/matthew6688\/matthew-miao(?:\.git)?$/.test(url.pathname)
    if (
      url.protocol === 'https:'
      && url.hostname === 'github.com'
      && !url.port
      && !url.username
      && !url.password
      && !url.search
      && !url.hash
      && trustedPath
    ) {
      return 'github.com/matthew6688/matthew-miao'
    }
  } catch {}
  throw new Error('origin must be an uncredentialed matthew6688/matthew-miao GitHub remote')
}

export function assessWorkspace(repoRoot) {
  const root = resolve(repoRoot)
  let packageJson
  try {
    packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
    readFileSync(resolve(root, 'AGENTS.md'), 'utf8')
    readFileSync(resolve(root, 'lib/site-profile.ts'), 'utf8')
    readFileSync(resolve(root, 'lib/personal.ts'), 'utf8')
  } catch {
    throw new Error('Run this Skill from the matthew-miao website repository root')
  }
  if (packageJson.name !== 'matthew-miao') {
    throw new Error(`Unexpected package name: ${packageJson.name ?? 'missing'}`)
  }

  const rawRemote = command(['git', 'remote', 'get-url', 'origin'], root)
  if (!rawRemote) throw new Error('origin must be configured')
  const repository = parseTrustedOrigin(rawRemote)
  const branch = command(['git', 'branch', '--show-current'], root)
  if (!branch) throw new Error('A named Git branch is required')
  const missingTools = ['gh', 'pnpm'].filter((tool) => !command([tool, '--version'], root))
  if (missingTools.length) throw new Error(`Missing required tools: ${missingTools.join(', ')}`)

  return { root, branch, mutationAllowed: !['main', 'dev'].includes(branch), repository }
}

function parseArguments(argv) {
  const repoIndex = argv.indexOf('--repo')
  return repoIndex >= 0 ? argv[repoIndex + 1] : process.cwd()
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const report = assessWorkspace(parseArguments(process.argv.slice(2)))
    if (!report.mutationAllowed) throw new Error(`Refusing content changes on protected branch ${report.branch}`)
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
