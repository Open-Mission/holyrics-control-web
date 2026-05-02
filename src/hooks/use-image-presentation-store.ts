import { useCallback, useSyncExternalStore } from 'react'

import { closeCurrentPresentation, goToPresentationIndex } from '@/api/holyrics'
import { presentMediaPath } from '@/api/holyrics/modules/media'
import { setState as setSongPresentationState } from '@/hooks/use-presentation-store'
import { type MediaLibraryItem } from '@/lib/db'
import {
  getMediaBaseName,
  getMediaParentPath,
  normalizeMediaPath,
} from '@/lib/media'

type ImagePresentationSourceMode = 'folder' | 'selection'

export interface ImagePresentationState {
  items: MediaLibraryItem[]
  selectedIndex: number | null
  presentedIndex: number | null
  isStarting: boolean
  isNavigating: boolean
  isPresenting: boolean
  panelOpen: boolean
  sourcePath: string | null
  sourceMode: ImagePresentationSourceMode
  currentPath: string | null
}

let _state: ImagePresentationState = {
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

export function setImagePresentationState(
  patch: Partial<ImagePresentationState>
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

export function getImagePresentationState() {
  return _state
}

function ensureImageItems(items: MediaLibraryItem[]) {
  return items
    .filter((item) => !item.isDir)
    .map((item) => ({
      ...item,
      mediaType: 'image' as const,
      path: normalizeMediaPath(item.path),
      parentPath: normalizeMediaPath(item.parentPath),
    }))
}

function createFallbackImage(path: string): MediaLibraryItem {
  const normalizedPath = normalizeMediaPath(path)
  return {
    mediaType: 'image',
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

function getSelectedItem() {
  return _state.selectedIndex === null ? null : _state.items[_state.selectedIndex] ?? null
}

export function openImagePresentationPanel() {
  setImagePresentationState({ panelOpen: true })
}

export function closeImagePresentationPanel() {
  setImagePresentationState({ panelOpen: false })
}

export function openImagePresentationSession(input: {
  items: MediaLibraryItem[]
  selectedIndex?: number
  sourcePath?: string
  sourceMode?: ImagePresentationSourceMode
}) {
  const items = ensureImageItems(input.items)
  const selectedIndex = resolveSafeIndex(items, input.selectedIndex)
  const fallbackPath = items[selectedIndex ?? 0]?.path ?? ''

  setImagePresentationState({
    items: items.length > 0 ? items : fallbackPath ? [createFallbackImage(fallbackPath)] : [],
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

export function selectImagePresentationIndex(index: number) {
  if (index < 0 || index >= _state.items.length) return
  setImagePresentationState({
    selectedIndex: index,
    currentPath: _state.items[index]?.path ?? null,
  })
}

export async function startSelectedImagePresentation() {
  const items = ensureImageItems(_state.items)
  const selectedIndex = resolveSafeIndex(items, _state.selectedIndex ?? 0)
  const selectedItem = selectedIndex === null ? null : items[selectedIndex] ?? null
  const sourcePath = normalizeMediaPath(_state.sourcePath ?? '')

  if (!selectedItem) {
    throw new Error('Nenhuma imagem selecionada para apresentar.')
  }

  clearSongPresentationState()

  setImagePresentationState({
    isStarting: true,
    panelOpen: true,
  })

  try {
    if (_state.sourceMode === 'folder' && sourcePath) {
      await presentMediaPath({
        mediaType: 'image',
        path: sourcePath,
      })

      if (selectedIndex !== null && selectedIndex > 0) {
        await goToPresentationIndex(selectedIndex)
      }
    } else {
      await presentMediaPath({
        mediaType: 'image',
        path: selectedItem.path,
      })
    }

    setImagePresentationState({
      isPresenting: true,
      presentedIndex: selectedIndex,
      currentPath: selectedItem.path,
    })
  } finally {
    setImagePresentationState({ isStarting: false })
  }
}

export async function goToPresentedImage(index: number) {
  const items = ensureImageItems(_state.items)
  if (items.length === 0 || index < 0 || index >= items.length) return

  if (!_state.isPresenting) {
    setImagePresentationState({
      selectedIndex: index,
      currentPath: items[index]?.path ?? null,
    })
    return
  }

  const previousPresentedIndex = _state.presentedIndex
  const previousSelectedIndex = _state.selectedIndex

  setImagePresentationState({
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
        mediaType: 'image',
        path: items[index]?.path ?? '',
      })
    }
  } catch (error) {
    setImagePresentationState({
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
    setImagePresentationState({ isNavigating: false })
  }
}

export async function closeImagePresentation() {
  setImagePresentationState({ isStarting: true })
  try {
    await closeCurrentPresentation()
  } finally {
    setImagePresentationState({
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
}

export function clearImagePresentation() {
  setImagePresentationState({
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

export function useImagePresentationStore() {
  const state = useSyncExternalStore(subscribe, getSnapshot)
  const currentItem = getSelectedItem()
  const presentedItem =
    state.presentedIndex === null ? null : state.items[state.presentedIndex] ?? null

  return {
    ...state,
    currentItem,
    presentedItem,
    openPanel: useCallback(() => openImagePresentationPanel(), []),
    closePanel: useCallback(() => closeImagePresentationPanel(), []),
    openSession: useCallback(
      (input: {
        items: MediaLibraryItem[]
        selectedIndex?: number
        sourcePath?: string
        sourceMode?: ImagePresentationSourceMode
      }) => openImagePresentationSession(input),
      []
    ),
    selectImage: useCallback((index: number) => selectImagePresentationIndex(index), []),
    startSelectedPresentation: useCallback(() => startSelectedImagePresentation(), []),
    goToImage: useCallback((index: number) => goToPresentedImage(index), []),
    closePresentation: useCallback(() => closeImagePresentation(), []),
    clearPresentation: useCallback(() => clearImagePresentation(), []),
  }
}
