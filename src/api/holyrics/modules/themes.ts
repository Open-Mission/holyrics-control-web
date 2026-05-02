import { useMutation, useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import { requestHolyricsAction } from '@/api/holyrics/core/client'
import { holyricsKeys } from '@/api/holyrics/core/query'

const themeSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  background: z.object({
    type: z.string(),
    id: z.union([z.string(), z.number()]),
    opacity: z.number().optional(),
  }).optional(),
  font: z.object({
    name: z.string().nullable().optional(),
    bold: z.boolean().nullable().optional(),
    italic: z.boolean().nullable().optional(),
    size: z.number().nullable().optional(),
    color: z.string().nullable().optional(),
  }).optional(),
}).passthrough()

const backgroundSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  type: z.string().optional(),
  name: z.string().optional(),
  ip_list: z.array(z.string()).optional(),
}).passthrough().nullable()

export type HolyricsTheme = z.infer<typeof themeSchema>

export async function listThemes() {
  return requestHolyricsAction({
    action: 'GetThemes',
    responseSchema: z.array(themeSchema),
  })
}

export async function getCurrentTheme() {
  return requestHolyricsAction({
    action: 'GetCurrentTheme',
    responseSchema: backgroundSchema,
  })
}

export async function getCurrentBackground() {
  return requestHolyricsAction({
    action: 'GetCurrentBackground',
    responseSchema: backgroundSchema,
  })
}

export async function setCurrentTheme(id: string) {
  return requestHolyricsAction({
    action: 'SetCurrentBackground',
    payload: { id },
  })
}

export async function setBibleTheme(id: string) {
  return requestHolyricsAction({
    action: 'SetBibleSettings',
    payload: {
      theme: {
        public: id,
      },
    },
  })
}

export function useThemesQuery() {
  return useQuery({
    queryKey: holyricsKeys.themes(),
    queryFn: listThemes,
  })
}

export function useCurrentThemeQuery() {
  return useQuery({
    queryKey: holyricsKeys.currentTheme(),
    queryFn: getCurrentTheme,
  })
}

export function useCurrentBackgroundQuery() {
  return useQuery({
    queryKey: holyricsKeys.currentBackground(),
    queryFn: getCurrentBackground,
  })
}

export function useSetCurrentThemeMutation() {
  return useMutation({
    mutationKey: [...holyricsKeys.themes(), 'set-current'],
    mutationFn: setCurrentTheme,
  })
}

export function useSetBibleThemeMutation() {
  return useMutation({
    mutationKey: [...holyricsKeys.themes(), 'set-bible'],
    mutationFn: setBibleTheme,
  })
}
