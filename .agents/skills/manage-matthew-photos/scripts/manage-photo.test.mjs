import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { chmod, mkdtemp, mkdir, readFile, readdir, rename, stat, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import test from 'node:test'

import sharp from 'sharp'

const execFileAsync = promisify(execFile)
const script = path.resolve(import.meta.dirname, 'manage-photo.mjs')

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'matthew-photo-skill-'))
  await mkdir(path.join(root, 'content/photos'), { recursive: true })
  await writeFile(
    path.join(root, 'content/photos/catalog.json'),
    JSON.stringify({ version: 1, revision: 'empty', publishedAt: null, items: [] }, null, 2) + '\n',
  )
  const source = path.join(root, 'owned-photo.jpg')
  await sharp({
    create: { width: 1200, height: 900, channels: 3, background: '#8a9a78' },
  }).jpeg().withMetadata({ exif: { IFD0: { Artist: 'private metadata' } } }).toFile(source)
  return { root, source }
}

async function run(root, args, rejects = false) {
  const operation = execFileAsync(process.execPath, [script, ...args], {
    env: { ...process.env, PHOTO_SKILL_REPO_ROOT: root },
  })
  return rejects ? assert.rejects(operation) : operation
}

async function catalog(root) {
  return JSON.parse(await readFile(path.join(root, 'content/photos/catalog.json'), 'utf8'))
}

test('import --publish creates stripped public renditions and a published manifest entry', async () => {
  const { root, source } = await fixture()
  await run(root, [
    'import', source,
    '--id', 'owned-photo',
    '--alt-zh', '一张本人拥有的测试照片',
    '--alt-en', 'An owned test photo',
    '--publish',
  ])

  const data = await catalog(root)
  assert.equal(data.items[0].published, true)
  assert.deepEqual(data.items[0].renditions.map((item) => item.profileWidth), [640, 1024, 1600, 2560])
  const publicFile = path.join(root, 'public/images/photos/owned-photo/owned-photo-640.jpg')
  assert.equal((await stat(publicFile)).isFile(), true)
  const metadata = await sharp(publicFile).metadata()
  assert.equal(metadata.exif, undefined)
})

test('unpublish removes public delivery while retaining staged derivatives', async () => {
  const { root, source } = await fixture()
  await run(root, ['import', source, '--id', 'owned-photo', '--alt-zh', '测试照片', '--alt-en', 'Test photo', '--publish'])
  await run(root, ['unpublish', 'owned-photo'])

  const data = await catalog(root)
  assert.equal(data.items[0].published, false)
  await assert.rejects(stat(path.join(root, 'public/images/photos/owned-photo/owned-photo-640.jpg')))
  assert.equal((await stat(path.join(root, '.photo-staging/owned-photo/owned-photo-640.jpg'))).isFile(), true)
})

test('permanent delete requires an exact confirmation and never touches the supplied Original', async () => {
  const { root, source } = await fixture()
  await run(root, ['import', source, '--id', 'owned-photo', '--alt-zh', '测试照片', '--alt-en', 'Test photo'])

  await run(root, ['delete', 'owned-photo'], true)
  assert.equal((await catalog(root)).items.length, 1)
  assert.equal((await stat(source)).isFile(), true)

  await run(root, ['delete', 'owned-photo', '--confirm', 'permanent-delete:owned-photo'])
  assert.equal((await catalog(root)).items.length, 0)
  assert.equal((await stat(source)).isFile(), true)
})

test('malformed catalog paths are rejected before permanent deletion', async () => {
  const { root, source } = await fixture()
  await run(root, ['import', source, '--id', 'owned-photo', '--alt-zh', '测试照片', '--alt-en', 'Test photo'])
  const data = await catalog(root)
  data.items[0].renditions[0].fileName = '../../../owned-photo.jpg'
  await writeFile(path.join(root, 'content/photos/catalog.json'), `${JSON.stringify(data, null, 2)}\n`)

  await run(root, ['delete', 'owned-photo', '--confirm', 'permanent-delete:owned-photo'], true)
  assert.equal((await stat(source)).isFile(), true)
})

test('publish rejects a symlinked public directory without writing outside the repository boundary', async () => {
  const { root, source } = await fixture()
  await run(root, ['import', source, '--id', 'owned-photo', '--alt-zh', '测试照片', '--alt-en', 'Test photo'])
  const outside = await mkdtemp(path.join(tmpdir(), 'matthew-photo-outside-'))
  await mkdir(path.join(root, 'public/images'), { recursive: true })
  await symlink(outside, path.join(root, 'public/images/photos'))

  await run(root, ['publish', 'owned-photo'], true)
  assert.deepEqual(await readdir(outside), [])
})

test('unpublish rolls file moves back when the catalog cannot be committed', async () => {
  const { root, source } = await fixture()
  await run(root, ['import', source, '--id', 'owned-photo', '--alt-zh', '测试照片', '--alt-en', 'Test photo', '--publish'])
  const catalogDir = path.join(root, 'content/photos')
  await chmod(catalogDir, 0o555)
  try {
    await run(root, ['unpublish', 'owned-photo'], true)
  } finally {
    await chmod(catalogDir, 0o755)
  }

  assert.equal((await catalog(root)).items[0].published, true)
  assert.equal((await stat(path.join(root, 'public/images/photos/owned-photo/owned-photo-640.jpg'))).isFile(), true)
})

