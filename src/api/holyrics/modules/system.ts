import { useMutation, useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import { requestHolyricsAction } from '@/api/holyrics/core/client'
import { holyricsKeys } from '@/api/holyrics/core/query'

const tokenInfoSchema = z.object({
  version: z.string().optional(),
  permissions: z.union([z.string(), z.array(z.string())]).optional(),
}).passthrough()

const apiServerInfoSchema = z.object({
  enabled_local: z.boolean().optional(),
  enabled_web: z.boolean().optional(),
  port: z.number().optional(),
  ip_list: z.array(z.string()).optional(),
}).passthrough()

const globalSettingsSchema = z.record(z.string(), z.unknown())

const connectionStatusSchema = z.object({
  holyrics: z.enum(['connected', 'disconnected']),
})

export type HolyricsTokenInfo = z.infer<typeof tokenInfoSchema>
export type HolyricsApiServerInfo = z.infer<typeof apiServerInfoSchema>
export type HolyricsGlobalSettingsPayload = z.infer<typeof globalSettingsSchema>

export async function getTokenInfo() {
  return requestHolyricsAction({
    action: 'GetTokenInfo',
    responseSchema: tokenInfoSchema,
  })
}

export async function checkPermissions(actions: string) {
  return requestHolyricsAction({
    action: 'CheckPermissions',
    payload: { actions },
  })
}

export async function getApiServerInfo() {
  return requestHolyricsAction({
    action: 'GetAPIServerInfo',
    responseSchema: apiServerInfoSchema,
  })
}

export async function getGlobalSettings(filter?: string) {
  return requestHolyricsAction({
    action: 'GetGlobalSettings',
    payload: filter ? { filter } : {},
    responseSchema: globalSettingsSchema,
  })
}

export async function setGlobalSettings(input: Record<string, unknown>) {
  return requestHolyricsAction({
    action: 'SetGlobalSettings',
    payload: input,
    responseSchema: z.record(z.string(), z.union([z.boolean(), z.string()])),
  })
}

export async function getConnectionStatus() {
  await getApiServerInfo()
  return connectionStatusSchema.parse({
    holyrics: 'connected',
  })
}

export function useTokenInfoQuery() {
  return useQuery({
    queryKey: holyricsKeys.systemTokenInfo(),
    queryFn: getTokenInfo,
  })
}

export function useApiServerInfoQuery(options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: holyricsKeys.systemApiServerInfo(),
    queryFn: getApiServerInfo,
    refetchInterval: options?.refetchInterval,
  })
}

export function useGlobalSettingsQuery() {
  return useQuery({
    queryKey: holyricsKeys.systemGlobalSettings(),
    queryFn: () => getGlobalSettings(),
  })
}

export function useSetGlobalSettingsMutation() {
  return useMutation({
    mutationKey: [...holyricsKeys.systemGlobalSettings(), 'set'],
    mutationFn: (input: Record<string, unknown>) => setGlobalSettings(input),
  })
}

export function useConnectionStatusQuery(options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: holyricsKeys.systemConnectionStatus(),
    queryFn: getConnectionStatus,
    refetchInterval: options?.refetchInterval,
  })
}
