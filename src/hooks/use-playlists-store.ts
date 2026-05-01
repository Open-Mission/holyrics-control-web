import { useSyncExternalStore, useCallback, useEffect } from 'react'
import { getDb } from '@/lib/db'
import { getApiV1PlaylistsSaved } from '@/api/generated'

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

  try {
    const db = await getDb()
    const [playlists, metaRecord] = await Promise.all([
      db.getAll('playlists'),
      db.get('meta', 'lastSyncedAt:playlists'),
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

// Kick off initial load immediately
initialLoad()

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function syncPlaylists(): Promise<Playlist[]> {
  setState({ isSyncing: true, syncError: null })
  try {
    const response = await getApiV1PlaylistsSaved()
    
    // Handle different response formats
    let rawData: any = response.data
    // If it's the standard Holyrics response { status: 'ok', data: ... }
    if (rawData && typeof rawData === 'object' && 'status' in rawData && 'data' in rawData) {
      rawData = rawData.data
    }

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

    const db = await getDb()
    const tx = db.transaction(['playlists', 'meta'], 'readwrite')
    await tx.objectStore('playlists').clear()
    await Promise.all(playlists.map((p) => tx.objectStore('playlists').put(p)))
    
    const lastSyncedAt = new Date().toISOString()
    await tx.objectStore('meta').put({ key: 'lastSyncedAt:playlists', value: lastSyncedAt })
    await tx.done

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
  const db = await getDb()
  const tx = db.transaction(['playlists', 'meta'], 'readwrite')
  await tx.objectStore('playlists').clear()
  await tx.objectStore('meta').delete('lastSyncedAt:playlists')
  await tx.done
  setState({ playlists: [], totalCount: 0, lastSyncedAt: null, isLoading: false, syncError: null })
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePlaylistsStore() {
  const state = useSyncExternalStore(subscribe, getSnapshot)

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

  return {
    ...state,
    hasPlaylists: state.totalCount > 0,
    syncPlaylists: useCallback(syncPlaylists, []),
    clearPlaylists: useCallback(clearPlaylists, []),
    forceLoad: useCallback(forceLoad, []),
  }
}