test('EXIF orientation is reflected in intrinsic dimensions and validated ratios', async () => {
  const { root } = await fixture()
  const source = path.join(root, 'rotated-photo.jpg')
  await sharp({
    create: { width: 1200, height: 900, channels: 3, background: '#728aa0' },
  })
    .jpeg()
    .withMetadata({ orientation: 6 })
    .toFile(source)

  await run(root, ['import', source, '--id', 'rotated-photo', '--alt-zh', '旋转测试照片', '--alt-en', 'Rotated test photo'])
  const data = await catalog(root)
  assert.equal(data.items[0].width, 900)
  assert.equal(data.items[0].height, 1200)
  await run(root, ['validate'])
})

test('delete refuses a photo directory containing any unlisted file', async () => {
  const { root, source } = await fixture()
  await run(root, ['import', source, '--id', 'owned-photo', '--alt-zh', '测试照片', '--alt-en', 'Test photo'])
  const unexpected = path.join(root, '.photo-staging/owned-photo/original.jpg')
  await writeFile(unexpected, 'must survive')

  await run(root, ['delete', 'owned-photo', '--confirm', 'permanent-delete:owned-photo'], true)
  assert.equal(await readFile(unexpected, 'utf8'), 'must survive')
  assert.equal((await catalog(root)).items.length, 1)
})

test('a stale lock and interrupted atomic publish recover before the next operation', async () => {
  const { root, source } = await fixture()
  await run(root, ['import', source, '--id', 'owned-photo', '--alt-zh', '测试照片', '--alt-en', 'Test photo'])
  const staging = path.join(root, '.photo-staging/owned-photo')
  const published = path.join(root, 'public/images/photos/owned-photo')
  const transactions = path.join(root, '.photo-staging/.transactions')
  await mkdir(path.dirname(published), { recursive: true })
  await mkdir(transactions, { recursive: true })
  await rename(staging, published)
  await writeFile(
    path.join(transactions, 'active.json'),
    `${JSON.stringify({ operation: 'publish', id: 'owned-photo', targetPublished: true })}\n`,
  )
  await writeFile(
    path.join(root, '.photo-catalog.lock'),
    `${JSON.stringify({ pid: 99999999, createdAt: '2026-08-10T00:00:00.000Z' })}\n`,
  )

  await run(root, ['publish', 'owned-photo'])
  assert.equal((await catalog(root)).items[0].published, true)
  assert.equal((await stat(path.join(published, 'owned-photo-640.jpg'))).isFile(), true)
})

test('validate rejects every unregistered public file regardless of extension', async () => {
  const { root, source } = await fixture()
  await run(root, ['import', source, '--id', 'owned-photo', '--alt-zh', '测试照片', '--alt-en', 'Test photo', '--publish'])
  const leakedOriginal = path.join(root, 'public/images/photos/original.heic')
  await writeFile(leakedOriginal, 'private original bytes')

  await run(root, ['validate'], true)
  assert.equal(await readFile(leakedOriginal, 'utf8'), 'private original bytes')
})

test('updates bilingual alt text and focal point through validated commands', async () => {
  const { root, source } = await fixture()
  await run(root, ['import', source, '--id', 'owned-photo', '--alt-zh', '旧中文', '--alt-en', 'Old English', '--publish'])

  await run(root, ['update-alt', 'owned-photo', '--alt-zh', '树荫下的一张照片', '--alt-en', 'A photo beneath the trees'])
  await run(root, ['set-focal-point', 'owned-photo', '--x', '0.35', '--y', '0.6'])

  const data = await catalog(root)
  assert.deepEqual(data.items[0].altText, {
    zhHans: '树荫下的一张照片',
    en: 'A photo beneath the trees',
  })
  assert.deepEqual(data.items[0].focalPoint, { x: 0.35, y: 0.6 })
  await run(root, ['validate'])
})

test('rejects invalid focal points before changing the catalog', async () => {
  const { root, source } = await fixture()
  await run(root, ['import', source, '--id', 'owned-photo', '--alt-zh', '测试照片', '--alt-en', 'Test photo'])
  const before = await readFile(path.join(root, 'content/photos/catalog.json'), 'utf8')

  await run(root, ['set-focal-point', 'owned-photo', '--x', '1.1', '--y', '0.5'], true)
  assert.equal(await readFile(path.join(root, 'content/photos/catalog.json'), 'utf8'), before)
})

test('refuses photo mutations on a protected repository branch', async () => {
  const { root, source } = await fixture()
  await execFileAsync('git', ['init', '--initial-branch=main'], { cwd: root })

  const operation = execFileAsync(process.execPath, [script, 'import', source, '--id', 'owned-photo', '--alt-zh', '测试照片', '--alt-en', 'Test photo'], {
    env: { ...process.env, PHOTO_SKILL_REPO_ROOT: root },
  })
  await assert.rejects(operation, /protected branch: main/)
  assert.equal((await catalog(root)).items.length, 0)
})
