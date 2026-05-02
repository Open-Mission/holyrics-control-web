import {
  ACTIVE_SERVER_ID_KEY,
  LEGACY_GLOBAL_SETTINGS_KEY,
  LEGACY_HOLYRICS_URL_KEY,
  LEGACY_SERVER_URL_KEY,
  LEGACY_SETUP_KEY,
  SERVER_REGISTRY_KEY,
  getServerGlobalSettingsKey,
  getServerSetupKey,
  normalizeServerUrl,
} from '@/lib/server-storage'

export interface ServerRecord {
  id: string
  name: string
  url: string
  previewUrl?: string | null
  createdAt: string
  updatedAt: string
  lastConnectedAt?: string | null
}

export interface ServerRegistry {
  servers: ServerRecord[]
  activeServerId: string | null
}

export interface ServerInput {
  name: string
  url: string
  previewUrl?: string | null
}

function readRegistryRecords(): ServerRecord[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(SERVER_REGISTRY_KEY)
    if (!raw) return []

    const records = JSON.parse(raw) as ServerRecord[]
    if (!Array.isArray(records)) return []

    return records.map((record) => ({
      ...record,
      url: normalizeServerUrl(
        (record as ServerRecord & { holyricsUrl?: string; serverUrl?: string }).url ??
          (record as ServerRecord & { holyricsUrl?: string; serverUrl?: string }).holyricsUrl ??
          (record as ServerRecord & { holyricsUrl?: string; serverUrl?: string }).serverUrl ??
          ''
      ),
      previewUrl:
        typeof record.previewUrl === 'string' && record.previewUrl.trim().length > 0
          ? normalizeServerUrl(record.previewUrl)
          : null,
    }))
  } catch {
    return []
  }
}

export function createServerRecord(input: ServerInput): ServerRecord {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    url: normalizeServerUrl(input.url),
    previewUrl:
      typeof input.previewUrl === 'string' && input.previewUrl.trim().length > 0
        ? normalizeServerUrl(input.previewUrl)
        : null,
    createdAt: now,
    updatedAt: now,
    lastConnectedAt: null,
  }
}

export function loadServerRegistry(): ServerRegistry {
  if (typeof window === 'undefined') {
    return { servers: [], activeServerId: null }
  }

  const servers = readRegistryRecords()
  const activeServerId = window.localStorage.getItem(ACTIVE_SERVER_ID_KEY)
  const resolvedActiveServerId =
    activeServerId && servers.some((server) => server.id === activeServerId)
      ? activeServerId
      : servers[0]?.id ?? null

  return {
    servers,
    activeServerId: resolvedActiveServerId,
  }
}

export function saveServerRegistry(registry: ServerRegistry) {
  if (typeof window === 'undefined') {
    return registry
  }

  window.localStorage.setItem(
    SERVER_REGISTRY_KEY,
    JSON.stringify(registry.servers)
  )

  if (registry.activeServerId) {
    window.localStorage.setItem(ACTIVE_SERVER_ID_KEY, registry.activeServerId)
  } else {
    window.localStorage.removeItem(ACTIVE_SERVER_ID_KEY)
  }

  return registry
}

export function getServerById(serverId: string | null | undefined) {
  if (!serverId) return null
  return loadServerRegistry().servers.find((server) => server.id === serverId) ?? null
}

export function getActiveServer() {
  const registry = loadServerRegistry()
  return (
    registry.servers.find((server) => server.id === registry.activeServerId) ??
    null
  )
}

export function setActiveServerId(serverId: string | null) {
  const registry = loadServerRegistry()
  const nextActiveServerId =
    serverId && registry.servers.some((server) => server.id === serverId)
      ? serverId
      : registry.servers[0]?.id ?? null

  return saveServerRegistry({
    servers: registry.servers,
    activeServerId: nextActiveServerId,
  })
}

export function upsertServerRecord(record: ServerRecord) {
  const registry = loadServerRegistry()
  const existingIndex = registry.servers.findIndex((item) => item.id === record.id)
  const nextServers = [...registry.servers]

  if (existingIndex >= 0) {
    nextServers[existingIndex] = {
      ...nextServers[existingIndex],
      ...record,
      updatedAt: new Date().toISOString(),
    }
  } else {
    nextServers.push(record)
  }

  return saveServerRegistry({
    servers: nextServers,
    activeServerId: registry.activeServerId ?? record.id,
  })
}

export function removeServerRecord(serverId: string) {
  const registry = loadServerRegistry()
  const nextServers = registry.servers.filter((server) => server.id !== serverId)
  const nextActiveServerId =
    registry.activeServerId === serverId
      ? nextServers[0]?.id ?? null
      : registry.activeServerId

  return saveServerRegistry({
    servers: nextServers,
    activeServerId: nextActiveServerId,
  })
}

export function migrateLegacyServerConfig() {
  if (typeof window === 'undefined') {
    return null
  }

  const existing = loadServerRegistry()
  if (existing.servers.length > 0) {
    return existing
  }

  const legacyServerUrl = window.localStorage.getItem(LEGACY_SERVER_URL_KEY)
  if (!legacyServerUrl) {
    return null
  }

  const legacyHolyricsUrl =
    window.localStorage.getItem(LEGACY_HOLYRICS_URL_KEY) ?? legacyServerUrl
  const migratedServer = createServerRecord({
    name: 'Servidor atual',
    url: legacyHolyricsUrl,
  })

  saveServerRegistry({
    servers: [migratedServer],
    activeServerId: migratedServer.id,
  })

  const legacySetup = window.localStorage.getItem(LEGACY_SETUP_KEY)
  if (legacySetup) {
    window.localStorage.setItem(getServerSetupKey(migratedServer.id), legacySetup)
  }

  const legacyGlobalSettings = window.localStorage.getItem(LEGACY_GLOBAL_SETTINGS_KEY)
  if (legacyGlobalSettings) {
    window.localStorage.setItem(
      getServerGlobalSettingsKey(migratedServer.id),
      legacyGlobalSettings
    )
  }

  return loadServerRegistry()
}

export function clearLegacyServerConfig() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(LEGACY_SERVER_URL_KEY)
  window.localStorage.removeItem(LEGACY_HOLYRICS_URL_KEY)
  window.localStorage.removeItem(LEGACY_SETUP_KEY)
  window.localStorage.removeItem(LEGACY_GLOBAL_SETTINGS_KEY)
}
