import { useMutation, useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import { requestHolyricsAction } from '@/api/holyrics/core/client'
import { holyricsKeys } from '@/api/holyrics/core/query'

export const scheduleItemSchema = z.object({
  id: z.string().optional(),
  song_id: z.string().optional(),
  name: z.string().optional(),
  title: z.string().optional(),
  type: z.string().optional(),
  reference: z.string().optional(),
  references: z.string().optional(),
  version: z.string().optional(),
  show_x_verses: z.number().optional(),
  default_action: z.string().optional(),
  artist: z.string().optional(),
  author: z.string().optional(),
  album: z.string().optional(),
  key: z.string().optional(),
  image: z.string().optional(),
  video: z.string().optional(),
  audio: z.string().optional(),
  path: z.string().optional(),
  active: z.boolean().optional(),
  index: z.number().optional(),
}).passthrough()

export const scheduleSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  type: z.string().optional(),
  datetime: z.string().optional(),
  lyrics_playlist: z.array(scheduleItemSchema).optional(),
  media_playlist: z.array(scheduleItemSchema).optional(),
  responsible: z.unknown().optional(),
  members: z.array(z.unknown()).optional(),
  roles: z.array(z.unknown()).optional(),
  notes: z.string().optional(),
}).passthrough()

export type HolyricsSchedule = z.infer<typeof scheduleSchema>
export type HolyricsScheduleItem = z.infer<typeof scheduleItemSchema>

export async function getCurrentSchedule() {
  return requestHolyricsAction({
    action: 'GetCurrentSchedule',
    responseSchema: z.union([z.array(scheduleSchema), scheduleSchema]),
  })
}

export async function getSchedules(input: { month: number; year: number }) {
  return requestHolyricsAction({
    action: 'GetSchedules',
    payload: input,
    responseSchema: z.array(scheduleSchema),
  })
}

export async function setCurrentSchedule(eventId: string) {
  return requestHolyricsAction({
    action: 'SetCurrentSchedule',
    payload: { event_id: eventId },
  })
}

export async function showScheduleItem(input: {
  id?: string
  type?: string
  song_id?: string
  index?: number
  name?: string
}) {
  switch (input.type) {
    case 'text':
      if (!input.id) throw new Error('Item de texto sem id.')
      return requestHolyricsAction({
        action: 'ShowText',
        payload: { id: input.id },
      })
    case 'announcement':
      if (!input.id) throw new Error('Aviso sem id.')
      return requestHolyricsAction({
        action: 'ShowAnnouncement',
        payload: { id: input.id },
      })
    case 'quick_presentation':
      if (!input.name) throw new Error('Apresentação rápida sem conteúdo identificável.')
      return requestHolyricsAction({
        action: 'ShowQuickPresentation',
        payload: { text: input.name },
      })
    default:
      throw new Error(`Tipo de item não suportado diretamente: ${input.type ?? 'desconhecido'}`)
  }
}

export async function playVideo(id: string) {
  return requestHolyricsAction({
    action: 'PlayVideo',
    payload: { file: id },
  })
}

export async function playAudio(id: string) {
  return requestHolyricsAction({
    action: 'PlayAudio',
    payload: { file: id },
  })
}

export async function showImage(id: string) {
  return requestHolyricsAction({
    action: 'ShowImage',
    payload: { file: id },
  })
}

export function useCurrentScheduleQuery() {
  return useQuery({
    queryKey: holyricsKeys.currentSchedule(),
    queryFn: getCurrentSchedule,
  })
}

export function useSchedulesQuery(input: { month: number; year: number }) {
  return useQuery({
    queryKey: holyricsKeys.schedules(input),
    queryFn: () => getSchedules(input),
  })
}

export function useSetCurrentScheduleMutation() {
  return useMutation({
    mutationKey: [...holyricsKeys.currentSchedule(), 'set'],
    mutationFn: setCurrentSchedule,
  })
}

export function useShowScheduleItemMutation() {
  return useMutation({
    mutationKey: [...holyricsKeys.currentSchedule(), 'show-item'],
    mutationFn: showScheduleItem,
  })
}

export function usePlayVideoMutation() {
  return useMutation({
    mutationKey: [...holyricsKeys.currentSchedule(), 'play-video'],
    mutationFn: playVideo,
  })
}

export function usePlayAudioMutation() {
  return useMutation({
    mutationKey: [...holyricsKeys.currentSchedule(), 'play-audio'],
    mutationFn: playAudio,
  })
}

export function useShowImageMutation() {
  return useMutation({
    mutationKey: [...holyricsKeys.currentSchedule(), 'show-image'],
    mutationFn: showImage,
  })
}
