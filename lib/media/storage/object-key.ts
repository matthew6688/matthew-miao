export function assertMediaObjectKey(key: string) {
  if (
    !key ||
    key.startsWith('/') ||
    key.includes('\\') ||
    key.split('/').some((segment) => !segment || segment === '.' || segment === '..') ||
    /[\u0000-\u001f?#]/.test(key)
  ) {
    throw new TypeError('Invalid Media object key')
  }
}

export function assertMediaObjectNamespace(
  key: string,
  namespace: 'originals' | 'renditions',
) {
  assertMediaObjectKey(key)
  if (!key.startsWith(`${namespace}/`)) {
    throw new TypeError(`Media object key must use the ${namespace}/ namespace`)
  }
}

export function originalChunkObjectKey(originalKey: string, chunkIndex: number) {
  assertMediaObjectNamespace(originalKey, 'originals')
  if (!Number.isSafeInteger(chunkIndex) || chunkIndex < 0) {
    throw new TypeError('Invalid Original transfer chunk index')
  }
  return `transfer-chunks/${originalKey}/${chunkIndex}.part`
}

export function checksumBytes(checksumSha256: string) {
  if (!/^[a-f0-9]{64}$/.test(checksumSha256)) {
    throw new TypeError('Invalid SHA-256 checksum')
  }
  return Buffer.from(checksumSha256, 'hex')
}

export function assertContentAddressedRenditionKey(
  key: string,
  checksumSha256: string,
) {
  assertMediaObjectNamespace(key, 'renditions')
  checksumBytes(checksumSha256)
  if (!key.toLowerCase().endsWith('.jpg')) {
    throw new TypeError('Renditions must use a JPEG object key')
  }
  if (!key.includes(checksumSha256)) {
    throw new TypeError('Rendition key must contain its SHA-256 checksum')
  }
}

export function createPublicMediaUrl(publicBaseUrl: URL) {
  return function publicRenditionUrl(key: string) {
    assertMediaObjectNamespace(key, 'renditions')
    const encodedKey = key.split('/').map(encodeURIComponent).join('/')
    return new URL(encodedKey, publicBaseUrl).toString()
  }
}
