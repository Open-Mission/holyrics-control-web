import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'

import { requestHolyricsAction } from '@/api/holyrics/core/client'
import { holyricsKeys } from '@/api/holyrics/core/query'
import {
  type HolyricsMediaAutomatic,
  type HolyricsMediaType,
  getMediaItemAction,
  getMediaListAction,
  getMediaPresentAction,
  getMediaParentPath,
  joinMediaPath,
  normalizeMediaPath,
} from '@/lib/media'

const mediaPropertiesSchema = z.record(z.string(), z.unknown()).optional()
const nullableNumberSchema = z
  .union([z.number(), z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value === null || value === undefined || value === '') return undefined
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  })

const nullableStringSchema = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => (value === null || value === undefined ? undefined : value))

const nullableBooleanSchema = z
  .union([z.boolean(), z.null()])
  .optional()
  .transform((value) => (value === null || value === undefined ? undefined : value))

export const holyricsMediaItemSchema = z
  .object({
    name: z.string(),
    isDir: z.boolean(),
    properties: mediaPropertiesSchema,
    length: nullableNumberSchema,
    modified_time: nullableStringSchema,
    modified_time_millis: nullableNumberSchema,
    duration_ms: nullableNumberSchema,
    width: nullableNumberSchema,
    height: nullableNumberSchema,
    position: nullableStringSchema,
    blur: nullableBooleanSchema,
    transparent: nullableBooleanSchema,
    last_executed_time: nullableStringSchema,
    last_executed_time_millis: nullableNumberSchema,
    thumbnail: z.string().optional(),
    extension: z.string().optional(),
    file_name: z.string().optional(),
    file_fullname: z.string().optional(),
    file_relative_path: z.string().optional(),
    file_path: z.string().optional(),
    is_dir: z.boolean().optional(),
  })
  .passthrough()

export type HolyricsMediaItemPayload = z.infer<typeof holyricsMediaItemSchema>

export interface ListMediaInput {
  mediaType: HolyricsMediaType
  folder?: string
  filter?: string
  includeMetadata?: boolean
  includeThumbnail?: boolean
}

export interface GetMediaItemInput {
  mediaType: HolyricsMediaType
  name: string
  includeMetadata?: boolean
  includeThumbnail?: boolean
}

export function mapHolyricsMediaItem(
  mediaType: HolyricsMediaType,
  item: HolyricsMediaItemPayload,
  parentPath?: string
) {
  const candidatePath =
    item.file_fullname ??
    item.file_relative_path?.replace(/^[^/\\]+[\\/]/, '') ??
    joinMediaPath(parentPath, item.name)

  const path = normalizeMediaPath(candidatePath)

  return {
    mediaType,
    path,
    parentPath: normalizeMediaPath(parentPath ?? getMediaParentPath(path)),
    name: item.file_name ?? item.name,
    isDir: item.isDir ?? item.is_dir ?? false,
    extension: item.extension,
    properties: item.properties ?? {},
    length: item.length,
    modified_time: item.modified_time,
    modified_time_millis: item.modified_time_millis,
    duration_ms: item.duration_ms,
    width: item.width,
    height: item.height,
    position: item.position,
    blur: item.blur,
    transparent: item.transparent,
    last_executed_time: item.last_executed_time,
    last_executed_time_millis: item.last_executed_time_millis,
    thumbnail: item.thumbnail,
    hasScannedChildren: item.isDir ?? item.is_dir ? false : true,
    discoveredAt: new Date().toISOString(),
  }
}

export async function listMedia(input: ListMediaInput) {
  return requestHolyricsAction({
    action: getMediaListAction(input.mediaType),
    payload: {
      folder: normalizeMediaPath(input.folder),
      filter: input.filter,
      include_metadata: input.includeMetadata ?? true,
      include_thumbnail: input.includeThumbnail ?? false,
    },
    responseSchema: z.array(holyricsMediaItemSchema),
  })
}

export async function getMediaItem(input: GetMediaItemInput) {
  return requestHolyricsAction({
    action: getMediaItemAction(input.mediaType),
    payload: {
      name: normalizeMediaPath(input.name),
      include_metadata: input.includeMetadata ?? true,
      include_thumbnail: input.includeThumbnail ?? false,
    },
    responseSchema: holyricsMediaItemSchema,
  })
}

export async function presentMediaPath(input: {
  mediaType: HolyricsMediaType
  path: string
  automatic?: HolyricsMediaAutomatic
}) {
  const payload =
    input.mediaType === 'image'
      ? {
          file: normalizeMediaPath(input.path),
          automatic: input.automatic,
        }
      : {
          file: normalizeMediaPath(input.path),
        }

  return requestHolyricsAction({
    action: getMediaPresentAction(input.mediaType),
    payload,
  })
}

export async function addMediaPathToPlaylist(input: {
  mediaType: HolyricsMediaType
  path: string
  index?: number
  ignoreDuplicates?: boolean
  eventId?: string
}) {
  return requestHolyricsAction({
    action: 'AddToPlaylist',
    payload: {
      items: [
        {
          type: input.mediaType,
          name: normalizeMediaPath(input.path),
        },
      ],
      index: input.index ?? -1,
      ignore_duplicates: input.ignoreDuplicates ?? false,
      event_id: input.eventId ?? null,
    },
  })
}

export async function getMediaPlaylist() {
  return requestHolyricsAction({
    action: 'GetMediaPlaylist',
    responseSchema: z.array(
      z
        .object({
          id: z.string().optional(),
          type: z.string().optional(),
          name: z.string().optional(),
        })
        .passthrough()
    ),
  })
}

export function usePresentMediaPathMutation(mediaType: HolyricsMediaType) {
  return useMutation({
    mutationKey: [...holyricsKeys.media(mediaType), 'present'],
    mutationFn: (path: string) => presentMediaPath({ mediaType, path }),
  })
}

export function useAddMediaPathToPlaylistMutation(mediaType: HolyricsMediaType) {
  return useMutation({
    mutationKey: [...holyricsKeys.media(mediaType), 'add-to-playlist'],
    mutationFn: (path: string) => addMediaPathToPlaylist({ mediaType, path }),
  })
}
