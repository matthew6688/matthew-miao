import { execFileSync } from 'node:child_process'

const list = JSON.parse(
  execFileSync('pnpm', ['list', '--prod', '--depth', 'Infinity', '--json'], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  }),
)

const packages = new Map()

function collectDependencies(node) {
  for (const [name, dependency] of Object.entries(node.dependencies ?? {})) {
    const version = dependency.version
    if (version && !/^(?:file|link|workspace):/.test(version)) {
      packages.set(`${name}@${version}`, {
        package: { ecosystem: 'npm', name },
        version,
      })
    }
    collectDependencies(dependency)
  }
}

for (const root of list) collectDependencies(root)

const queries = [...packages.values()]

const requestBody = JSON.stringify({ queries })
let response
for (let attempt = 1; attempt <= 3; attempt += 1) {
  response = await fetch('https://api.osv.dev/v1/querybatch', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'user-agent': 'matthew-miao-production-audit/1.0',
    },
    body: requestBody,
  })
  if (response.ok) break

  const retryable = response.status === 403 || response.status === 429 || response.status >= 500
  if (!retryable || attempt === 3) break

  const retryAfter = Number(response.headers.get('retry-after'))
  const delayMs = Number.isFinite(retryAfter)
    ? Math.min(Math.max(retryAfter * 1_000, 250), 5_000)
    : attempt * 1_000
  console.warn(
    `OSV dependency audit attempt ${attempt} returned HTTP ${response.status}; retrying`,
  )
  await new Promise((resolve) => setTimeout(resolve, delayMs))
}

if (!response?.ok) {
  throw new Error(`OSV dependency audit failed with HTTP ${response.status}`)
}

const report = await response.json()
if (report.results.length !== queries.length) {
  throw new Error('OSV dependency audit returned an incomplete result set')
}

const findings = report.results.flatMap((result, index) =>
  (result.vulns ?? []).map((vulnerability) => ({
    dependency: `${queries[index].package.name}@${queries[index].version}`,
    id: vulnerability.id,
  })),
)

if (findings.length > 0) {
  console.error(
    `OSV found ${findings.length} known production dependency vulnerabilities`,
  )
  if (process.env.AUDIT_DETAILS === 'true') {
    for (const finding of findings) {
      console.error(`- ${finding.dependency}: ${finding.id}`)
    }
  } else {
    console.error('Re-run privately with AUDIT_DETAILS=true for triage details')
  }
  process.exitCode = 1
} else {
  console.log(
    `OSV checked ${queries.length} production package versions; no known vulnerabilities found`,
  )
}
