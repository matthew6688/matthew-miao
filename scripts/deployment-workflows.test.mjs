import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

import { parse } from 'yaml'

const root = new URL('../', import.meta.url)

async function text(path) {
  return readFile(new URL(path, root), 'utf8')
}

async function workflow(name) {
  return parse(await text(`.github/workflows/${name}.yml`))
}

function stepIndex(steps, name) {
  return steps.findIndex((step) => step.name === name)
}

function assertOrdered(steps, before, after) {
  const beforeIndex = stepIndex(steps, before)
  const afterIndex = stepIndex(steps, after)
  assert.notEqual(beforeIndex, -1, `Missing workflow step: ${before}`)
  assert.notEqual(afterIndex, -1, `Missing workflow step: ${after}`)
  assert.ok(beforeIndex < afterIndex, `${before} must run before ${after}`)
}

test('Vercel Git integration cannot race the deployment workflows', async () => {
  const config = JSON.parse(await text('vercel.json'))
  assert.equal(config.git?.deploymentEnabled, false)
})

test('Cloudflare environments bind isolated R2 media stores', async () => {
  const config = JSON.parse(
    await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8'),
  )
  const binding = (environment) =>
    environment.r2_buckets.find(({ binding }) => binding === 'MEDIA_R2_BUCKET')

  assert.equal(binding(config).bucket_name, 'matthew-miao-media')
  assert.equal(
    binding(config.env.staging).bucket_name,
    'matthew-miao-staging-media',
  )
  assert.equal(
    binding(config.env.preview).bucket_name,
    'matthew-miao-staging-media',
  )
  assert.equal(
    config.vars.MEDIA_PUBLIC_BASE_URL,
    'https://matthew-miao.com/media/',
  )
  assert.equal(config.vars.PHOTO_PUBLICATION_MODE, 'repository-bootstrap')
  assert.equal(
    config.env.staging.vars.PHOTO_PUBLICATION_MODE,
    'repository-bootstrap',
  )
  assert.equal(
    config.env.preview.vars.PHOTO_PUBLICATION_MODE,
    'repository-bootstrap',
  )
  assert.doesNotMatch(JSON.stringify(config), /BUNNY_MEDIA_/)
})

test('feature pushes deploy a validated Cloudflare Preview', async () => {
  const config = await workflow('deploy-preview')
  assert.deepEqual(config.on.push['branches-ignore'], ['main', 'dev'])
  assert.equal(config.on.pull_request, undefined)
  assert.equal(config.on.pull_request_target, undefined)
  assert.equal(config.concurrency['cancel-in-progress'], true)

  const job = config.jobs['validate-and-deploy']
  assert.equal(job.environment, 'preview')
  assert.match(job.if, /matthew6688\/matthew-miao/)
  assert.equal(config.concurrency.group, 'cloudflare-preview')
  assert.equal(job.env.CLOUDFLARE_API_TOKEN, '${{ secrets.CLOUDFLARE_API_TOKEN }}')
  assert.match(job.steps.find((step) => step.name === 'Validate application').run, /pnpm test:photo-skill/)
  assert.match(job.steps.find((step) => step.name === 'Validate application').run, /pnpm test:deployment/)

  const deploy = job.steps.find((step) => step.name === 'Deploy exact commit to Cloudflare Preview')
  assert.match(deploy.run, /opennextjs-cloudflare deploy --env preview/)
  const browserCheck = job.steps.find(
    (step) => step.name === 'Verify Preview in browser',
  )
  assert.equal(browserCheck.env.PLAYWRIGHT_BASE_URL, 'https://matthew-miao-preview.matthew6688.workers.dev')
  assert.match(browserCheck.run, /pnpm test:browser:hosted/)
  assertOrdered(job.steps, 'Validate application', 'Deploy exact commit to Cloudflare Preview')
  assertOrdered(
    job.steps,
    'Deploy exact commit to Cloudflare Preview',
    'Wait for Preview deployment convergence',
  )
  assert.match(
    job.steps.find((step) => step.name === 'Wait for Preview deployment convergence').run,
    /wait-for-cloudflare-deployment\.mjs/,
  )
  assertOrdered(
    job.steps,
    'Wait for Preview deployment convergence',
    'Install Playwright Chromium',
  )
  assertOrdered(
    job.steps,
    'Install Playwright Chromium',
    'Verify Preview in browser',
  )
})

