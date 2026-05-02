export type HolyricsMediaType = 'image' | 'video' | 'audio'

export interface HolyricsMediaAutomatic {
  seconds?: number
  repeat?: boolean
}

export function normalizeMediaPath(path?: string | null) {
  if (!path) return ''

  return path
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\/{2,}/g, '/')
}

export function joinMediaPath(
  parentPath: string | null | undefined,
  name: string
) {
  const normalizedParent = normalizeMediaPath(parentPath)
  const normalizedName = normalizeMediaPath(name)

  if (!normalizedParent) return normalizedName
  if (!normalizedName) return normalizedParent

  return `${normalizedParent}/${normalizedName}`
}

export function getMediaBaseName(path: string) {
  const normalized = normalizeMediaPath(path)
  if (!normalized) return ''

  const segments = normalized.split('/')
  return segments[segments.length - 1] ?? ''
}

export function getMediaParentPath(path: string) {
  const normalized = normalizeMediaPath(path)
  if (!normalized || !normalized.includes('/')) return ''

  return normalized.split('/').slice(0, -1).join('/')
}

export function splitMediaPath(path: string) {
  const normalized = normalizeMediaPath(path)
  return normalized ? normalized.split('/') : []
}

export function getMediaListAction(mediaType: HolyricsMediaType) {
  switch (mediaType) {
    case 'audio':
      return 'GetAudios'
    case 'video':
      return 'GetVideos'
    case 'image':
      return 'GetImages'
  }
}

export function getMediaItemAction(mediaType: HolyricsMediaType) {
  switch (mediaType) {
    case 'audio':
      return 'GetAudio'
    case 'video':
      return 'GetVideo'
    case 'image':
      return 'GetImage'
  }
}

export function getMediaPresentAction(mediaType: HolyricsMediaType) {
  switch (mediaType) {
    case 'audio':
      return 'PlayAudio'
    case 'video':
      return 'PlayVideo'
    case 'image':
      return 'ShowImage'
  }
}
