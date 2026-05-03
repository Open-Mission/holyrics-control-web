import { getCurrentActiveServer } from '@/hooks/use-server-store'

function serverIdOrFallback() {
  return getCurrentActiveServer()?.id ?? 'no-server'
}

export const holyricsKeys = {
  all: () => ['holyrics', serverIdOrFallback()] as const,
  auth: () => [...holyricsKeys.all(), 'auth'] as const,
  bible: (params?: unknown) => [...holyricsKeys.all(), 'bible', params ?? null] as const,
  bibleVersions: () => [...holyricsKeys.all(), 'bible', 'versions'] as const,
  bibleSettings: () => [...holyricsKeys.all(), 'bible', 'settings'] as const,
  system: () => [...holyricsKeys.all(), 'system'] as const,
  systemTokenInfo: () => [...holyricsKeys.system(), 'token-info'] as const,
  systemGlobalSettings: () => [...holyricsKeys.system(), 'global-settings'] as const,
  systemApiServerInfo: () => [...holyricsKeys.system(), 'api-server-info'] as const,
  systemConnectionStatus: () => [...holyricsKeys.system(), 'connection-status'] as const,
  songs: (params?: unknown) => [...holyricsKeys.all(), 'songs', params ?? null] as const,
  song: (id: string) => [...holyricsKeys.all(), 'songs', id] as const,
  presentation: (params?: unknown) => [...holyricsKeys.all(), 'presentation', params ?? null] as const,
  themes: () => [...holyricsKeys.all(), 'themes'] as const,
  currentTheme: () => [...holyricsKeys.all(), 'themes', 'current'] as const,
  currentBackground: () => [...holyricsKeys.all(), 'backgrounds', 'current'] as const,
  playlists: () => [...holyricsKeys.all(), 'playlists'] as const,
  media: (mediaType?: string, params?: unknown) =>
    [...holyricsKeys.all(), 'media', mediaType ?? 'all', params ?? null] as const,
  currentSchedule: () => [...holyricsKeys.all(), 'services', 'current-schedule'] as const,
  schedules: (params?: unknown) => [...holyricsKeys.all(), 'services', 'schedules', params ?? null] as const,
}