test('dev validates and deploys the persistent Cloudflare Staging environment', async () => {
  const config = await workflow('deploy-staging')
  assert.deepEqual(config.on.push.branches, ['dev'])

  const job = config.jobs['validate-and-deploy']
  assert.equal(job.environment, 'staging')
  assert.equal(job.env.CLOUDFLARE_API_TOKEN, '${{ secrets.CLOUDFLARE_API_TOKEN }}')
  assert.match(job.steps.find((step) => step.name === 'Validate application').run, /pnpm test:photo-skill/)
  assert.match(job.steps.find((step) => step.name === 'Validate application').run, /pnpm test:deployment/)
  const deploy = job.steps.find((step) => step.name === 'Deploy exact commit to Cloudflare Staging')
  assert.match(deploy.run, /opennextjs-cloudflare deploy --env staging/)
  const browserCheck = job.steps.find(
    (step) => step.name === 'Verify Staging in browser',
  )
  assert.equal(
    browserCheck.env.PLAYWRIGHT_BASE_URL,
    'https://matthew-miao-staging.matthew6688.workers.dev',
  )
  assert.match(browserCheck.run, /pnpm test:browser:hosted/)
  assertOrdered(job.steps, 'Validate application', 'Deploy exact commit to Cloudflare Staging')
  assertOrdered(
    job.steps,
    'Deploy exact commit to Cloudflare Staging',
    'Wait for Staging deployment convergence',
  )
  assert.match(
    job.steps.find((step) => step.name === 'Wait for Staging deployment convergence').run,
    /wait-for-cloudflare-deployment\.mjs/,
  )
  assertOrdered(
    job.steps,
    'Wait for Staging deployment convergence',
    'Install Playwright Chromium',
  )
  assertOrdered(
    job.steps,
    'Install Playwright Chromium',
    'Verify Staging in browser',
  )
})

test('main validates and deploys the exact commit to Cloudflare Workers', async () => {
  const config = await workflow('deploy-production')
  assert.deepEqual(config.on.push.branches, ['main'])

  const job = config.jobs['validate-and-deploy']
  assert.equal(job.environment, 'production')
  assert.equal(
    job.env.CLOUDFLARE_API_TOKEN,
    '${{ secrets.CLOUDFLARE_API_TOKEN }}',
  )
  assert.equal(job.env.CALCOM_API_KEY, '${{ secrets.CALCOM_API_KEY }}')
  assertOrdered(
    job.steps,
    'Install dependencies',
    'Validate application',
  )
  assertOrdered(
    job.steps,
    'Validate application',
    'Verify Cal.com booking contract',
  )
  assertOrdered(
    job.steps,
    'Verify Cal.com booking contract',
    'Deploy exact commit to Cloudflare Workers',
  )
  const calcom = job.steps.find(
    (step) => step.name === 'Verify Cal.com booking contract',
  )
  assert.equal(calcom.if, undefined)
  assert.equal(calcom.run, 'pnpm verify:calcom')
  const validate = job.steps.find(
    (step) => step.name === 'Validate application',
  )
  assert.match(validate.run, /pnpm typecheck/)
  assert.match(validate.run, /pnpm test:unit/)
  assert.match(validate.run, /pnpm test:photo-skill/)
  assert.match(validate.run, /pnpm test:localization/)
  assert.match(validate.run, /pnpm test:deployment/)
  assert.match(validate.run, /pnpm build:cloudflare/)
  const deploy = job.steps.find(
    (step) => step.name === 'Deploy exact commit to Cloudflare Workers',
  )
  assert.match(deploy.run, /opennextjs-cloudflare deploy/)
  assertOrdered(
    job.steps,
    'Deploy exact commit to Cloudflare Workers',
    'Wait for Production deployment convergence',
  )
  assert.match(
    job.steps.find((step) => step.name === 'Wait for Production deployment convergence').run,
    /wait-for-cloudflare-deployment\.mjs/,
  )
  assertOrdered(
    job.steps,
    'Wait for Production deployment convergence',
    'Install Playwright Chromium',
  )
  assertOrdered(
    job.steps,
    'Install Playwright Chromium',
    'Verify production routes',
  )
  assert.doesNotMatch(JSON.stringify(job), /VERCEL_/)
})

