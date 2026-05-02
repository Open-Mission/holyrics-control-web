import { useCallback, useEffect, useSyncExternalStore } from 'react'

import { listMedia, mapHolyricsMediaItem } from '@/api/holyrics'
import {
  markServerMediaFolderScanned,
  readServerMediaItem,
  readServerMediaItems,
  readServerMeta,
  replaceServerMediaChildren,
  resolveServerMediaPath,
  writeServerMeta,
} from '@/lib/db-server'
import { type MediaLibraryItem } from '@/lib/db'
import { getCurrentActiveServer } from '@/hooks/use-server-store'
import { type HolyricsMediaType, normalizeMediaPath } from '@/lib/media'
import { subscribeToServerContextChange } from '@/lib/server-context-events'

export interface MediaLibraryState {
  items: MediaLibraryItem[]
  totalCount: number
  lastSyncedAt: string | null
  isSyncing: boolean
  isLoading: boolean
  syncError: string | null
}

const INITIAL_STATE: MediaLibraryState = {
  items: [],
  totalCount: 0,
  lastSyncedAt: null,
  isSyncing: false,
  isLoading: true,
  syncError: null,
}

const _listeners = new Set<() => void>()
const _stateByType: Record<HolyricsMediaType, MediaLibraryState> = {
  image: { ...INITIAL_STATE },
  video: { ...INITIAL_STATE },
  audio: { ...INITIAL_STATE },
}
const _initialLoadDone: Record<HolyricsMediaType, boolean> = {
  image: false,
  video: false,
  audio: false,
}
const _loadStartedAt: Record<HolyricsMediaType, number> = {
  image: 0,
  video: 0,
  audio: 0,
}
const _syncingPromise = new Map<HolyricsMediaType, Promise<MediaLibraryItem[]>>()

function subscribe(listener: () => void) {
  _listeners.add(listener)
  return () => _listeners.delete(listener)
}

function emit() {
  _listeners.forEach((listener) => listener())
}

function setState(mediaType: HolyricsMediaType, next: Partial<MediaLibraryState>) {
  _stateByType[mediaType] = { ..._stateByType[mediaType], ...next }
  emit()
}

function getSnapshot(mediaType: HolyricsMediaType) {
  return _stateByType[mediaType]
}

function thumbnailEnabled(mediaType: HolyricsMediaType) {
  return mediaType !== 'audio'
}

async function refreshFromDb(mediaType: HolyricsMediaType, serverId: string) {
  const [items, meta] = await Promise.all([
    readServerMediaItems(serverId, mediaType),
    readServerMeta(serverId, `media:${mediaType}:lastSyncedAt`),
  ])

  const sorted = items.slice().sort((a, b) => {
    if (a.parentPath !== b.parentPath) {
      return a.parentPath.localeCompare(b.parentPath)
    }
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1
    return a.name.localeCompare(b.name, 'pt-BR')
  })

  setState(mediaType, {
    items: sorted,
    totalCount: sorted.length,
    lastSyncedAt: meta?.value ?? null,
    isLoading: false,
  })

  return sorted
}

async function fetchFolder(serverId: string, mediaType: HolyricsMediaType, folderPath = '') {
  const normalizedFolder = normalizeMediaPath(folderPath)
  const response = await listMedia({
    mediaType,
    folder: normalizedFolder || undefined,
    includeMetadata: true,
    includeThumbnail: thumbnailEnabled(mediaType),
  })

  const mapped = response.map((item) =>
    mapHolyricsMediaItem(mediaType, item, normalizedFolder)
  )

  await replaceServerMediaChildren(serverId, mediaType, normalizedFolder, mapped)

  if (normalizedFolder) {
    await markServerMediaFolderScanned(serverId, mediaType, normalizedFolder, true)
  }

  return mapped
}

async function initialLoad(mediaType: HolyricsMediaType) {
  if (_initialLoadDone[mediaType]) return

  _initialLoadDone[mediaType] = true
  _loadStartedAt[mediaType] = Date.now()

  const serverId = getCurrentActiveServer()?.id
  if (!serverId) {
    setState(mediaType, {
      items: [],
      totalCount: 0,
      lastSyncedAt: null,
      isLoading: false,
      syncError: null,
    })
    return
  }

  try {
    await refreshFromDb(mediaType, serverId)
  } catch (error) {
    console.error(`[MediaLibrary:${mediaType}] Failed to load from IndexedDB`, error)
    setState(mediaType, { isLoading: false })
  }
}

