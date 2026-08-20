#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

export function parseGitHubRepositoryUrl(value) {
  let url
  try {
    url = new URL(value)
  } catch {
    throw new Error('Expected a full https://github.com/OWNER/REPOSITORY URL')
  }

  if (url.protocol !== 'https:' || url.hostname !== 'github.com') {
    throw new Error('Only https://github.com repository URLs are accepted')
  }
  if (url.search || url.hash) throw new Error('Repository URL must not include query or fragment')

  const parts = url.pathname.replace(/\/+$/, '').split('/').filter(Boolean)
  if (parts.length !== 2) throw new Error('URL must point to a repository root')
  const [owner, rawRepository] = parts
  const repository = rawRepository.replace(/\.git$/, '')
  if (!owner || !repository) throw new Error('URL must include owner and repository')

  return { owner, repository, fullName: `${owner}/${repository}` }
}

export function buildInspectionReport(metadata, expectedOwner, hasReadme = false) {
  const isPublic = metadata.private === false && metadata.visibility === 'public'
  if (!isPublic) {
    return {
      repository: {
        visibility: metadata.visibility ?? 'unknown',
        redacted: true,
      },
      assessment: {
        publicationGate: 'reject-non-public',
      },
    }
  }
  const licenseSpdx = metadata.license?.spdx_id ?? null
  const explicitLicense = Boolean(licenseSpdx && licenseSpdx !== 'NOASSERTION')
  const ownerMatch = metadata.owner?.login?.toLowerCase() === expectedOwner.toLowerCase()

  let publicationGate = 'candidate'
  if (metadata.fork) publicationGate = 'reject-fork'
  else if (metadata.archived) publicationGate = 'needs-archived-confirmation'
  else if (!ownerMatch) publicationGate = 'needs-role-confirmation'

  return {
    repository: {
      fullName: metadata.full_name,
      url: metadata.html_url,
      description: metadata.description ?? null,
      homepage: metadata.homepage || null,
      visibility: 'public',
      archived: Boolean(metadata.archived),
      fork: Boolean(metadata.fork),
      parent: metadata.parent?.full_name ?? null,
      defaultBranch: metadata.default_branch,
      topics: metadata.topics ?? [],
      updatedAt: metadata.updated_at,
      hasReadme,
    },
    assessment: {
      expectedOwner,
      ownerMatch,
      originality: metadata.fork
        ? 'ordinary-fork-is-not-an-original-project'
        : ownerMatch
          ? 'candidate-only-human-assertion-still-required'
          : 'role-confirmation-required',
      sourceLabel: explicitLicense
        ? 'explicit-license-needs-open-source-verification'
        : 'public-source-no-recognized-license',
      licenseName: metadata.license?.name ?? null,
      licenseKey: metadata.license?.key ?? null,
      licenseSpdx,
      publicationGate,
    },
  }
}

function ghJson(endpoint, optional = false) {
  const result = spawnSync('gh', ['api', '--hostname', 'github.com', '-X', 'GET', endpoint], {
    encoding: 'utf8',
  })
  if (result.error) {
    throw new Error(`GitHub inspection could not start for ${endpoint}: ${result.error.message}`)
  }
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || `exit ${result.status}`).trim()
    if (optional && /(?:HTTP 404|Not Found)/i.test(detail)) return null
    throw new Error(`GitHub inspection failed for ${endpoint}: ${detail}`)
  }
  try {
    return JSON.parse(result.stdout)
  } catch {
    throw new Error(`GitHub inspection returned invalid JSON for ${endpoint}`)
  }
}

export function inspectRepository(url, expectedOwner) {
  const parsed = parseGitHubRepositoryUrl(url)
  const metadata = ghJson(`/repos/${parsed.fullName}`)
  const isPublic = metadata.private === false && metadata.visibility === 'public'
  const readme = isPublic ? ghJson(`/repos/${parsed.fullName}/readme`, true) : null
  return buildInspectionReport(metadata, expectedOwner, Boolean(readme))
}

function parseArguments(argv) {
  const url = argv[0]
  const ownerIndex = argv.indexOf('--owner')
  const expectedOwner = ownerIndex >= 0 ? argv[ownerIndex + 1] : 'matthew6688'
  if (!url || !expectedOwner) {
    throw new Error('Usage: inspect-github-project.mjs URL [--owner GITHUB_LOGIN]')
  }
  return { url, expectedOwner }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { url, expectedOwner } = parseArguments(process.argv.slice(2))
    process.stdout.write(`${JSON.stringify(inspectRepository(url, expectedOwner), null, 2)}\n`)
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
