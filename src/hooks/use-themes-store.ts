import { useSyncExternalStore, useCallback, useEffect } from 'react'
import { getDb, type Theme } from '@/lib/db'
import { getApiV1BackgroundsThemes } from '@/api/generated'

// ─── Store state ──────────────────────────────────────────────────────────────

export interface ThemesStoreState {
  themes: Theme[]
  totalCount: number
  lastSyncedAt: string | null
  isSyncing: boolean
  isLoading: boolean
  syncError: string | null
}

let _state: ThemesStoreState = {
  themes: [],
  totalCount: 0,
  lastSyncedAt: null,
  isSyncing: false,
  isLoading: true,
  syncError: null,
}

const _listeners = new Set<() => void>()

function setState(next: Partial<ThemesStoreState>) {
  _state = { ..._state, ...next }
  _listeners.forEach((l) => l())
}

function getSnapshot(): ThemesStoreState {
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
    const [themes, metaRecord] = await Promise.all([
      db.getAll('themes'),
      db.get('meta', 'themesLastSyncedAt'),
    ])
    setState({
      themes,
      totalCount: themes.length,
      lastSyncedAt: metaRecord?.value ?? null,
      isLoading: false,
    })
  } catch (err) {
    console.error('[ThemesStore] Failed to load from IndexedDB:', err)
    setState({ isLoading: false })
  }
}

initialLoad()

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function syncThemes(): Promise<Theme[]> {
  setState({ isSyncing: true, syncError: null })
  try {
    const response = await getApiV1BackgroundsThemes()
    const themes: Theme[] = (response as any).data || []

    const db = await getDb()
    const tx = db.transaction(['themes', 'meta'], 'readwrite')
    await tx.objectStore('themes').clear()
    await Promise.all(themes.map((t) => tx.objectStore('themes').put(t)))
    const lastSyncedAt = new Date().toISOString()
    await tx.objectStore('meta').put({ key: 'themesLastSyncedAt', value: lastSyncedAt })
    await tx.done

    setState({ themes, totalCount: themes.length, lastSyncedAt, isSyncing: false, isLoading: false })
    return themes
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao sincronizar temas'
    setState({ isSyncing: false, syncError: message })
    throw error
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useThemesStore() {
  const state = useSyncExternalStore(subscribe, getSnapshot)

  useEffect(() => {
    if (!state.isLoading) return
    const elapsed = Date.now() - _loadStartedAt
    if (elapsed > 2000 && _state.isLoading) {
       forceLoad()
    }
  }, [state.isLoading])

  return {
    ...state,
    syncThemes: useCallback(syncThemes, []),
    forceLoad: useCallback(forceLoad, []),
  }
}