export async function forceLoadMediaLibrary(mediaType: HolyricsMediaType) {
  _initialLoadDone[mediaType] = false
  setState(mediaType, { ...INITIAL_STATE })
  await initialLoad(mediaType)
}

export async function syncMediaLibrary(mediaType: HolyricsMediaType) {
  const inFlight = _syncingPromise.get(mediaType)
  if (inFlight) return inFlight

  const serverId = getCurrentActiveServer()?.id
  if (!serverId) {
    throw new Error('Nenhum servidor ativo configurado.')
  }

  const syncPromise = (async () => {
    setState(mediaType, { isSyncing: true, syncError: null })

    try {
      const rootItems = await fetchFolder(serverId, mediaType)
      const lastSyncedAt = new Date().toISOString()
      await writeServerMeta(serverId, `media:${mediaType}:lastSyncedAt`, lastSyncedAt)
      await refreshFromDb(mediaType, serverId)

      const queue = rootItems.filter((item) => item.isDir).map((item) => item.path)

      while (queue.length > 0) {
        const folderPath = queue.shift()
        if (!folderPath) continue

        const children = await fetchFolder(serverId, mediaType, folderPath)
        queue.push(...children.filter((item) => item.isDir).map((item) => item.path))
      }

      const allItems = await refreshFromDb(mediaType, serverId)
      setState(mediaType, { isSyncing: false, lastSyncedAt })
      return allItems
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `Erro ao sincronizar ${mediaType}`
      setState(mediaType, {
        isSyncing: false,
        isLoading: false,
        syncError: message,
      })
      throw error
    } finally {
      _syncingPromise.delete(mediaType)
    }
  })()

  _syncingPromise.set(mediaType, syncPromise)
  return syncPromise
}

export async function ensureMediaFolderLoaded(
  mediaType: HolyricsMediaType,
  folderPath: string
) {
  const serverId = getCurrentActiveServer()?.id
  if (!serverId) return []

  const normalizedFolder = normalizeMediaPath(folderPath)
  if (!normalizedFolder) {
    return readServerMediaItems(serverId, mediaType)
  }

  const existingFolder = await readServerMediaItem(serverId, mediaType, normalizedFolder)
  if (existingFolder?.payload.hasScannedChildren) {
    return readServerMediaItems(serverId, mediaType)
  }

  await fetchFolder(serverId, mediaType, normalizedFolder)
  return refreshFromDb(mediaType, serverId)
}

export async function resolveActiveServerMediaPath(
  mediaType: HolyricsMediaType,
  reference: string
) {
  const serverId = getCurrentActiveServer()?.id
  if (!serverId) return null

  return resolveServerMediaPath(serverId, mediaType, reference)
}

export function useMediaLibrary(mediaType: HolyricsMediaType) {
  const state = useSyncExternalStore(
    subscribe,
    () => getSnapshot(mediaType),
    () => getSnapshot(mediaType)
  )

  useEffect(() => {
    initialLoad(mediaType)
  }, [mediaType])

  useEffect(() => {
    if (!state.isLoading) return

    const elapsed = Date.now() - _loadStartedAt[mediaType]
    const delay = Math.max(0, 1500 - elapsed)
    const timeout = setTimeout(() => {
      if (_stateByType[mediaType].isLoading) {
        forceLoadMediaLibrary(mediaType)
      }
    }, delay)

    return () => clearTimeout(timeout)
  }, [mediaType, state.isLoading])

  useEffect(() => {
    return subscribeToServerContextChange(() => {
      void forceLoadMediaLibrary(mediaType)
    })
  }, [mediaType])

  return {
    ...state,
    hasItems: state.totalCount > 0,
    syncMediaLibrary: useCallback(() => syncMediaLibrary(mediaType), [mediaType]),
    ensureMediaFolderLoaded: useCallback(
      (folderPath: string) => ensureMediaFolderLoaded(mediaType, folderPath),
      [mediaType]
    ),
    resolveMediaPath: useCallback(
      (reference: string) => resolveActiveServerMediaPath(mediaType, reference),
      [mediaType]
    ),
    forceLoad: useCallback(() => forceLoadMediaLibrary(mediaType), [mediaType]),
  }
}
