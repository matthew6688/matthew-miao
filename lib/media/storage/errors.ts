export type MediaStorageErrorCode =
  | 'not_found'
  | 'invalid_response'
  | 'provider_unavailable'

export class MediaStorageError extends Error {
  constructor(readonly code: MediaStorageErrorCode) {
    super(
      code === 'not_found'
        ? 'Media object was not found.'
        : 'Media storage is temporarily unavailable.',
    )
    this.name = 'MediaStorageError'
  }
}
