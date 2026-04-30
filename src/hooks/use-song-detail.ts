/**
 * useSongDetail — IDB-first hook para detalhes completos de uma música.
 *
 * Fluxo:
 * 1. Lê `song_details` store do IndexedDB.
 * 2. Se não tiver slides (ou registro ausente), busca da API e salva no IDB.
 * 3. Expõe `updateDetail()` para edições locais — marca o registro como dirty.
 * 4. Expõe `markSynced()` para limpar o flag dirty após enviar ao Holyrics.
 */
import { useState, useEffect, useCallback } from 'react'
import { getApiV1SongsId } from '@/lib/holyrics'
import {
  dbGetSongDetail,
  dbPutSongDetail,
  dbUpdateSongDetailFields,
  dbMarkSongDetailClean,
  type SongDetailRecord,
  type LyricSlide,
} from './use-songs-store'

export type { SongDetailRecord, LyricSlide }

export type DetailLoadState = 'idle' | 'loading-cache' | 'loading-api' | 'ready' | 'error'

export interface UseSongDetailReturn {
  detail: SongDetailRecord | null
  loadState: DetailLoadState
  /** true while we're fetching slides from the server (not from cache) */
  isFetchingFromApi: boolean
  /** Whether local edits haven't been pushed to Holyrics */
  isDirty: boolean
  dirtyFields: string[]
  /** Update one or more fields locally and mark as dirty */
  updateDetail: (updates: Partial<SongDetailRecord>, fields: string[]) => Promise<void>
  /** Clear the dirty flag (call after successfully pushing to Holyrics) */
  markSynced: () => Promise<void>
  /** Re-fetch from API and overwrite IDB (manual refresh) */
  refetchFromApi: () => Promise<void>
}

export function useSongDetail(songId: string | null | undefined): UseSongDetailReturn {
  const [detail, setDetail] = useState<SongDetailRecord | null>(null)
  const [loadState, setLoadState] = useState<DetailLoadState>('idle')
  const [isFetchingFromApi, setIsFetchingFromApi] = useState(false)

  // ─── Fetch from API and save to IDB ────────────────────────────────────────

  const fetchAndSave = useCallback(
    async (id: string, existingRecord?: SongDetailRecord): Promise<SongDetailRecord | null> => {
      setIsFetchingFromApi(true)
      try {
        const response = await getApiV1SongsId(id)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = response as any
        const data = raw?.data?.data ?? raw?.data ?? raw

        if (!data?.id) throw new Error('Resposta inválida da API')

        const record: SongDetailRecord = {
          ...data,
          // Preserve existing local edits/dirty state if re-fetching
          _dirty: existingRecord?._dirty ?? false,
          _dirtyFields: existingRecord?._dirtyFields ?? [],
          _fetchedAt: new Date().toISOString(),
        }

        await dbPutSongDetail(record)
        return record
      } finally {
        setIsFetchingFromApi(false)
      }
    },
    []
  )

  // ─── Load detail (IDB-first, then API if no slides) ────────────────────────

  useEffect(() => {
    if (!songId) {
      setDetail(null)
      setLoadState('idle')
      return
    }

    let cancelled = false

    async function load() {
      setLoadState('loading-cache')
      setDetail(null)

      try {
        // 1. Try IDB first
        const cached = await dbGetSongDetail(songId!)

        if (cancelled) return

        if (cached) {
          // We have something cached — use it immediately
          setDetail(cached)
          setLoadState('ready')

          // If slides are missing, fetch from API in the background
          const hasSlides = Array.isArray(cached.slides) && cached.slides.length > 0
          if (!hasSlides) {
            const fresh = await fetchAndSave(songId!, cached)
            if (!cancelled && fresh) {
              setDetail(fresh)
            }
          }
        } else {
          // 2. Nothing in IDB — fetch from API
          setLoadState('loading-api')
          const fresh = await fetchAndSave(songId!)
          if (!cancelled) {
            setDetail(fresh)
            setLoadState(fresh ? 'ready' : 'error')
          }
        }
      } catch (err) {
        console.error('[useSongDetail] Load failed:', err)
        if (!cancelled) setLoadState('error')
      }
    }

    load()
    return () => { cancelled = true }
  }, [songId, fetchAndSave])

  // ─── Actions ───────────────────────────────────────────────────────────────

  const updateDetail = useCallback(
    async (updates: Partial<SongDetailRecord>, fields: string[]) => {
      if (!songId) return
      const updated = await dbUpdateSongDetailFields(songId, updates, fields)
      if (updated) setDetail(updated)
    },
    [songId]
  )

  const markSynced = useCallback(async () => {
    if (!songId) return
    await dbMarkSongDetailClean(songId)
    setDetail((prev) => (prev ? { ...prev, _dirty: false, _dirtyFields: [] } : prev))
  }, [songId])

  const refetchFromApi = useCallback(async () => {
    if (!songId) return
    const fresh = await fetchAndSave(songId, detail ?? undefined)
    if (fresh) setDetail(fresh)
  }, [songId, detail, fetchAndSave])

  return {
    detail,
    loadState,
    isFetchingFromApi,
    isDirty: detail?._dirty ?? false,
    dirtyFields: detail?._dirtyFields ?? [],
    updateDetail,
    markSynced,
    refetchFromApi,
  }
}
