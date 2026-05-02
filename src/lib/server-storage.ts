export const SERVER_REGISTRY_KEY = 'holyrics:servers'
export const ACTIVE_SERVER_ID_KEY = 'holyrics:active-server-id'

export const LEGACY_SERVER_URL_KEY = 'HOLYRICS_SERVER_URL'
export const LEGACY_HOLYRICS_URL_KEY = 'HOLYRICS_URL'
export const LEGACY_SETUP_KEY = 'holyrics:setup'
export const LEGACY_GLOBAL_SETTINGS_KEY = 'holyrics:global-settings'

export function normalizeServerUrl(url: string) {
  return url.trim().replace(/\/+$/, '')
}

export function getServerStoragePrefix(serverId: string) {
  return `holyrics:server:${serverId}`
}

export function getServerAuthKey(serverId: string) {
  return `${getServerStoragePrefix(serverId)}:auth`
}

export interface ServerAuthState {
  token: string
  sid?: string
  nonce?: string
  rid?: number
  authenticatedAt?: string
}

export function loadServerAuthState(serverId: string): ServerAuthState | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(getServerAuthKey(serverId))
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<ServerAuthState>
    return {
      token: typeof parsed.token === 'string' ? parsed.token : '',
      sid: typeof parsed.sid === 'string' ? parsed.sid : undefined,
      nonce: typeof parsed.nonce === 'string' ? parsed.nonce : undefined,
      rid: typeof parsed.rid === 'number' ? parsed.rid : undefined,
      authenticatedAt:
        typeof parsed.authenticatedAt === 'string'
          ? parsed.authenticatedAt
          : undefined,
    }
  } catch {
    return null
  }
}

export function saveServerAuthState(serverId: string, state: ServerAuthState) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(getServerAuthKey(serverId), JSON.stringify(state))
}

export function clearServerAuthState(serverId: string) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(getServerAuthKey(serverId))
}

export function getServerGlobalSettingsKey(serverId: string) {
  return `${getServerStoragePrefix(serverId)}:global-settings`
}

export function getServerSetupKey(serverId: string) {
  return `${getServerStoragePrefix(serverId)}:setup`
}

export function getServerSongsKey(serverId: string) {
  return `${getServerStoragePrefix(serverId)}:songs`
}

export function getServerThemesKey(serverId: string) {
  return `${getServerStoragePrefix(serverId)}:themes`
}

export function getServerPlaylistsKey(serverId: string) {
  return `${getServerStoragePrefix(serverId)}:playlists`
}

export function isValidHttpUrl(value: string) {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}
