/**
 * Songs Store — IndexedDB + reactive singleton
 *
 * DB v2: adicionado store `song_details` para slides e edições locais.
 *
 * Multiple components can consume this store and all will receive
 * state updates whenever songs are synced or cleared from any component.
 */
import { useSyncExternalStore, useCallback, useEffect } from 'react'
import { getDb, type Song, type SongDetailRecord } from '@/lib/db'
import { getApiV1Songs } from '@/lib/holyrics'

// ─── song_details IDB helpers (exported for use-song-detail) ─────────────────

export async function dbGetSongDetail(id: string): Promise<SongDetailRecord | undefined> {
  const db = await getDb()
  return db.get('song_details', id)
}

export async function dbPutSongDetail(detail: SongDetailRecord): Promise<void> {
  const db = await getDb()
  await db.put('song_details', detail)
}

export async function dbUpdateSongDetailFields(
  id: string,
  updates: Partial<SongDetailRecord>,
  dirtyFields: string[]
): Promise<SongDetailRecord | null> {
  const db = await getDb()
  const existing = await db.get('song_details', id)
  if (!existing) return null
  const updated: SongDetailRecord = {
    ...existing,
    ...updates,
    _dirty: true,
    _dirtyFields: Array.from(
      new Set([...(existing._dirtyFields ?? []), ...dirtyFields])
    ),
  }
  await db.put('song_details', updated)
  return updated
}

export async function dbMarkSongDetailClean(id: string): Promise<void> {
  const db = await getDb()
  const existing = await db.get('song_details', id)
  if (!existing) return
  await db.put('song_details', { ...existing, _dirty: false, _dirtyFields: [] })
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

  // Safety: never stay stuck in loading state
  const safetyTimer = setTimeout(() => {
    if (_state.isLoading) {
      console.warn('[SongsStore] IDB load timed out — forcing isLoading=false')
      setState({ isLoading: false })
    }
  }, 5000)

  try {
    const db = await getDb()
    const [songs, metaRecord] = await Promise.all([
      db.getAll('songs'),
      db.get('meta', 'lastSyncedAt'),
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

// Kick off initial load immediately (module-level side effect)
initialLoad()

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function syncSongs(): Promise<Song[]> {
  setState({ isSyncing: true, syncError: null })
  try {
    const response = await getApiV1Songs()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = response as any
    let songs: Song[] = []
    if (Array.isArray(raw?.data?.data)) songs = raw.data.data
    else if (Array.isArray(raw?.data)) songs = raw.data
    else if (Array.isArray(raw)) songs = raw

    const db = await getDb()
    const tx = db.transaction(['songs', 'meta'], 'readwrite')
    await tx.objectStore('songs').clear()
    await Promise.all(songs.map((s) => tx.objectStore('songs').put(s)))
    const lastSyncedAt = new Date().toISOString()
    await tx.objectStore('meta').put({ key: 'lastSyncedAt', value: lastSyncedAt })
    await tx.done

    setState({ songs, totalCount: songs.length, lastSyncedAt, isSyncing: false, isLoading: false })
    return songs
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao sincronizar músicas'
    setState({ isSyncing: false, syncError: message })
    throw error
  }
}

export async function clearSongs(): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(['songs', 'meta'], 'readwrite')
  await tx.objectStore('songs').clear()
  await tx.objectStore('meta').delete('lastSyncedAt')
  await tx.done
  setState({ songs: [], totalCount: 0, lastSyncedAt: null, isLoading: false, syncError: null })
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSongsStore() {
  const state = useSyncExternalStore(subscribe, getSnapshot)

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

  return {
    ...state,
    hasSongs: state.totalCount > 0,
    syncSongs: useCallback(syncSongs, []),
    clearSongs: useCallback(clearSongs, []),
    forceLoad: useCallback(forceLoad, []),
  }
}
export { Song }

