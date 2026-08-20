import assert from 'node:assert/strict'
import test from 'node:test'

import { buildInspectionReport, parseGitHubRepositoryUrl } from './inspect-github-project.mjs'

const base = {
  full_name: 'matthew6688/original-project',
  html_url: 'https://github.com/matthew6688/original-project',
  owner: { login: 'matthew6688' },
  private: false,
  visibility: 'public',
  fork: false,
  archived: false,
  default_branch: 'main',
  description: 'A project',
  homepage: '',
  topics: ['agents'],
  updated_at: '2026-08-20T00:00:00Z',
  license: null,
}

test('accepts only a GitHub repository root URL', () => {
  assert.deepEqual(parseGitHubRepositoryUrl('https://github.com/matthew6688/project.git/'), {
    owner: 'matthew6688',
    repository: 'project',
    fullName: 'matthew6688/project',
  })
  assert.throws(() => parseGitHubRepositoryUrl('http://github.com/matthew6688/project'))
  assert.throws(() => parseGitHubRepositoryUrl('https://github.com/matthew6688/project/issues'))
  assert.throws(() => parseGitHubRepositoryUrl('https://example.com/matthew6688/project'))
})

test('treats an owned non-fork as a candidate, not proof of authorship', () => {
  const report = buildInspectionReport(base, 'matthew6688', true)
  assert.equal(report.assessment.publicationGate, 'candidate')
  assert.equal(report.assessment.originality, 'candidate-only-human-assertion-still-required')
  assert.equal(report.repository.hasReadme, true)
})

test('rejects ordinary forks from the original-project workflow', () => {
  const report = buildInspectionReport({
    ...base,
    fork: true,
    parent: { full_name: 'someone/upstream' },
  }, 'matthew6688')
  assert.equal(report.assessment.publicationGate, 'reject-fork')
  assert.equal(report.repository.parent, 'someone/upstream')
})

test('distinguishes unlicensed public source from an explicit license pending verification', () => {
  assert.equal(
    buildInspectionReport(base, 'matthew6688').assessment.sourceLabel,
    'public-source-no-recognized-license',
  )
  assert.equal(
    buildInspectionReport({ ...base, license: { spdx_id: 'MIT' } }, 'matthew6688')
      .assessment.sourceLabel,
    'explicit-license-needs-open-source-verification',
  )
})

test('fails closed and redacts every non-public or unknown repository', () => {
  assert.equal(
    buildInspectionReport({ ...base, private: true }, 'matthew6688').assessment.publicationGate,
    'reject-non-public',
  )
  const internal = buildInspectionReport({
    ...base,
    private: false,
    visibility: 'internal',
    description: 'confidential description',
    topics: ['secret-topic'],
    license: { spdx_id: 'MIT', name: 'MIT License' },
    fork: true,
  }, 'matthew6688', true)
  assert.equal(internal.assessment.publicationGate, 'reject-non-public')
  assert.deepEqual(internal.repository, { visibility: 'internal', redacted: true })
  assert.equal(JSON.stringify(internal).includes('confidential'), false)
  assert.equal(JSON.stringify(internal).includes('secret-topic'), false)
  assert.equal(JSON.stringify(internal).includes('MIT'), false)
  assert.equal(JSON.stringify(internal).includes('fork'), false)

  assert.equal(
    buildInspectionReport({ ...base, visibility: undefined }, 'matthew6688')
      .assessment.publicationGate,
    'reject-non-public',
  )
})

test('asks for confirmation on public archived or differently owned repositories', () => {
  assert.equal(
    buildInspectionReport({ ...base, archived: true }, 'matthew6688').assessment.publicationGate,
    'needs-archived-confirmation',
  )
  assert.equal(
    buildInspectionReport({
      ...base,
      owner: { login: 'matthew-company' },
    }, 'matthew6688').assessment.publicationGate,
    'needs-role-confirmation',
  )
})
