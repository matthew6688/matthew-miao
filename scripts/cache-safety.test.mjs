import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { test } from 'node:test'

const root = new URL('../', import.meta.url)
const sourceRoots = ['app', 'components', 'lib']
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx'])

async function sourceFiles(directory) {
  const absoluteDirectory = new URL(`${directory}/`, root)
  const entries = await readdir(absoluteDirectory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...await sourceFiles(path))
    } else if (
      sourceExtensions.has(extname(entry.name)) &&
      !/\.(?:test|spec)\.[^.]+$/.test(entry.name)
    ) {
      files.push(path)
    }
  }

  return files
}

test("production Cache Components use only the long-lived 'max' policy", async () => {
  const files = (await Promise.all(sourceRoots.map(sourceFiles))).flat()
  const violations = []

  for (const path of files) {
    const source = await readFile(new URL(path, root), 'utf8')
    const directives = source.match(/^\s*['"]use cache['"]\s*;?/gm) ?? []
    const calls = [...source.matchAll(/\bcacheLife\s*\(([^)]*)\)/g)]

    for (const call of calls) {
      if (!/^\s*['"]max['"]\s*$/.test(call[1])) {
        violations.push(`${path}: finite or implicit runtime cache policy ${call[0]}`)
      }
    }

    if (directives.length !== calls.length) {
      violations.push(
        `${path}: found ${directives.length} use-cache scope(s) but ${calls.length} explicit cacheLife call(s)`,
      )
    }
  }

  assert.deepEqual(
    violations,
    [],
    [
      'Finite Cache Component refreshes are blocked after the 2026-08-12 Worker 1101 incident.',
      'Use committed/build-time data or document and test an isolated expiry-cycle architecture before changing this gate.',
      ...violations,
    ].join('\n'),
  )
})
