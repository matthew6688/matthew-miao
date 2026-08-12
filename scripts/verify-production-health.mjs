import { writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const DEFAULT_BASE_URL = 'https://matthew-miao.com'
const REQUEST_TIMEOUT_MS = 12_000
const RETRY_DELAY_MS = 10_000

export const productionRouteContracts = [
  { path: '/', contentType: 'text/html', contains: '<html' },
  { path: '/en', contentType: 'text/html', contains: '<html' },
  { path: '/blog', contentType: 'text/html', contains: '<html' },
  { path: '/en/blog', contentType: 'text/html', contains: '<html' },
  { path: '/photos', contentType: 'text/html', contains: '<html' },
  { path: '/en/photos', contentType: 'text/html', contains: '<html' },
  { path: '/projects', contentType: 'text/html', contains: '<html' },
  { path: '/en/projects', contentType: 'text/html', contains: '<html' },
  { path: '/ama', contentType: 'text/html', contains: '<html' },
  { path: '/en/ama', contentType: 'text/html', contains: '<html' },
  { path: '/sitemap.xml', contentType: 'application/xml', contains: '<urlset' },
  { path: '/feed.xml', contentType: 'application/xml', contains: '<rss' },
  { path: '/feed.en.xml', contentType: 'application/xml', contains: '<rss' },
  { path: '/icon.svg', contentType: 'image/svg+xml', contains: '<svg' },
]

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds))

function normalizeBaseUrl(value) {
  const url = new URL(value)
  if (url.protocol !== 'https:') {
    throw new Error('Production canary requires an HTTPS base URL')
  }
  return url.href.replace(/\/$/, '')
}

async function probeRoute(baseUrl, contract, fetchImpl) {
  const url = `${baseUrl}${contract.path}`
  const startedAt = Date.now()

  try {
    const response = await fetchImpl(url, {
      headers: {
        accept: contract.contentType,
        'user-agent': 'matthew-miao-production-canary/1.0',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    const body = await response.text()
    const actualType = response.headers.get('content-type') ?? ''
    const errors = []

    if (response.status !== 200) errors.push(`HTTP ${response.status}`)
    if (!actualType.toLowerCase().includes(contract.contentType)) {
      errors.push(`content-type ${actualType || '(missing)'}`)
    }
    if (!body.toLowerCase().includes(contract.contains.toLowerCase())) {
      errors.push(`missing marker ${contract.contains}`)
    }
    if (/worker threw exception|error 1101/i.test(body)) {
      errors.push('Cloudflare Worker exception page')
    }

    return {
      path: contract.path,
      ok: errors.length === 0,
      status: response.status,
      durationMs: Date.now() - startedAt,
      detail: errors.join('; ') || 'ok',
    }
  } catch (error) {
    return {
      path: contract.path,
      ok: false,
      status: null,
      durationMs: Date.now() - startedAt,
      detail: error instanceof Error ? error.message : String(error),
    }
  }
}

export async function verifyProductionHealth({
  baseUrl = DEFAULT_BASE_URL,
  contracts = productionRouteContracts,
  fetchImpl = fetch,
  retryDelayMs = RETRY_DELAY_MS,
  sleepImpl = sleep,
} = {}) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl)
  const firstPass = await Promise.all(
    contracts.map((contract) => probeRoute(normalizedBaseUrl, contract, fetchImpl)),
  )
  const firstFailures = firstPass.filter((result) => !result.ok)

  if (firstFailures.length === 0) {
    return { baseUrl: normalizedBaseUrl, ok: true, results: firstPass, retried: false }
  }

  await sleepImpl(retryDelayMs)
  const failedContracts = firstFailures.map((failure) =>
    contracts.find((contract) => contract.path === failure.path),
  )
  const retryResults = await Promise.all(
    failedContracts.map((contract) => probeRoute(normalizedBaseUrl, contract, fetchImpl)),
  )
  const retryByPath = new Map(retryResults.map((result) => [result.path, result]))
  const results = firstPass.map((result) => retryByPath.get(result.path) ?? result)

  return {
    baseUrl: normalizedBaseUrl,
    ok: results.every((result) => result.ok),
    results,
    retried: true,
  }
}

export function formatHealthReport(report) {
  const lines = [
    `# Production canary: ${report.ok ? 'HEALTHY' : 'BROKEN'}`,
    '',
    `Base URL: ${report.baseUrl}`,
    `Checked: ${new Date().toISOString()}`,
    `Persistent-failure retry: ${report.retried ? 'yes' : 'not needed'}`,
    '',
    '| Route | Status | Time | Detail |',
    '| --- | ---: | ---: | --- |',
  ]

  for (const result of report.results) {
    lines.push(
      `| ${result.path} | ${result.status ?? 'error'} | ${result.durationMs} ms | ${result.detail.replaceAll('|', '\\|')} |`,
    )
  }

  return `${lines.join('\n')}\n`
}

async function main() {
  const baseUrl = process.argv[2] ?? DEFAULT_BASE_URL
  const reportPath = process.argv[3]
  const report = await verifyProductionHealth({ baseUrl })
  const output = formatHealthReport(report)

  process.stdout.write(output)
  if (reportPath) await writeFile(reportPath, output)
  if (!report.ok) process.exitCode = 1
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main()
}
