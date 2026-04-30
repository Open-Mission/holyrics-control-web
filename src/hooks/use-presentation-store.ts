/**
 * Presentation Store — estado global da apresentação ativa + painel
 *
 * Singleton reativo. Gerencia:
 * - Qual música está sendo apresentada (song, slides, activeIndex)
 * - Qual música está selecionada no painel (selectedSong)
 * - Se o painel detalhe está aberto (panelOpen)
 *
 * Optimistic UI: activeIndex atualizado imediatamente, revertido em erro.
 */
import { useSyncExternalStore, useCallback } from 'react'
import {
  postApiV1SongsShow,
  postApiV1PresentationGoToIndex,
  postApiV1PresentationClose,
} from '@/lib/holyrics'
import {
  fetchGlobalSettings,
  getMusicPresentationApiIndex,
  shouldUseInitialSlide,
} from '@/lib/global-settings'
import type { Song } from './use-songs-store'
import type { LyricSlide } from './use-song-detail'

// ─── State shape ──────────────────────────────────────────────────────────────

export interface PresentationState {
  /** Música sendo apresentada no Holyrics (null = sem apresentação) */
  song: Song | null
  slides: LyricSlide[]
  /** Optimistic active slide index */
  activeIndex: number | null
  /** True while postApiV1SongsShow is in-flight */
  isStarting: boolean
  /** True while goToIndex is in-flight */
  isNavigating: boolean
  /** Tipo da apresentação ativa para aplicar regras específicas do Holyrics */
  presentationKind: 'song' | null
  /** Música atualmente aberta no SongDetailPanel (pode ser diferente de song) */
  selectedSong: Song | null
  /** Controla se o SongDetailPanel está visível */
  panelOpen: boolean
}

// ─── Singleton state ──────────────────────────────────────────────────────────

let _state: PresentationState = {
  song: null,
  slides: [],
  activeIndex: null,
  isStarting: false,
  isNavigating: false,
  presentationKind: null,
  selectedSong: null,
  panelOpen: false,
}

const _listeners = new Set<() => void>()

function setState(patch: Partial<PresentationState>) {
  _state = { ..._state, ...patch }
  _listeners.forEach((l) => l())
}

function getSnapshot(): PresentationState {
  return _state
}

function subscribe(cb: () => void): () => void {
  _listeners.add(cb)
  return () => _listeners.delete(cb)
}

// ─── Panel actions ────────────────────────────────────────────────────────────

/**
 * Abre o SongDetailPanel para uma música específica.
 * Não altera o estado da apresentação em andamento.
 */
export function openPanelForSong(song: Song) {
  setState({ selectedSong: song, panelOpen: true })
}

/**
 * Fecha o SongDetailPanel sem parar a apresentação.
 */
export function closePanel() {
  setState({ panelOpen: false })
}

// ─── Presentation actions ─────────────────────────────────────────────────────

/**
 * Inicia apresentação a partir de um índice.
 * Abre o painel para a música apresentada e muda para aba de slides.
 */
export async function startPresentation(
  song: Song,
  slides: LyricSlide[],
  initialIndex = 0,
  options?: { respectInitialSlide?: boolean }
): Promise<void> {
  const settings = await fetchGlobalSettings()
  const useInitialSlide = options?.respectInitialSlide !== false && shouldUseInitialSlide(settings)
  const apiInitialIndex = useInitialSlide ? 0 : initialIndex
  const visualActiveIndex = useInitialSlide && initialIndex === 0 ? null : initialIndex

  setState({
    song,
    slides,
    activeIndex: visualActiveIndex,
    isStarting: true,
    presentationKind: 'song',
    // Mantém o painel aberto na música que está sendo apresentada
    selectedSong: song,
    panelOpen: true,
  })
  try {
    await postApiV1SongsShow({ id: song.id, initialIndex: apiInitialIndex })
  } catch (err) {
    console.error('[Presentation] Failed to start:', err)
    throw err
  } finally {
    setState({ isStarting: false })
  }
}

/**
 * Navega para um slide específico — Optimistic UI.
 */
export async function goToSlide(index: number): Promise<void> {
  const prev = _state.activeIndex
  setState({ activeIndex: index, isNavigating: true })
  try {
    let apiIndex = index

    if (_state.presentationKind === 'song') {
      const settings = await fetchGlobalSettings()
      apiIndex = getMusicPresentationApiIndex(index, settings)
    }

    await postApiV1PresentationGoToIndex({ index: apiIndex })
  } catch (err) {
    setState({ activeIndex: prev, isNavigating: false })
    console.error('[Presentation] goToIndex failed:', err)
    throw err
  } finally {
    setState({ isNavigating: false })
  }
}

/**
 * Para a apresentação e limpa todo o estado.
 */
export async function closePresentation(): Promise<void> {
  setState({ isStarting: true })
  try {
    await postApiV1PresentationClose()
  } catch (err) {
    console.error('[Presentation] Close failed:', err)
  } finally {
    setState({
      song: null,
      slides: [],
      activeIndex: null,
      isStarting: false,
      presentationKind: null,
      panelOpen: false,
      selectedSong: null,
    })
  }
}

export function clearPresentation() {
  setState({
    song: null,
    slides: [],
    activeIndex: null,
    presentationKind: null,
    panelOpen: false,
    selectedSong: null
  })
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePresentationStore() {
  const state = useSyncExternalStore(subscribe, getSnapshot)
  return {
    ...state,
    isPresenting: state.song !== null,
    openPanelForSong: useCallback(openPanelForSong, []),
    closePanel: useCallback(closePanel, []),
    startPresentation: useCallback(startPresentation, []),
    goToSlide: useCallback(goToSlide, []),
    closePresentation: useCallback(closePresentation, []),
    clearPresentation: useCallback(clearPresentation, []),
  }
}
