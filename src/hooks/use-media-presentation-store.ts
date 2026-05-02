import { useCallback, useSyncExternalStore } from 'react'

import { closeCurrentPresentation, goToPresentationIndex } from '@/api/holyrics'
import { presentMediaPath } from '@/api/holyrics/modules/media'
import { setState as setSongPresentationState } from '@/hooks/use-presentation-store'
import { type MediaLibraryItem, type MediaType } from '@/lib/db'
import {
  getMediaBaseName,
  getMediaParentPath,
  normalizeMediaPath,
} from '@/lib/media'

type MediaPresentationSourceMode = 'folder' | 'selection'

export interface MediaPresentationState {
  mediaType: MediaType | null
  items: MediaLibraryItem[]
  selectedIndex: number | null
  presentedIndex: number | null
  isStarting: boolean
  isNavigating: boolean
  isPresenting: boolean
  panelOpen: boolean
  sourcePath: string | null
  sourceMode: MediaPresentationSourceMode
  currentPath: string | null
}

let _state: MediaPresentationState = {
  mediaType: null,
  items: [],
  selectedIndex: null,
  presentedIndex: null,
  isStarting: false,
  isNavigating: false,
  isPresenting: false,
  panelOpen: false,
  sourcePath: null,
  sourceMode: 'selection',
  currentPath: null,
}

const _listeners = new Set<() => void>()

function emit() {
  _listeners.forEach((listener) => listener())
}

export function setMediaPresentationState(
  patch: Partial<MediaPresentationState>
) {
  _state = { ..._state, ...patch }
  emit()
}

function subscribe(listener: () => void) {
  _listeners.add(listener)
  return () => _listeners.delete(listener)
}

function getSnapshot() {
  return _state
}

export function getMediaPresentationState() {
  return _state
}

function createFallbackItem(
  mediaType: MediaType,
  path: string
): MediaLibraryItem {
  const normalizedPath = normalizeMediaPath(path)
  return {
    mediaType,
    path: normalizedPath,
    parentPath: getMediaParentPath(normalizedPath),
    name: getMediaBaseName(normalizedPath),
    isDir: false,
    hasScannedChildren: true,
    discoveredAt: new Date().toISOString(),
  }
}

function clearSongPresentationState() {
  setSongPresentationState({
    song: null,
    slides: [],
    activeIndex: null,
    presentationKind: null,
    panelOpen: false,
    selectedSong: null,
  })
}

function resolveSafeIndex(items: MediaLibraryItem[], index?: number) {
  if (items.length === 0) return null
  return Math.max(0, Math.min(index ?? 0, items.length - 1))
}

export function openMediaPresentationPanel() {
  setMediaPresentationState({ panelOpen: true })
}

export function closeMediaPresentationPanel() {
  setMediaPresentationState({ panelOpen: false })
}

export function openMediaPresentationSession(input: {
  mediaType: MediaType
  items: MediaLibraryItem[]
  selectedIndex?: number
  sourcePath?: string
  sourceMode?: MediaPresentationSourceMode
}) {
  const items = input.items
    .filter((item) => !item.isDir)
    .map((item) => ({
      ...item,
      mediaType: input.mediaType,
      path: normalizeMediaPath(item.path),
      parentPath: normalizeMediaPath(item.parentPath),
    }))

  const selectedIndex = resolveSafeIndex(items, input.selectedIndex)
  const fallbackPath = items[selectedIndex ?? 0]?.path ?? ''

  setMediaPresentationState({
    mediaType: input.mediaType,
    items:
      items.length > 0
        ? items
        : fallbackPath
          ? [createFallbackItem(input.mediaType, fallbackPath)]
          : [],
    selectedIndex,
    presentedIndex: null,
    panelOpen: true,
    isPresenting: false,
    isStarting: false,
    isNavigating: false,
    sourcePath: normalizeMediaPath(input.sourcePath ?? fallbackPath),
    sourceMode: input.sourceMode ?? 'selection',
    currentPath: items[selectedIndex ?? 0]?.path ?? fallbackPath ?? null,
  })
}

export function selectMediaPresentationIndex(index: number) {
  if (index < 0 || index >= _state.items.length) return
  setMediaPresentationState({
    selectedIndex: index,
    currentPath: _state.items[index]?.path ?? null,
  })
}

