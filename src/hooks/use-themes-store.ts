import { useSyncExternalStore, useCallback, useEffect } from 'react'
import { type Theme } from '@/lib/db'
import {
  readServerMeta,
  readServerThemes,
  writeServerMeta,
  writeServerThemes,
} from '@/lib/db-server'
import { listThemes } from '@/api/holyrics'
import { getCurrentActiveServer } from '@/hooks/use-server-store'
import { subscribeToServerContextChange } from '@/lib/server-context-events'

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
  const serverId = getCurrentActiveServer()?.id

  try {
    if (!serverId) {
      setState({
        themes: [],
        totalCount: 0,
        lastSyncedAt: null,
        isLoading: false,
      })
      return
    }

    const [themes, metaRecord] = await Promise.all([
      readServerThemes(serverId),
      readServerMeta(serverId, 'themes:lastSyncedAt'),
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

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function syncThemes(): Promise<Theme[]> {
  const serverId = getCurrentActiveServer()?.id
  if (!serverId) {
    throw new Error('Nenhum servidor ativo configurado.')
  }

  setState({ isSyncing: true, syncError: null })
  try {
    const response = await listThemes()
    const themes = Array.isArray(response) ? (response as Theme[]) : []

    const lastSyncedAt = new Date().toISOString()
    await writeServerThemes(serverId, themes)
    await writeServerMeta(serverId, 'themes:lastSyncedAt', lastSyncedAt)

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
    initialLoad()
  }, [])

  useEffect(() => {
    if (!state.isLoading) return
    const elapsed = Date.now() - _loadStartedAt
    if (elapsed > 2000 && _state.isLoading) {
       forceLoad()
    }
  }, [state.isLoading])

  useEffect(() => {
    return subscribeToServerContextChange(() => {
      forceLoad()
    })
  }, [])

  return {
    ...state,
    syncThemes: useCallback(() => syncThemes(), []),
    forceLoad: useCallback(() => forceLoad(), []),
  }
}
