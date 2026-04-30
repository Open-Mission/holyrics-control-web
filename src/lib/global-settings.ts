import { getApiV1SystemGlobalSettings } from '@/lib/holyrics'

export interface HolyricsGlobalSettings {
  initial_slide?: {
    display_mode?: string | null
    [key: string]: unknown
  }
  [key: string]: unknown
}

let cachedGlobalSettings: HolyricsGlobalSettings | null = null
const GLOBAL_SETTINGS_STORAGE_KEY = 'holyrics:global-settings'

export function coerceGlobalSettings(value: unknown): HolyricsGlobalSettings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as HolyricsGlobalSettings
}

export function setCachedGlobalSettings(settings: HolyricsGlobalSettings) {
  cachedGlobalSettings = settings
  saveGlobalSettingsToStorage(settings)
}

export function getCachedGlobalSettings() {
  if (cachedGlobalSettings) {
    return cachedGlobalSettings
  }

  cachedGlobalSettings = loadGlobalSettingsFromStorage()
  return cachedGlobalSettings
}

export function loadGlobalSettingsFromStorage(): HolyricsGlobalSettings | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(GLOBAL_SETTINGS_STORAGE_KEY)
    if (!raw) {
      return null
    }

    return coerceGlobalSettings(JSON.parse(raw))
  } catch {
    return null
  }
}

export function saveGlobalSettingsToStorage(settings: HolyricsGlobalSettings) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(GLOBAL_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // ignore localStorage persistence failures
  }
}

export async function fetchGlobalSettings() {
  const cachedSettings = getCachedGlobalSettings()

  if (cachedSettings) {
    return cachedSettings
  }

  const response = await getApiV1SystemGlobalSettings()
  const settings = coerceGlobalSettings(response.data)
  setCachedGlobalSettings(settings)
  return settings
}

export function getMusicPresentationApiIndex(index: number, settings?: HolyricsGlobalSettings | null) {
  const resolvedSettings = settings ?? cachedGlobalSettings
  const displayMode = resolvedSettings?.initial_slide?.display_mode

  if (displayMode === 'remove') {
    return index
  }

  return index + 1
}

export function shouldUseInitialSlide(settings?: HolyricsGlobalSettings | null) {
  const resolvedSettings = settings ?? cachedGlobalSettings
  return resolvedSettings?.initial_slide?.display_mode !== 'remove'
}
