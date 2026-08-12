#!/usr/bin/env node

import { createHash, randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { constants } from 'node:fs'
import {
  access,
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  rm,
  rmdir,
  writeFile,
} from 'node:fs/promises'
import path from 'node:path'

import decodeHeic from 'heic-decode'
import sharp from 'sharp'

const PROFILE_WIDTHS = [640, 1024, 1600, 2560]
const root = path.resolve(
  process.env.PHOTO_SKILL_REPO_ROOT ?? path.resolve(import.meta.dirname, '../../../..'),
)
const catalogPath = path.join(root, 'content/photos/catalog.json')
const publicDir = path.join(root, 'public/images/photos')
const stagingDir = path.join(root, '.photo-staging')
const transactionDir = path.join(stagingDir, '.transactions')
const journalPath = path.join(transactionDir, 'active.json')
const lockPath = path.join(root, '.photo-catalog.lock')
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const checksumPattern = /^[a-f0-9]{64}$/
const isoTimestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

function usage() {
  throw new Error(
    'Usage: manage-photo.mjs import SOURCE --id ID --alt-zh TEXT --alt-en TEXT [--publish] | publish ID | unpublish ID | update-alt ID --alt-zh TEXT --alt-en TEXT | set-focal-point ID --x 0..1 --y 0..1 | delete ID --confirm permanent-delete:ID | validate | list',
  )
}

function options(args) {
  const result = { positional: [] }
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index]
    if (!token.startsWith('--')) {
      result.positional.push(token)
      continue
    }
    const key = token.slice(2)
    if (key === 'publish') {
      result.publish = true
      continue
    }
    const value = args[index + 1]
    if (!value || value.startsWith('--')) usage()
    result[key] = value
    index += 1
  }
  return result
}

async function readCatalog() {
  const catalog = JSON.parse(await readFile(catalogPath, 'utf8'))
  assertCatalog(catalog)
  return catalog
}

async function writeCatalog(catalog) {
  await ensureDirectory(path.dirname(catalogPath))
  assertCatalog(catalog)
  const temporary = `${catalogPath}.${process.pid}.${randomUUID()}.tmp`
  await writeFile(temporary, `${JSON.stringify(catalog, null, 2)}\n`, { flag: 'wx' })
  try {
    await rename(temporary, catalogPath)
  } catch (error) {
    await rm(temporary, { force: true })
    throw error
  }
}

function assertCatalog(catalog) {
  if (
    catalog?.version !== 1 ||
    typeof catalog.revision !== 'string' ||
    !catalog.revision ||
    (catalog.publishedAt !== null && !isoTimestampPattern.test(catalog.publishedAt ?? '')) ||
    !Array.isArray(catalog.items)
  ) {
    throw new Error('Invalid catalog')
  }
  const ids = new Set()
  for (const item of catalog.items) {
    if (
      !idPattern.test(item?.id ?? '') ||
      ids.has(item.id) ||
      typeof item.published !== 'boolean' ||
      item.rights !== 'owned' ||
      !Number.isInteger(item.width) ||
      item.width <= 0 ||
      !Number.isInteger(item.height) ||
      item.height <= 0 ||
      !isoTimestampPattern.test(item.importedAt ?? '') ||
      typeof item.focalPoint?.x !== 'number' ||
      item.focalPoint.x < 0 ||
      item.focalPoint.x > 1 ||
      typeof item.focalPoint?.y !== 'number' ||
      item.focalPoint.y < 0 ||
      item.focalPoint.y > 1 ||
      !item.altText?.zhHans?.trim() ||
      !item.altText?.en?.trim() ||
      !Array.isArray(item.renditions) ||
      item.renditions.length !== PROFILE_WIDTHS.length
    ) {
      throw new Error(`Invalid catalog entry: ${item?.id ?? 'unknown'}`)
    }
    ids.add(item.id)
    const widths = new Set()
    for (const [index, rendition] of item.renditions.entries()) {
      if (
        rendition.profileWidth !== PROFILE_WIDTHS[index] ||
        widths.has(rendition.profileWidth) ||
        rendition.fileName !== `${item.id}-${rendition.profileWidth}.jpg` ||
        !Number.isInteger(rendition.width) ||
        rendition.width <= 0 ||
        !Number.isInteger(rendition.height) ||
        rendition.height <= 0 ||
        !checksumPattern.test(rendition.checksumSha256 ?? '')
      ) {
        throw new Error(`Invalid rendition for: ${item.id}`)
      }
      widths.add(rendition.profileWidth)
    }
  }
  if (catalog.items.some(({ published }) => published) && !catalog.publishedAt) {
    throw new Error('Published photos require a catalog publication timestamp')
  }
}