test('Production canary probes continuously and owns a deduplicated incident', async () => {
  const config = await workflow('production-canary')
  assert.deepEqual(config.on.schedule, [
    { cron: '7,22,37,52 * * * *' },
  ])
  assert.deepEqual(config.permissions, { contents: 'read', issues: 'write' })
  assert.equal(config.concurrency.group, 'production-canary')
  assert.equal(config.concurrency['cancel-in-progress'], true)

  const job = config.jobs.probe
  const health = job.steps.find(
    (step) => step.name === 'Probe Production twice before alerting',
  )
  assert.equal(health['continue-on-error'], true)
  assert.equal(
    health.run,
    'node scripts/verify-production-health.mjs https://matthew-miao.com "$RUNNER_TEMP/production-canary.md"',
  )

  const alert = job.steps.find(
    (step) => step.name === 'Open or update Production incident',
  )
  assert.equal(alert.if, "always() && steps.health.outcome == 'failure'")
  assert.match(alert.run, /gh issue create/)
  assert.match(alert.run, /gh issue comment/)
  assert.match(alert.run, /needs-triage/)
  assert.match(alert.run, /--assignee matthew6688/)

  const infrastructureAlert = job.steps.find(
    (step) => step.name === 'Open or update canary infrastructure incident',
  )
  assert.equal(infrastructureAlert.if, "always() && steps.health.outcome == 'skipped'")
  assert.match(infrastructureAlert.run, /monitor did not run/)
  assert.match(infrastructureAlert.run, /gh issue create/)

  const recovery = job.steps.find(
    (step) => step.name === 'Close recovered Production incident',
  )
  assert.equal(recovery.if, "always() && steps.health.outcome == 'success'")
  assert.match(recovery.run, /gh issue close/)

  const infrastructureRecovery = job.steps.find(
    (step) => step.name === 'Close recovered canary infrastructure incident',
  )
  assert.equal(infrastructureRecovery.if, "always() && steps.health.outcome == 'success'")
  assert.match(infrastructureRecovery.run, /gh issue close/)
})

test('release pull requests reject unsafe migrations before merging to main', async () => {
  const config = await workflow('security')
  const job = config.jobs.quality
  const checkout = job.steps.find((step) => step.name === 'Check out repository')
  assert.equal(checkout.with['fetch-depth'], 0)

  const check = job.steps.find(
    (step) => step.name === 'Check Production migration compatibility',
  )
  assert.match(check.if, /github\.base_ref == 'main'/)
  assert.match(check.run, /check-production-migrations\.mjs/)
  assert.equal(check.env.BASE_SHA, '${{ github.event.pull_request.base.sha }}')
  assert.equal(check.env.HEAD_SHA, '${{ github.event.pull_request.head.sha }}')
  const browserCheck = job.steps.find(
    (step) => step.name === 'Test browser release gate',
  )
  assert.match(browserCheck.run, /pnpm test:browser/)
  assert.equal(
    job.steps.find((step) => step.name === 'Test agent photo management gate').run,
    'pnpm test:photo-skill',
  )
  assertOrdered(job.steps, 'Build', 'Test browser release gate')
})

test('quality runs the canonical Vitest suite exactly once', async () => {
  const config = await workflow('security')
  const job = config.jobs.quality
  const packageJson = JSON.parse(await text('package.json'))

  assert.equal(
    packageJson.scripts['test:unit'],
    "vitest run app components db lib --exclude='**/*.live.test.ts'",
    'the canonical suite must include security and every non-live Media test',
  )

  const unitSteps = job.steps.filter(
    (step) => typeof step.run === 'string' && step.run.includes('pnpm test:unit'),
  )
  assert.equal(unitSteps.length, 1, 'quality must run pnpm test:unit once')

  const validate = job.steps.find(
    (step) => step.name === 'Validate database migrations',
  )
  assert.equal(validate?.run, 'pnpm db:validate')

  // The focused suites stay as local diagnostic commands; quality must not
  // rerun what the canonical non-live glob already owns.
  const rerun = job.steps.filter(
    (step) =>
      typeof step.run === 'string' &&
      /pnpm test:(ama|security|media:)/.test(step.run),
  )
  assert.deepEqual(
    rerun.map((step) => step.name),
    [],
    'quality must not rerun suites owned by pnpm test:unit',
  )

  assertOrdered(job.steps, 'Typecheck', 'Test unit and integration suites')
  assertOrdered(
    job.steps,
    'Test unit and integration suites',
    'Validate database migrations',
  )
  assertOrdered(job.steps, 'Validate database migrations', 'Test deployment workflows')
  assertOrdered(job.steps, 'Test deployment workflows', 'Test localization')
  assertOrdered(job.steps, 'Test localization', 'Audit production dependencies')
  assertOrdered(job.steps, 'Audit production dependencies', 'Build')
  assertOrdered(job.steps, 'Build', 'Install Playwright browsers')
  assertOrdered(job.steps, 'Install Playwright browsers', 'Test browser release gate')
  assertOrdered(job.steps, 'Test browser release gate', 'Verify public links')
  assertOrdered(job.steps, 'Verify public links', 'Verify legacy URL contract')
  assertOrdered(
    job.steps,
    'Verify legacy URL contract',
    'Verify public discovery and failure handling',
  )
  assertOrdered(
    job.steps,
    'Verify public discovery and failure handling',
    'Verify production security boundary',
  )
  const install = job.steps.find(
    (step) => step.name === 'Install Playwright browsers',
  )
  assert.equal(
    install?.run,
    'pnpm exec playwright install --with-deps chromium webkit',
  )
})
