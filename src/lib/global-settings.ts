import { getGlobalSettings } from '@/api/holyrics'
import { getActiveServer } from '@/lib/server-registry'
import { getServerGlobalSettingsKey } from '@/lib/server-storage'

export interface HolyricsGlobalSettings {
  initial_slide?: {
    display_mode?: string | null
    [key: string]: unknown
  }
  [key: string]: unknown
}

const cachedGlobalSettingsByServer = new Map<string, HolyricsGlobalSettings | null>()

export function coerceGlobalSettings(value: unknown): HolyricsGlobalSettings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as HolyricsGlobalSettings
}

function resolveServerId(serverId?: string | null) {
  return serverId ?? getActiveServer()?.id ?? null
}

export function setCachedGlobalSettings(
  settings: HolyricsGlobalSettings,
  serverId?: string | null
) {
  const resolvedServerId = resolveServerId(serverId)
  if (!resolvedServerId) return

  cachedGlobalSettingsByServer.set(resolvedServerId, settings)
  saveGlobalSettingsToStorage(settings, resolvedServerId)
}

export function getCachedGlobalSettings(serverId?: string | null) {
  const resolvedServerId = resolveServerId(serverId)
  if (!resolvedServerId) {
    return null
  }

  if (cachedGlobalSettingsByServer.has(resolvedServerId)) {
    return cachedGlobalSettingsByServer.get(resolvedServerId) ?? null
  }

  const persisted = loadGlobalSettingsFromStorage(resolvedServerId)
  cachedGlobalSettingsByServer.set(resolvedServerId, persisted)
  return persisted
}

export function loadGlobalSettingsFromStorage(
  serverId?: string | null
): HolyricsGlobalSettings | null {
  const resolvedServerId = resolveServerId(serverId)
  if (typeof window === 'undefined') {
    return null
  }
  if (!resolvedServerId) {
    return null
  }

  try {
    const raw = window.localStorage.getItem(getServerGlobalSettingsKey(resolvedServerId))
    if (!raw) {
      return null
    }

    return coerceGlobalSettings(JSON.parse(raw))
  } catch {
    return null
  }
}

export function saveGlobalSettingsToStorage(
  settings: HolyricsGlobalSettings,
  serverId?: string | null
) {
  const resolvedServerId = resolveServerId(serverId)
  if (typeof window === 'undefined') {
    return
  }
  if (!resolvedServerId) {
    return
  }

  try {
    window.localStorage.setItem(
      getServerGlobalSettingsKey(resolvedServerId),
      JSON.stringify(settings)
    )
  } catch {
    // ignore localStorage persistence failures
  }
}

export function clearCachedGlobalSettings(serverId?: string | null) {
  const resolvedServerId = resolveServerId(serverId)
  if (!resolvedServerId) return

  cachedGlobalSettingsByServer.delete(resolvedServerId)
}

export async function fetchGlobalSettings(options?: {
  serverId?: string | null
  force?: boolean
}) {
  const resolvedServerId = resolveServerId(options?.serverId)
  if (!resolvedServerId) {
    throw new Error('Nenhum servidor ativo configurado.')
  }

  const cachedSettings = getCachedGlobalSettings(resolvedServerId)
  if (cachedSettings && !options?.force) {
    return cachedSettings
  }

  try {
    const response = await getGlobalSettings()
    const settings = coerceGlobalSettings(response)
    setCachedGlobalSettings(settings, resolvedServerId)
    return settings
  } catch (error) {
    if (cachedSettings) {
      return cachedSettings
    }

    throw error
  }
}

export function getMusicPresentationApiIndex(index: number, settings?: HolyricsGlobalSettings | null) {
  const resolvedSettings = settings ?? getCachedGlobalSettings()
  const displayMode = resolvedSettings?.initial_slide?.display_mode

  if (displayMode === 'remove') {
    return index
  }

  return index + 1
}

export function shouldUseInitialSlide(settings?: HolyricsGlobalSettings | null) {
  const resolvedSettings = settings ?? getCachedGlobalSettings()
  return resolvedSettings?.initial_slide?.display_mode !== 'remove'
}