async function ensureDirectory(directory) {
  const relative = path.relative(root, directory)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Photo directory escapes the repository: ${directory}`)
  }
  let current = root
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment)
    try {
      const info = await lstat(current)
      if (!info.isDirectory() || info.isSymbolicLink()) {
        throw new Error(`Unsafe photo directory: ${current}`)
      }
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
      await mkdir(current)
    }
  }
}

async function regularFile(file) {
  const info = await lstat(file)
  if (!info.isFile() || info.isSymbolicLink()) throw new Error(`Unsafe photo file: ${file}`)
}

async function exists(target) {
  try {
    await lstat(target)
    return true
  } catch (error) {
    if (error?.code === 'ENOENT') return false
    throw error
  }
}

async function assertExactPhotoDirectory(directory, item) {
  await ensureDirectory(directory)
  const expected = new Set(item.renditions.map(({ fileName }) => fileName))
  const actual = await readdir(directory)
  if (
    actual.length !== expected.size ||
    actual.some((fileName) => !expected.has(fileName))
  ) {
    throw new Error(`Photo directory contains unexpected files: ${directory}`)
  }
  for (const fileName of expected) await regularFile(path.join(directory, fileName))
}

async function removeExactPhotoDirectory(directory, fileNames) {
  const actual = await readdir(directory)
  const expected = new Set(fileNames)
  if (
    actual.length !== expected.size ||
    actual.some((fileName) => !expected.has(fileName))
  ) {
    throw new Error(`Refusing to remove a photo directory with unexpected files: ${directory}`)
  }
  for (const fileName of expected) await rm(path.join(directory, fileName))
  await rmdir(directory)
}

async function removeGeneratedPhotoDirectory(directory, allowedFileNames) {
  if (!(await exists(directory))) return
  const actual = await readdir(directory)
  const allowed = new Set(allowedFileNames)
  if (actual.some((fileName) => !allowed.has(fileName))) {
    throw new Error(`Refusing to clean a photo directory with unexpected files: ${directory}`)
  }
  for (const fileName of actual) await rm(path.join(directory, fileName))
  await rmdir(directory)
}

async function writeJournal(journal) {
  await ensureDirectory(transactionDir)
  const temporary = path.join(transactionDir, `journal-${randomUUID()}.tmp`)
  await writeFile(temporary, `${JSON.stringify(journal)}\n`, { flag: 'wx' })
  await rename(temporary, journalPath)
}

async function recoverJournal() {
  if (!(await exists(journalPath))) return
  const journal = JSON.parse(await readFile(journalPath, 'utf8'))
  const catalog = await readCatalog()
  const item = catalog.items.find(({ id }) => id === journal.id)
  if (!idPattern.test(journal.id ?? '') || !['publish', 'unpublish', 'delete'].includes(journal.operation)) {
    throw new Error('Invalid photo transaction journal; manual recovery required')
  }
  if (journal.operation === 'delete') {
    if (
      typeof journal.sourcePublished !== 'boolean' ||
      !Array.isArray(journal.fileNames) ||
      journal.fileNames.length !== PROFILE_WIDTHS.length ||
      journal.fileNames.some((fileName, index) =>
        fileName !== `${journal.id}-${PROFILE_WIDTHS[index]}.jpg`,
      )
    ) {
      throw new Error('Invalid delete transaction journal; manual recovery required')
    }
    const source = path.join(journal.sourcePublished ? publicDir : stagingDir, journal.id)
    const trash = path.join(transactionDir, `delete-${journal.id}`)
    const sourceExists = await exists(source)
    const trashExists = await exists(trash)
    if (item) {
      if (trashExists && !sourceExists) {
        await rename(trash, source)
      } else if (trashExists || !sourceExists) {
        throw new Error('Ambiguous delete transaction; manual recovery required')
      }
    } else if (trashExists && !sourceExists) {
      await removeExactPhotoDirectory(trash, journal.fileNames)
    } else if (sourceExists || trashExists) {
      throw new Error('Ambiguous committed delete transaction; manual recovery required')
    }
  } else {
    if (
      typeof journal.targetPublished !== 'boolean' ||
      (journal.operation === 'publish') !== journal.targetPublished
    ) {
      throw new Error('Invalid photo transaction journal; manual recovery required')
    }
    const source = path.join(journal.targetPublished ? stagingDir : publicDir, journal.id)
    const target = path.join(journal.targetPublished ? publicDir : stagingDir, journal.id)
    const committed = item?.published === journal.targetPublished
    const sourceExists = await exists(source)
    const targetExists = await exists(target)
    if (!committed && targetExists && !sourceExists) {
      await rename(target, source)
    } else if (!committed && (!sourceExists || targetExists)) {
      throw new Error('Ambiguous photo transaction; manual recovery required')
    }
    if (committed && (!targetExists || sourceExists)) {
      throw new Error('Committed photo transaction is missing its target directory')
    }
  }
  await rm(journalPath, { force: true })
}

async function withLock(operation) {
  let handle
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      handle = await open(lockPath, 'wx')
      await handle.writeFile(`${JSON.stringify({ pid: process.pid, createdAt: new Date().toISOString() })}\n`)
      break
    } catch (error) {
      if (error?.code !== 'EEXIST' || attempt > 0) throw new Error('Another photo operation is already running')
      const lock = JSON.parse(await readFile(lockPath, 'utf8')).pid
      try {
        process.kill(lock, 0)
        throw new Error('Another photo operation is already running')
      } catch (processError) {
        if (processError?.code !== 'ESRCH') throw processError
        await rm(lockPath, { force: true })
      }
    }
  }
  try {
    await recoverJournal()
    return await operation()
  } finally {
    await handle.close()
    await rm(lockPath, { force: true })
  }
}

function assertWorkBranch() {
  let branch
  try {
    branch = execFileSync('git', ['branch', '--show-current'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    if (process.env.PHOTO_SKILL_REPO_ROOT) return
    throw new Error('Photo mutations require a valid Git worktree')
  }
  if (!branch) throw new Error('Photo mutations require a named Git work branch')
  if (branch === 'main' || branch === 'dev') {
    throw new Error(`Refusing to mutate photos directly on protected branch: ${branch}`)
  }
  if (!process.env.PHOTO_SKILL_REPO_ROOT) {
    try {
      execFileSync('git', ['merge-base', '--is-ancestor', 'origin/main', 'HEAD'], {
        cwd: root,
        stdio: 'ignore',
      })
    } catch {
      throw new Error('Photo work branch must include current origin/main')
    }
  }
}

function touchPublication(catalog) {
  const now = new Date().toISOString()
  catalog.revision = `photos-${now.replace(/[-:.TZ]/g, '')}`
  catalog.publishedAt = now
}

function entry(catalog, id) {
  const item = catalog.items.find((candidate) => candidate.id === id)
  if (!item) throw new Error(`Unknown photo: ${id}`)
  return item
}

async function imagePipeline(sourcePath) {
  const bytes = await readFile(sourcePath)
  const extension = path.extname(sourcePath).toLowerCase()
  if (extension === '.heic' || extension === '.heif') {
    const decoded = await decodeHeic({ buffer: bytes })
    return {
      pipeline: sharp(decoded.data, {
        raw: { width: decoded.width, height: decoded.height, channels: 4 },
      }).toColourspace('srgb'),
      width: decoded.width,
      height: decoded.height,
    }
  }
  const metadata = await sharp(bytes, { failOn: 'error' }).metadata()
  if (!['jpeg', 'png'].includes(metadata.format ?? '')) {
    throw new Error('Only HEIC/HEIF, JPEG, and PNG photos are supported')
  }
  const pipeline = sharp(bytes, { failOn: 'error' }).autoOrient().toColourspace('srgb')
  if (!metadata.width || !metadata.height) throw new Error('Photo dimensions are unavailable')
  const swapsAxes = [5, 6, 7, 8].includes(metadata.orientation ?? 1)
  return {
    pipeline,
    width: swapsAxes ? metadata.height : metadata.width,
    height: swapsAxes ? metadata.width : metadata.height,
  }
}

async function importPhoto(args) {
  const parsed = options(args)
  const [source] = parsed.positional
  const id = parsed.id
  if (!source || !id || !idPattern.test(id) || !parsed['alt-zh']?.trim() || !parsed['alt-en']?.trim()) usage()
  await access(source, constants.R_OK)

  const catalog = await readCatalog()
  if (catalog.items.some((item) => item.id === id)) throw new Error(`Photo already exists: ${id}`)
  await ensureDirectory(stagingDir)
  await ensureDirectory(transactionDir)
  const destination = path.join(stagingDir, id)
  await access(destination).then(
    () => { throw new Error(`Draft directory already exists: ${id}`) },
    () => undefined,
  )
  const temporary = path.join(transactionDir, `import-${id}-${randomUUID()}`)
  await ensureDirectory(temporary)
  const { pipeline, width, height } = await imagePipeline(source)
  const renditions = []
  try {
    for (const profileWidth of PROFILE_WIDTHS) {
      const fileName = `${id}-${profileWidth}.jpg`
      const { data, info } = await pipeline
        .clone()
        .resize({ width: profileWidth, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 90, progressive: true, chromaSubsampling: '4:4:4' })
        .toBuffer({ resolveWithObject: true })
      await writeFile(path.join(temporary, fileName), data, { flag: 'wx' })
      renditions.push({
        profileWidth,
        fileName,
        width: info.width,
        height: info.height,
        checksumSha256: createHash('sha256').update(data).digest('hex'),
      })
    }
    await rename(temporary, destination)
  } catch (error) {
    await removeGeneratedPhotoDirectory(
      temporary,
      PROFILE_WIDTHS.map((profileWidth) => `${id}-${profileWidth}.jpg`),
    )
    throw error
  }
  catalog.items.push({
    id,
    published: false,
    width,
    height,
    altText: { zhHans: parsed['alt-zh'].trim(), en: parsed['alt-en'].trim() },
    rights: 'owned',
    importedAt: new Date().toISOString(),
    focalPoint: { x: 0.5, y: 0.5 },
    renditions,
  })
  try {
    await writeCatalog(catalog)
  } catch (error) {
    await removeExactPhotoDirectory(
      destination,
      renditions.map(({ fileName }) => fileName),
    )
    throw error
  }
  if (parsed.publish) await publishPhoto(id)
  else console.log(`Imported draft: ${id}`)
}

async function publishPhoto(id) {
  const catalog = await readCatalog()
  const item = entry(catalog, id)
  if (item.published) throw new Error(`Photo is already published: ${id}`)
  const source = path.join(stagingDir, id)
  const target = path.join(publicDir, id)
  await assertExactPhotoDirectory(source, item)
  await ensureDirectory(publicDir)
  if (await exists(target)) throw new Error(`Published photo directory already exists: ${id}`)
  await writeJournal({ operation: 'publish', id, targetPublished: true })
  await rename(source, target)
  item.published = true
  touchPublication(catalog)
  try {
    await writeCatalog(catalog)
  } catch (error) {
    await rename(target, source)
    await rm(journalPath, { force: true })
    throw error
  }
  await rm(journalPath, { force: true })
  console.log(`Published: ${id}`)
}

async function unpublishPhoto(id) {
  const catalog = await readCatalog()
  const item = entry(catalog, id)
  if (!item.published) throw new Error(`Photo is not published: ${id}`)
  const source = path.join(publicDir, id)
  const target = path.join(stagingDir, id)
  await assertExactPhotoDirectory(source, item)
  await ensureDirectory(stagingDir)
  if (await exists(target)) throw new Error(`Draft photo directory already exists: ${id}`)
  await writeJournal({ operation: 'unpublish', id, targetPublished: false })
  await rename(source, target)
  item.published = false
  touchPublication(catalog)
  try {
    await writeCatalog(catalog)
  } catch (error) {
    await rename(target, source)
    await rm(journalPath, { force: true })
    throw error
  }
  await rm(journalPath, { force: true })
  console.log(`Unpublished: ${id}`)
}

async function updateAltText(id, args) {
  const parsed = options(args)
  if (
    parsed.positional.length ||
    !parsed['alt-zh']?.trim() ||
    !parsed['alt-en']?.trim()
  ) usage()
  const catalog = await readCatalog()
  const item = entry(catalog, id)
  item.altText = {
    zhHans: parsed['alt-zh'].trim(),
    en: parsed['alt-en'].trim(),
  }
  if (item.published) touchPublication(catalog)
  await writeCatalog(catalog)
  console.log(`Updated bilingual alt text: ${id}`)
}

async function setFocalPoint(id, args) {
  const parsed = options(args)
  const x = Number(parsed.x)
  const y = Number(parsed.y)
  if (
    parsed.positional.length ||
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    x < 0 ||
    x > 1 ||
    y < 0 ||
    y > 1
  ) usage()
  const catalog = await readCatalog()
  const item = entry(catalog, id)
  item.focalPoint = { x, y }
  if (item.published) touchPublication(catalog)
  await writeCatalog(catalog)
  console.log(`Updated focal point: ${id} (${x}, ${y})`)
}

async function deletePhoto(id, confirmation) {
  if (confirmation !== `permanent-delete:${id}`) {
    throw new Error(`Refusing permanent delete; pass --confirm permanent-delete:${id}`)
  }
  const catalog = await readCatalog()
  const item = entry(catalog, id)
  await ensureDirectory(transactionDir)
  const source = path.join(item.published ? publicDir : stagingDir, id)
  const trash = path.join(transactionDir, `delete-${id}`)
  await assertExactPhotoDirectory(source, item)
  if (await exists(trash)) throw new Error(`Delete transaction already exists: ${id}`)
  await writeJournal({
    operation: 'delete',
    id,
    sourcePublished: item.published,
    fileNames: item.renditions.map(({ fileName }) => fileName),
  })
  await rename(source, trash)
  try {
    catalog.items = catalog.items.filter((candidate) => candidate.id !== id)
    if (item.published) touchPublication(catalog)
    await writeCatalog(catalog)
  } catch (error) {
    await rename(trash, source)
    await rm(journalPath, { force: true })
    throw error
  }
  await removeExactPhotoDirectory(
    trash,
    item.renditions.map(({ fileName }) => fileName),
  )
  await rm(journalPath, { force: true })
  console.log(`Permanently deleted website derivatives: ${id}`)
}

async function validate() {
  const catalog = await readCatalog()
  const publishedIds = new Set()
  for (const item of catalog.items) {
    const base = path.join(item.published ? publicDir : stagingDir, item.id)
    await assertExactPhotoDirectory(base, item)
    const intrinsicRatio = item.width / item.height
    for (const rendition of item.renditions) {
      const file = path.join(base, rendition.fileName)
      await regularFile(file)
      const bytes = await readFile(file)
      if (createHash('sha256').update(bytes).digest('hex') !== rendition.checksumSha256) {
        throw new Error(`Checksum mismatch: ${file}`)
      }
      const metadata = await sharp(bytes, { failOn: 'error' }).metadata()
      if (
        metadata.format !== 'jpeg' ||
        metadata.width !== rendition.width ||
        metadata.height !== rendition.height ||
        !metadata.isProgressive ||
        metadata.exif ||
        metadata.xmp ||
        metadata.iptc ||
        metadata.icc ||
        Math.abs(metadata.width / metadata.height - intrinsicRatio) > 0.003
      ) {
        throw new Error(`Unsafe or mismatched JPEG rendition: ${file}`)
      }
    }
    if (item.published) publishedIds.add(item.id)
  }
  const publicEntries = await readdir(publicDir, { withFileTypes: true }).catch(
    (error) => (error?.code === 'ENOENT' ? [] : Promise.reject(error)),
  )
  const unexpected = publicEntries.find(
    (directory) =>
      !directory.isDirectory() ||
      directory.isSymbolicLink() ||
      !publishedIds.has(directory.name),
  )
  if (unexpected || publicEntries.length !== publishedIds.size) {
    throw new Error(
      `Public photo tree contains an unexpected or missing entry: ${unexpected?.name ?? 'unknown'}`,
    )
  }
  console.log(`Valid photo catalog: ${catalog.items.length} entries`)
}

const [command, ...args] = process.argv.slice(2)
try {
  const mutating = new Set(['import', 'publish', 'unpublish', 'update-alt', 'set-focal-point', 'delete'])
  if (mutating.has(command)) assertWorkBranch()
  if (command === 'import') await withLock(() => importPhoto(args))
  else if (command === 'publish') await withLock(() => publishPhoto(args[0] ?? usage()))
  else if (command === 'unpublish') await withLock(() => unpublishPhoto(args[0] ?? usage()))
  else if (command === 'update-alt') {
    await withLock(() => updateAltText(args[0] ?? usage(), args.slice(1)))
  } else if (command === 'set-focal-point') {
    await withLock(() => setFocalPoint(args[0] ?? usage(), args.slice(1)))
  }
  else if (command === 'delete') {
    const parsed = options(args.slice(1))
    await withLock(() => deletePhoto(args[0] ?? usage(), parsed.confirm))
  } else if (command === 'validate') await validate()
  else if (command === 'list') console.log(JSON.stringify((await readCatalog()).items, null, 2))
  else usage()
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
