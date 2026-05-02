/**
 * Songs Store — IndexedDB + reactive singleton
 *
 * DB v2: adicionado store `song_details` para slides e edições locais.
 *
 * Multiple components can consume this store and all will receive
 * state updates whenever songs are synced or cleared from any component.
 */
import { useSyncExternalStore, useCallback, useEffect } from 'react'
import { type LyricSlide, type Song, type SongDetailRecord } from '@/lib/db'
import {
  deleteServerMeta,
  readServerMeta,
  readServerSongDetail,
  readServerSongs,
  writeServerMeta,
  writeServerSongDetail,
  writeServerSongs,
} from '@/lib/db-server'
import { listSongs } from '@/api/holyrics'
import { getCurrentActiveServer } from '@/hooks/use-server-store'
import { subscribeToServerContextChange } from '@/lib/server-context-events'

// ─── song_details IDB helpers (exported for use-song-detail) ─────────────────

export async function dbGetSongDetail(id: string): Promise<SongDetailRecord | undefined> {
  const serverId = getCurrentActiveServer()?.id
  if (!serverId) return undefined

  return (await readServerSongDetail(serverId, id))?.payload
}

export async function dbPutSongDetail(detail: SongDetailRecord): Promise<void> {
  const serverId = getCurrentActiveServer()?.id
  if (!serverId) return

  await writeServerSongDetail(serverId, detail)
}

export async function dbUpdateSongDetailFields(
  id: string,
  updates: Partial<SongDetailRecord>,
  dirtyFields: string[]
): Promise<SongDetailRecord | null> {
  const serverId = getCurrentActiveServer()?.id
  if (!serverId) return null

  const existing = await dbGetSongDetail(id)
  if (!existing) return null
  const updated: SongDetailRecord = {
    ...existing,
    ...updates,
    _dirty: true,
    _dirtyFields: Array.from(
      new Set([...(existing._dirtyFields ?? []), ...dirtyFields])
    ),
  }
  await writeServerSongDetail(serverId, updated)
  return updated
}

export async function dbMarkSongDetailClean(id: string): Promise<void> {
  const serverId = getCurrentActiveServer()?.id
  if (!serverId) return

  const existing = await dbGetSongDetail(id)
  if (!existing) return
  await writeServerSongDetail(serverId, {
    ...existing,
    _dirty: false,
    _dirtyFields: [],
  })
}

// ─── Store state ──────────────────────────────────────────────────────────────

export interface SongsStoreState {
  songs: Song[]
  totalCount: number
  lastSyncedAt: string | null
  isSyncing: boolean
  isLoading: boolean
  syncError: string | null
}

let _state: SongsStoreState = {
  songs: [],
  totalCount: 0,
  lastSyncedAt: null,
  isSyncing: false,
  isLoading: true,
  syncError: null,
}

const _listeners = new Set<() => void>()

function setState(next: Partial<SongsStoreState>) {
  _state = { ..._state, ...next }
  _listeners.forEach((l) => l())
}

function getSnapshot(): SongsStoreState {
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

  // Safety: never stay stuck in loading state
  const safetyTimer = setTimeout(() => {
    if (_state.isLoading) {
      console.warn('[SongsStore] IDB load timed out — forcing isLoading=false')
      setState({ isLoading: false })
    }
  }, 5000)

  try {
    if (!serverId) {
      setState({
        songs: [],
        totalCount: 0,
        lastSyncedAt: null,
        isLoading: false,
      })
      return
    }

    const [songs, metaRecord] = await Promise.all([
      readServerSongs(serverId),
      readServerMeta(serverId, 'songs:lastSyncedAt'),
    ])
    setState({
      songs,
      totalCount: songs.length,
      lastSyncedAt: metaRecord?.value ?? null,
      isLoading: false,
    })
  } catch (err) {
    console.error('[SongsStore] Failed to load from IndexedDB:', err)
    setState({ isLoading: false })
  } finally {
    clearTimeout(safetyTimer)
  }
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function syncSongs(): Promise<Song[]> {
  const serverId = getCurrentActiveServer()?.id
  if (!serverId) {
    throw new Error('Nenhum servidor ativo configurado.')
  }

  setState({ isSyncing: true, syncError: null })
  try {
    const response = await listSongs()
    const songs: Song[] = Array.isArray(response) ? response as Song[] : []

    const lastSyncedAt = new Date().toISOString()
    await writeServerSongs(serverId, songs)
    await writeServerMeta(serverId, 'songs:lastSyncedAt', lastSyncedAt)

    setState({ songs, totalCount: songs.length, lastSyncedAt, isSyncing: false, isLoading: false })
    return songs
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao sincronizar músicas'
    setState({ isSyncing: false, syncError: message })
    throw error
  }
}

export async function clearSongs(): Promise<void> {
  const serverId = getCurrentActiveServer()?.id
  if (!serverId) {
    setState({ songs: [], totalCount: 0, lastSyncedAt: null, isLoading: false, syncError: null })
    return
  }

  await writeServerSongs(serverId, [])
  await deleteServerMeta(serverId, 'songs:lastSyncedAt')
  setState({ songs: [], totalCount: 0, lastSyncedAt: null, isLoading: false, syncError: null })
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSongsStore() {
  const state = useSyncExternalStore(subscribe, getSnapshot)

  useEffect(() => {
    initialLoad()
  }, [])

  // If the store is still loading after 1.5s since module init, something is wrong — retry
  useEffect(() => {
    if (!state.isLoading) return
    const elapsed = Date.now() - _loadStartedAt
    const delay = Math.max(0, 1500 - elapsed)
    const t = setTimeout(() => {
      if (_state.isLoading) {
        console.warn('[SongsStore] Load appears stuck — retrying...')
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
    hasSongs: state.totalCount > 0,
    syncSongs: useCallback(() => syncSongs(), []),
    clearSongs: useCallback(() => clearSongs(), []),
    forceLoad: useCallback(() => forceLoad(), []),
  }
}
export type { LyricSlide, Song, SongDetailRecord }
