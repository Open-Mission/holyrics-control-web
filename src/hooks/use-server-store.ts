import { useSyncExternalStore, useCallback } from 'react'

import { clearServerOfflineData } from '@/lib/db-server'
import { emitServerContextChange } from '@/lib/server-context-events'
import {
  clearLegacyServerConfig,
  createServerRecord,
  getActiveServer,
  loadServerRegistry,
  migrateLegacyServerConfig,
  removeServerRecord,
  saveServerRegistry,
  setActiveServerId,
  type ServerInput,
  type ServerRecord,
} from '@/lib/server-registry'
import {
  getServerAuthKey,
  getServerGlobalSettingsKey,
  getServerSetupKey,
} from '@/lib/server-storage'

interface ServerStoreState {
  servers: ServerRecord[]
  activeServerId: string | null
}

let _bootstrapped = false
let _state: ServerStoreState = {
  servers: [],
  activeServerId: null,
}

const _listeners = new Set<() => void>()

function notify() {
  _listeners.forEach((listener) => listener())
}

function setState(next: ServerStoreState) {
  _state = next
  notify()
}

function subscribe(listener: () => void) {
  _listeners.add(listener)
  return () => _listeners.delete(listener)
}

function getSnapshot() {
  return _state
}

function loadInitialState() {
  migrateLegacyServerConfig()
  clearLegacyServerConfig()
  return loadServerRegistry()
}

function bootstrap() {
  if (_bootstrapped || typeof window === 'undefined') {
    return
  }

  _bootstrapped = true
  _state = loadInitialState()
  emitServerContextChange({
    serverId: _state.activeServerId,
    previousServerId: null,
    reason: 'bootstrap',
  })
}

bootstrap()

export function getCurrentServerStoreState() {
  bootstrap()
  return _state
}

export function getCurrentActiveServer() {
  bootstrap()
  return getActiveServer()
}

async function removeServerLocalState(serverId: string) {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(getServerAuthKey(serverId))
    window.localStorage.removeItem(getServerSetupKey(serverId))
    window.localStorage.removeItem(getServerGlobalSettingsKey(serverId))
  }

  await clearServerOfflineData(serverId)
}

export function useServerStore() {
  bootstrap()
  const state = useSyncExternalStore(subscribe, getSnapshot)
  const activeServer =
    state.servers.find((server) => server.id === state.activeServerId) ?? null

  const refresh = useCallback(() => {
    setState(loadServerRegistry())
  }, [])

  const createServer = useCallback((input: ServerInput) => {
    const previousServerId = _state.activeServerId
    const record = createServerRecord(input)
    const registry = saveServerRegistry({
      servers: [..._state.servers, record],
      activeServerId: _state.activeServerId ?? record.id,
    })

    setState(registry)
    emitServerContextChange({
      serverId: registry.activeServerId,
      previousServerId,
      reason: 'create',
    })

    return record
  }, [])

  const updateServer = useCallback((serverId: string, input: ServerInput) => {
    const nextServers = _state.servers.map((server) =>
      server.id === serverId
        ? {
            ...server,
            name: input.name.trim(),
            url: input.url.trim().replace(/\/+$/, ''),
            previewUrl:
              typeof input.previewUrl === 'string' && input.previewUrl.trim().length > 0
                ? input.previewUrl.trim().replace(/\/+$/, '')
                : null,
            updatedAt: new Date().toISOString(),
          }
        : server
    )

    const registry = saveServerRegistry({
      servers: nextServers,
      activeServerId: _state.activeServerId,
    })

    setState(registry)
    emitServerContextChange({
      serverId: registry.activeServerId,
      previousServerId: _state.activeServerId,
      reason: 'update',
    })
  }, [])

  const switchServer = useCallback((serverId: string) => {
    const previousServerId = _state.activeServerId
    const registry = setActiveServerId(serverId)
    setState(registry)
    emitServerContextChange({
      serverId: registry.activeServerId,
      previousServerId,
      reason: 'switch',
    })
  }, [])

  const removeServer = useCallback(async (serverId: string) => {
    const previousServerId = _state.activeServerId
    const registry = removeServerRecord(serverId)
    await removeServerLocalState(serverId)

    setState(registry)
    emitServerContextChange({
      serverId: registry.activeServerId,
      previousServerId,
      reason: 'remove',
    })

    return registry
  }, [])

  return {
    ...state,
    activeServer,
    hasServers: state.servers.length > 0,
    needsOnboarding: state.servers.length === 0 || !activeServer,
    refresh,
    createServer,
    updateServer,
    switchServer,
    removeServer,
  }
}
