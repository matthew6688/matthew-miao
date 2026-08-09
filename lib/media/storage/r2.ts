import 'server-only'

import { MediaStorageError } from './errors'
import {
  assertContentAddressedRenditionKey,
  assertMediaObjectKey,
  assertMediaObjectNamespace,
  checksumBytes,
  createPublicMediaUrl,
  originalChunkObjectKey,
} from './object-key'

type R2ObjectMetadata = {
  size: number
  uploaded: Date
  httpMetadata?: { contentType?: string }
}

type R2ObjectBody = R2ObjectMetadata & {
  arrayBuffer(): Promise<ArrayBuffer>
}

export type MediaR2Bucket = {
  delete(key: string | string[]): Promise<void>
  get(key: string): Promise<R2ObjectBody | null>
  head(key: string): Promise<R2ObjectMetadata | null>
  put(
    key: string,
    value: Uint8Array,
    options: {
      httpMetadata: { contentType: string }
      sha256: ArrayBuffer
    },
  ): Promise<unknown>
}

type R2MediaStorageConfig = {
  bucket: MediaR2Bucket
  publicBaseUrl: URL
}

export function createR2MediaStorage({
  bucket,
  publicBaseUrl,
}: R2MediaStorageConfig) {
  const publicRenditionUrl = createPublicMediaUrl(publicBaseUrl)

  async function putObject(input: {
    key: string
    bytes: Uint8Array
    contentType: string
    checksumSha256: string
  }) {
    const checksum = checksumBytes(input.checksumSha256)
    try {
      await bucket.put(input.key, input.bytes, {
        httpMetadata: { contentType: input.contentType },
        sha256: checksum.buffer.slice(
          checksum.byteOffset,
          checksum.byteOffset + checksum.byteLength,
        ) as ArrayBuffer,
      })
    } catch {
      throw new MediaStorageError('provider_unavailable')
    }
  }

  async function inspectObject(key: string) {
    assertMediaObjectKey(key)
    let object
    try {
      object = await bucket.head(key)
    } catch {
      throw new MediaStorageError('provider_unavailable')
    }
    if (!object) throw new MediaStorageError('not_found')
    const contentType = object.httpMetadata?.contentType
    if (
      !Number.isSafeInteger(object.size) ||
      object.size < 0 ||
      !(object.uploaded instanceof Date) ||
      !contentType
    ) {
      throw new MediaStorageError('invalid_response')
    }
    return {
      byteSize: object.size,
      contentType,
      lastModified: object.uploaded,
    }
  }

  async function readObject(key: string) {
    assertMediaObjectKey(key)
    let object
    try {
      object = await bucket.get(key)
    } catch {
      throw new MediaStorageError('provider_unavailable')
    }
    if (!object) throw new MediaStorageError('not_found')
    try {
      return new Uint8Array(await object.arrayBuffer())
    } catch {
      throw new MediaStorageError('provider_unavailable')
    }
  }

  async function deleteObject(key: string) {
    assertMediaObjectKey(key)
    try {
      await bucket.delete(key)
    } catch {
      throw new MediaStorageError('provider_unavailable')
    }
  }

  return {
    async storeOriginal(input: {
      key: string
      bytes: Uint8Array
      contentType: string
      checksumSha256: string
    }) {
      assertMediaObjectNamespace(input.key, 'originals')
      await putObject(input)
    },

    async storeOriginalChunk(input: {
      originalKey: string
      chunkIndex: number
      bytes: Uint8Array
      checksumSha256: string
    }) {
      await putObject({
        key: originalChunkObjectKey(input.originalKey, input.chunkIndex),
        bytes: input.bytes,
        contentType: 'application/octet-stream',
        checksumSha256: input.checksumSha256,
      })
    },

    async inspectOriginal(key: string) {
      assertMediaObjectNamespace(key, 'originals')
      return inspectObject(key)
    },

    async readOriginal(key: string) {
      assertMediaObjectNamespace(key, 'originals')
      return readObject(key)
    },

    readOriginalChunk(originalKey: string, chunkIndex: number) {
      return readObject(originalChunkObjectKey(originalKey, chunkIndex))
    },

    async inspectOriginalChunk(originalKey: string, chunkIndex: number) {
      try {
        return await inspectObject(
          originalChunkObjectKey(originalKey, chunkIndex),
        )
      } catch (error) {
        if (error instanceof MediaStorageError && error.code === 'not_found') {
          return null
        }
        throw error
      }
    },

    async storeRendition(input: {
      key: string
      bytes: Uint8Array
      checksumSha256: string
      contentType: 'image/jpeg'
    }) {
      assertContentAddressedRenditionKey(input.key, input.checksumSha256)
      if (input.contentType !== 'image/jpeg') {
        throw new TypeError('Renditions must use the image/jpeg content type')
      }
      await putObject(input)
      return publicRenditionUrl(input.key)
    },

    async inspectRendition(key: string) {
      assertMediaObjectNamespace(key, 'renditions')
      return inspectObject(key)
    },

    async readRendition(key: string) {
      assertMediaObjectNamespace(key, 'renditions')
      return readObject(key)
    },

    deleteOriginal(key: string) {
      assertMediaObjectNamespace(key, 'originals')
      return deleteObject(key)
    },

    deleteOriginalChunk(originalKey: string, chunkIndex: number) {
      return deleteObject(originalChunkObjectKey(originalKey, chunkIndex))
    },

    deleteRendition(key: string) {
      assertMediaObjectNamespace(key, 'renditions')
      return deleteObject(key)
    },

    async purgeRendition(key: string) {
      assertMediaObjectNamespace(key, 'renditions')
      // Public R2 delivery is handled by the Worker without Cache API writes.
      // Strongly consistent deletion is therefore the complete purge.
    },

    publicRenditionUrl,
  }
}
