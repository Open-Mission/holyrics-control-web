import { useSyncExternalStore, useCallback, useEffect } from 'react'
import {
  deleteServerMeta,
  readServerMeta,
  readServerPlaylists,
  writeServerMeta,
  writeServerPlaylists,
} from '@/lib/db-server'
import { listSavedPlaylists } from '@/api/holyrics'
import { getCurrentActiveServer } from '@/hooks/use-server-store'
import { subscribeToServerContextChange } from '@/lib/server-context-events'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Playlist {
  name: string
}

export interface PlaylistsStoreState {
  playlists: Playlist[]
  totalCount: number
  lastSyncedAt: string | null
  isSyncing: boolean
  isLoading: boolean
  syncError: string | null
}

// ─── Store state ──────────────────────────────────────────────────────────────

let _state: PlaylistsStoreState = {
  playlists: [],
  totalCount: 0,
  lastSyncedAt: null,
  isSyncing: false,
  isLoading: true,
  syncError: null,
}

const _listeners = new Set<() => void>()

function setState(next: Partial<PlaylistsStoreState>) {
  _state = { ..._state, ...next }
  _listeners.forEach((l) => l())
}

function getSnapshot(): PlaylistsStoreState {
  return _state
}

function subscribe(listener: () => void): () => void {
  _listeners.add(listener)
  return () => _listeners.delete(listener)
}

// ─── Initial load ─────────────────────────────────────────────────────────────

let _initialLoadDone = false
let _loadStartedAt = 0

export async function forceLoad() {
  _initialLoadDone = false
  _state = { ..._state, isLoading: true }
  await initialLoad()
}

async function initialLoad() {
  if (_initialLoadDone) return
  _initialLoadDone = true
  _loadStartedAt = Date.now()
  const serverId = getCurrentActiveServer()?.id

  try {
    if (!serverId) {
      setState({
        playlists: [],
        totalCount: 0,
        lastSyncedAt: null,
        isLoading: false,
      })
      return
    }

    const [playlists, metaRecord] = await Promise.all([
      readServerPlaylists(serverId),
      readServerMeta(serverId, 'playlists:lastSyncedAt'),
    ])
    setState({
      playlists,
      totalCount: playlists.length,
      lastSyncedAt: metaRecord?.value ?? null,
      isLoading: false,
    })
  } catch (err) {
    console.error('[PlaylistsStore] Failed to load from IndexedDB:', err)
    setState({ isLoading: false })
  }
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function syncPlaylists(): Promise<Playlist[]> {
  const serverId = getCurrentActiveServer()?.id
  if (!serverId) {
    throw new Error('Nenhum servidor ativo configurado.')
  }

  setState({ isSyncing: true, syncError: null })
  try {
    const response = await listSavedPlaylists()
    const rawData: unknown = response

    let playlists: Playlist[] = []
    if (Array.isArray(rawData)) {
      playlists = rawData.map(item => {
        if (typeof item === 'string') return { name: item }
        if (typeof item === 'object' && item !== null && 'name' in item) {
          return { name: String(item.name) }
        }
        return { name: String(item) }
      })
    }

    const lastSyncedAt = new Date().toISOString()
    await writeServerPlaylists(serverId, playlists)
    await writeServerMeta(serverId, 'playlists:lastSyncedAt', lastSyncedAt)

    setState({ 
      playlists, 
      totalCount: playlists.length, 
      lastSyncedAt, 
      isSyncing: false, 
      isLoading: false 
    })
    return playlists
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao sincronizar playlists'
    setState({ isSyncing: false, syncError: message })
    throw error
  }
}

export async function clearPlaylists(): Promise<void> {
  const serverId = getCurrentActiveServer()?.id
  if (!serverId) {
    setState({ playlists: [], totalCount: 0, lastSyncedAt: null, isLoading: false, syncError: null })
    return
  }

  await writeServerPlaylists(serverId, [])
  await deleteServerMeta(serverId, 'playlists:lastSyncedAt')
  setState({ playlists: [], totalCount: 0, lastSyncedAt: null, isLoading: false, syncError: null })
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePlaylistsStore() {
  const state = useSyncExternalStore(subscribe, getSnapshot)

  useEffect(() => {
    initialLoad()
  }, [])

  useEffect(() => {
    if (!state.isLoading) return
    const elapsed = Date.now() - _loadStartedAt
    const delay = Math.max(0, 1500 - elapsed)
    const t = setTimeout(() => {
      if (_state.isLoading) {
        console.warn('[PlaylistsStore] Load appears stuck — retrying...')
        forceLoad()
      }
    }, delay)
    return () => clearTimeout(t)
  }, [state.isLoading])

  useEffect(() => {
    return subscribeToServerContextChange(() => {
      forceLoad()
    })
  }, [])

  return {
    ...state,
    hasPlaylists: state.totalCount > 0,
    syncPlaylists: useCallback(() => syncPlaylists(), []),
    clearPlaylists: useCallback(() => clearPlaylists(), []),
    forceLoad: useCallback(() => forceLoad(), []),
  }
}