export async function startSelectedMediaPresentation() {
  const items = _state.items.filter((item) => !item.isDir)
  const mediaType = _state.mediaType
  const selectedIndex = resolveSafeIndex(items, _state.selectedIndex ?? 0)
  const selectedItem = selectedIndex === null ? null : items[selectedIndex] ?? null
  const sourcePath = normalizeMediaPath(_state.sourcePath ?? '')

  if (!mediaType || !selectedItem) {
    throw new Error('Nenhum item de mídia selecionado para apresentar.')
  }

  clearSongPresentationState()
  setMediaPresentationState({
    isStarting: true,
    panelOpen: true,
  })

  try {
    if (_state.sourceMode === 'folder' && sourcePath) {
      await presentMediaPath({ mediaType, path: sourcePath })
      if (selectedIndex !== null && selectedIndex > 0) {
        await goToPresentationIndex(selectedIndex)
      }
    } else {
      await presentMediaPath({ mediaType, path: selectedItem.path })
    }

    setMediaPresentationState({
      isPresenting: true,
      presentedIndex: selectedIndex,
      currentPath: selectedItem.path,
    })
  } finally {
    setMediaPresentationState({ isStarting: false })
  }
}

export async function goToPresentedMedia(index: number) {
  const items = _state.items.filter((item) => !item.isDir)
  if (items.length === 0 || index < 0 || index >= items.length || !_state.mediaType) return

  if (!_state.isPresenting) {
    setMediaPresentationState({
      selectedIndex: index,
      currentPath: items[index]?.path ?? null,
    })
    return
  }

  const previousPresentedIndex = _state.presentedIndex
  const previousSelectedIndex = _state.selectedIndex

  setMediaPresentationState({
    selectedIndex: index,
    presentedIndex: index,
    currentPath: items[index]?.path ?? null,
    isNavigating: true,
  })

  try {
    if (_state.sourceMode === 'folder' && _state.sourcePath) {
      await goToPresentationIndex(index)
    } else {
      await presentMediaPath({
        mediaType: _state.mediaType,
        path: items[index]?.path ?? '',
      })
    }
  } catch (error) {
    setMediaPresentationState({
      selectedIndex: previousSelectedIndex,
      presentedIndex: previousPresentedIndex,
      currentPath:
        previousSelectedIndex === null
          ? _state.currentPath
          : items[previousSelectedIndex]?.path ?? _state.currentPath,
      isNavigating: false,
    })
    throw error
  } finally {
    setMediaPresentationState({ isNavigating: false })
  }
}

export async function closeMediaPresentation() {
  setMediaPresentationState({ isStarting: true })
  try {
    await closeCurrentPresentation()
  } finally {
    clearMediaPresentation()
  }
}

export function clearMediaPresentation() {
  setMediaPresentationState({
    mediaType: null,
    items: [],
    selectedIndex: null,
    presentedIndex: null,
    isStarting: false,
    isNavigating: false,
    isPresenting: false,
    panelOpen: false,
    sourcePath: null,
    sourceMode: 'selection',
    currentPath: null,
  })
}

export function useMediaPresentationStore() {
  const state = useSyncExternalStore(subscribe, getSnapshot)
  const currentItem =
    state.selectedIndex === null ? null : state.items[state.selectedIndex] ?? null
  const presentedItem =
    state.presentedIndex === null ? null : state.items[state.presentedIndex] ?? null

  return {
    ...state,
    currentItem,
    presentedItem,
    openPanel: useCallback(() => openMediaPresentationPanel(), []),
    closePanel: useCallback(() => closeMediaPresentationPanel(), []),
    openSession: useCallback(
      (input: {
        mediaType: MediaType
        items: MediaLibraryItem[]
        selectedIndex?: number
        sourcePath?: string
        sourceMode?: MediaPresentationSourceMode
      }) => openMediaPresentationSession(input),
      []
    ),
    selectMedia: useCallback((index: number) => selectMediaPresentationIndex(index), []),
    startSelectedPresentation: useCallback(() => startSelectedMediaPresentation(), []),
    goToMedia: useCallback((index: number) => goToPresentedMedia(index), []),
    closePresentation: useCallback(() => closeMediaPresentation(), []),
    clearPresentation: useCallback(() => clearMediaPresentation(), []),
  }
}
