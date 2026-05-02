import { useMutation, useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import { requestHolyricsAction } from '@/api/holyrics/core/client'
import { holyricsKeys } from '@/api/holyrics/core/query'

const presentationSlideSchema = z.object({
  text: z.string().optional(),
  styled_text: z.string().optional(),
  slide_description: z.string().optional(),
  image: z.string().optional(),
}).passthrough()

const currentPresentationSchema = z.object({
  id: z.string().optional(),
  type: z.string().optional(),
  name: z.string().optional(),
  slide_number: z.number().optional(),
  total_slides: z.number().optional(),
  slide_type: z.string().optional(),
  slides: z.array(presentationSlideSchema).optional(),
}).passthrough().nullable()

export type HolyricsCurrentPresentation = z.infer<typeof currentPresentationSchema>

export async function getCurrentPresentation() {
  return requestHolyricsAction({
    action: 'GetCurrentPresentation',
    payload: { include_slides: true },
    responseSchema: currentPresentationSchema,
  })
}

export async function goToPresentationIndex(index: number) {
  return requestHolyricsAction({
    action: 'ActionGoToIndex',
    payload: { index },
  })
}

export async function closeCurrentPresentation() {
  return requestHolyricsAction({
    action: 'CloseCurrentPresentation',
  })
}

export async function toggleF8() {
  return requestHolyricsAction({
    action: 'ToggleF8',
  })
}

export async function toggleF9() {
  return requestHolyricsAction({
    action: 'ToggleF9',
  })
}

export async function toggleF10() {
  return requestHolyricsAction({
    action: 'ToggleF10',
  })
}

export function useCurrentPresentationQuery(options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: holyricsKeys.presentation({ includeSlides: true }),
    queryFn: getCurrentPresentation,
    refetchInterval: options?.refetchInterval,
  })
}

export function useGoToPresentationIndexMutation() {
  return useMutation({
    mutationKey: [...holyricsKeys.presentation(), 'goto-index'],
    mutationFn: goToPresentationIndex,
  })
}
