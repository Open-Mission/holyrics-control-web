import { requestHolyricsAction } from '@/api/holyrics/core/client'
import { z } from 'zod'

const playlistItemSchema = z.object({
  id: z.string().optional(),
  type: z.string().optional(),
  name: z.string().optional(),
  song_id: z.string().optional(),
}).passthrough()

const savedPlaylistSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  items: z.array(playlistItemSchema).optional(),
}).passthrough()

export type HolyricsSavedPlaylist = z.infer<typeof savedPlaylistSchema>

export async function listSavedPlaylists() {
  return requestHolyricsAction({
    action: 'GetSavedPlaylists',
    responseSchema: z.array(savedPlaylistSchema),
  })
}

export async function loadSavedPlaylist(name: string, merge = false) {
  return requestHolyricsAction({
    action: 'LoadSavedPlaylist',
    payload: { name, merge },
  })
}
