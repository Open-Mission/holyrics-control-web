import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import { requestHolyricsAction } from '@/api/holyrics/core/client'
import { holyricsKeys } from '@/api/holyrics/core/query'

const lyricSlideSchema = z.object({
  text: z.string().default(''),
  styled_text: z.string().optional(),
  slide_description: z.string().optional(),
  background_id: z.string().nullable().optional(),
  translations: z.record(z.string(), z.string()).nullable().optional(),
}).passthrough()

export const songSchema = z.object({
  id: z.string(),
  title: z.string().default(''),
  artist: z.string().optional(),
  author: z.string().optional(),
  note: z.string().optional(),
  copyright: z.string().optional(),
  key: z.string().optional(),
  bpm: z.number().optional(),
  time_sig: z.string().optional(),
  group: z.string().optional(),
  groups: z.array(z.object({ name: z.string().optional() }).passthrough()).optional(),
  slides: z.array(lyricSlideSchema).optional(),
  archived: z.boolean().optional(),
}).passthrough()

const songsSchema = z.array(songSchema)

export type HolyricsSong = z.infer<typeof songSchema>

export async function listSongs(fields?: string) {
  return requestHolyricsAction({
    action: 'GetSongs',
    payload: fields ? { fields } : {},
    responseSchema: songsSchema,
  })
}

export async function getSong(id: string, fields?: string) {
  return requestHolyricsAction({
    action: 'GetSong',
    payload: fields ? { id, fields } : { id },
    responseSchema: songSchema.nullable(),
  })
}

export async function showSong(input: { id: string; initialIndex?: number }) {
  const payload = input.initialIndex == null
    ? { id: input.id }
    : { id: input.id, initialIndex: input.initialIndex }

  return requestHolyricsAction({
    action: 'ShowSong',
    payload,
  })
}

export function useSongQuery(id: string, fields?: string) {
  return useQuery({
    queryKey: holyricsKeys.song(id),
    queryFn: () => getSong(id, fields),
    enabled: Boolean(id),
  })
}
