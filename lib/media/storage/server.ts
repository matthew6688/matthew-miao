import 'server-only'

import { getCloudflareContext } from '@opennextjs/cloudflare'

import { parseMediaPublicBaseUrl } from './config'
import { createR2MediaStorage, type MediaR2Bucket } from './r2'

let storage: ReturnType<typeof createR2MediaStorage> | undefined

const unavailableBucket: MediaR2Bucket = {
  async delete() {
    throw new Error('Media R2 binding unavailable')
  },
  async get() {
    throw new Error('Media R2 binding unavailable')
  },
  async head() {
    throw new Error('Media R2 binding unavailable')
  },
  async put() {
    throw new Error('Media R2 binding unavailable')
  },
}

declare global {
  interface CloudflareEnv {
    MEDIA_R2_BUCKET?: MediaR2Bucket
  }
}

export function getMediaStorage() {
  if (storage) return storage
  let bucket: MediaR2Bucket | undefined
  try {
    bucket = getCloudflareContext().env.MEDIA_R2_BUCKET
  } catch {
    // Next build, tests, and local Node execution have no Worker context.
  }
  storage = createR2MediaStorage({
    bucket: bucket ?? unavailableBucket,
    publicBaseUrl: parseMediaPublicBaseUrl(process.env),
  })
  return storage
}
