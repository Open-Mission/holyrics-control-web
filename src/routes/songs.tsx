import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo, useRef, useCallback } from 'react'
import {
  Music2Icon,
  RefreshCwIcon,
  SearchIcon,
  XIcon,
  ListMusicIcon,
  ClockIcon,
  AlertCircleIcon,
  DatabaseIcon,
  WifiOffIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  LoaderIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useSongsStore, type Song } from '@/hooks/use-songs-store'
import { openPanelForSong } from '@/hooks/use-presentation-store'

export const Route = createFileRoute('/songs')({
  component: SongsPage,
})

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSyncDate(isoDate: string | null): string {
  if (!isoDate) return 'Nunca sincronizado'
  const date = new Date(isoDate)
  const now = new Date()
  const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000)
  if (diffMin < 1) return 'Agora mesmo'
  if (diffMin < 60) return `Há ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `Há ${diffH}h`
  return `Há ${Math.floor(diffH / 24)}d`
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function SongsPage() {
  const { songs, totalCount, lastSyncedAt, isSyncing, isLoading, syncError, hasSongs, syncSongs } =
    useSongsStore()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>(50)
  const searchRef = useRef<HTMLInputElement>(null)
  const handleSongClick = useCallback((song: Song) => {
    openPanelForSong(song)
  }, [])

  // Reset to page 1 whenever search or pageSize changes
  const handleSearchChange = (val: string) => {
    setSearch(val)
    setPage(1)
  }

  const handlePageSizeChange = (val: PageSize) => {
    setPageSize(val)
    setPage(1)
  }

  // Client-side filter
  const filtered = useMemo(() => {
    if (!search.trim()) return songs
    const q = search.toLowerCase()
    return songs.filter(
      (s) =>
        s.title?.toLowerCase().includes(q) ||
        s.artist?.toLowerCase().includes(q) ||
        s.author?.toLowerCase().includes(q) ||
        s.group?.toLowerCase().includes(q)
    )
  }, [songs, search])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  )

  const handleRefresh = async () => {
    try {
      const result = await syncSongs()
      toast.success(`${result.length} músicas atualizadas!`)
    } catch {
      toast.error('Erro ao buscar músicas do servidor.')
    }
  }

  const clearSearch = useCallback(() => {
    setSearch('')
    setPage(1)
    searchRef.current?.focus()
  }, [])

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto w-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-4xl font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
          Músicas
        </h1>
        <p className="text-muted-foreground font-medium">
          Biblioteca completa de músicas sincronizada localmente.
        </p>
      </div>

      {/* Stats + controls bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Pill icon={<DatabaseIcon className="size-3" />}>
            {isLoading ? '…' : `${totalCount} músicas`}
          </Pill>
          <Pill icon={<ClockIcon className="size-3" />}>{formatSyncDate(lastSyncedAt)}</Pill>
          {search && !isLoading && (
            <Pill icon={<SearchIcon className="size-3" />} highlight>
              {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
            </Pill>
          )}
        </div>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isSyncing || isLoading}
          className="gap-2 shrink-0 shadow-sm"
          id="btn-refresh-songs"
        >
          <RefreshCwIcon className={`size-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Atualizando…' : 'Atualizar do Servidor'}
        </Button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <input
          ref={searchRef}
          id="songs-search"
          type="text"
          placeholder="Buscar por título, artista ou grupo…"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full h-11 pl-10 pr-10 rounded-xl border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200"
        />
        {search && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <XIcon className="size-4" />
          </button>
        )}
      </div>

      {/* Error */}
      {syncError && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-sm">
          <AlertCircleIcon className="size-4 shrink-0" />
          <div>
            <p className="font-semibold">Erro ao sincronizar</p>
            <p className="text-xs opacity-80 mt-0.5">{syncError}</p>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-muted-foreground">
          <LoaderIcon className="size-8 animate-spin opacity-40" />
          <p className="text-sm">Carregando músicas…</p>
        </div>
      )}

      {/* Empty — not synced yet */}
      {!isLoading && !hasSongs && !isSyncing && <EmptyState onSync={handleRefresh} />}

      {/* Empty search result */}
      {!isLoading && hasSongs && filtered.length === 0 && search && (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div className="size-16 rounded-2xl bg-muted flex items-center justify-center">
            <SearchIcon className="size-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-bold text-lg">Nenhuma música encontrada</p>
            <p className="text-sm text-muted-foreground mt-1">
              Nenhum resultado para <span className="font-semibold">"{search}"</span>
            </p>
          </div>
          <Button variant="outline" onClick={clearSearch} size="sm">
            Limpar busca
          </Button>
        </div>
      )}

      {/* Songs list + pagination */}
      {!isLoading && hasSongs && filtered.length > 0 && (
        <>
          <SongsList songs={paginated} isSyncing={isSyncing} onSongClick={handleSongClick} />
          <Pagination
            page={safePage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
        </>
      )}

    </div>
  )
}

// ─── Pill badge ───────────────────────────────────────────────────────────────

function Pill({
  icon,
  children,
  highlight,
}: {
  icon: React.ReactNode
  children: React.ReactNode
  highlight?: boolean
}) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border ${highlight
          ? 'bg-primary/10 border-primary/20 text-primary'
          : 'bg-muted/60 text-muted-foreground'
        }`}
    >
      {icon}
      {children}
    </div>
  )
}

// ─── Songs list ───────────────────────────────────────────────────────────────

function SongsList({
  songs,
  isSyncing,
  onSongClick,
}: {
  songs: Song[]
  isSyncing: boolean
  onSongClick: (song: Song) => void
}) {
  return (
    <div className="grid gap-1.5">
      {/* Table header */}
      <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[2fr_1fr_auto] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        <span>Título / Artista</span>
        <span className="hidden sm:block">Grupo</span>
        <span />
      </div>

      <div className={`flex flex-col gap-1 transition-opacity duration-300 ${isSyncing ? 'opacity-50' : ''}`}>
        {songs.map((song, idx) => (
          <SongRow key={song.id ?? idx} song={song} onClick={() => onSongClick(song)} />
        ))}
      </div>
    </div>
  )
}

// ─── Song row ─────────────────────────────────────────────────────────────────

function SongRow({ song, onClick }: { song: Song; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group w-full grid grid-cols-[1fr_auto] sm:grid-cols-[2fr_1fr_auto] items-center gap-4 px-4 py-3.5 rounded-xl border bg-card hover:bg-accent/50 hover:border-primary/30 hover:shadow-sm active:scale-[0.995] transition-all duration-150 cursor-pointer text-left"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0 size-8 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center">
          <Music2Icon className="size-3.5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{song.title || 'Sem título'}</p>
          {(song.artist || song.author) && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {song.artist || song.author}
            </p>
          )}
        </div>
      </div>

      <div className="hidden sm:block min-w-0">
        {song.group ? (
          <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wide bg-muted/80 text-muted-foreground px-2.5 py-1 rounded-full border truncate max-w-[140px]">
            {song.group}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        )}
      </div>

      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <ListMusicIcon className="size-3.5 text-muted-foreground" />
      </div>
    </button>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

interface PaginationProps {
  page: number
  totalPages: number
  totalItems: number
  pageSize: PageSize
  onPageChange: (p: number) => void
  onPageSizeChange: (ps: PageSize) => void
}

function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalItems)

  // Build page number buttons (max 5 visible)
  const getPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const range: (number | '…')[] = []
    const delta = 2
    const left = Math.max(2, page - delta)
    const right = Math.min(totalPages - 1, page + delta)

    range.push(1)
    if (left > 2) range.push('…')
    for (let i = left; i <= right; i++) range.push(i)
    if (right < totalPages - 1) range.push('…')
    range.push(totalPages)
    return range
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t">
      {/* Info + page size */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>
          Mostrando <span className="font-semibold text-foreground">{from}–{to}</span> de{' '}
          <span className="font-semibold text-foreground">{totalItems}</span>
        </span>
        <span className="text-border">|</span>
        <span className="flex items-center gap-1.5">
          Por página:
          <div className="flex items-center gap-1">
            {PAGE_SIZE_OPTIONS.map((size) => (
              <button
                key={size}
                onClick={() => onPageSizeChange(size)}
                className={`px-2 py-0.5 rounded-md text-xs font-semibold transition-colors ${pageSize === size
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-muted-foreground'
                  }`}
              >
                {size}
              </button>
            ))}
          </div>
        </span>
      </div>

      {/* Page controls */}
      <div className="flex items-center gap-1">
        <IconButton
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          title="Primeira página"
        >
          <ChevronsLeftIcon className="size-3.5" />
        </IconButton>
        <IconButton
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          title="Página anterior"
        >
          <ChevronLeftIcon className="size-3.5" />
        </IconButton>

        {getPages().map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted-foreground select-none">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`size-8 rounded-lg text-xs font-semibold transition-colors ${p === page
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'hover:bg-muted text-muted-foreground'
                }`}
            >
              {p}
            </button>
          )
        )}

        <IconButton
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          title="Próxima página"
        >
          <ChevronRightIcon className="size-3.5" />
        </IconButton>
        <IconButton
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          title="Última página"
        >
          <ChevronsRightIcon className="size-3.5" />
        </IconButton>
      </div>
    </div>
  )
}

function IconButton({
  children,
  disabled,
  onClick,
  title,
}: {
  children: React.ReactNode
  disabled?: boolean
  onClick: () => void
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
    >
      {children}
    </button>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onSync }: { onSync: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
      <div className="relative">
        <div className="size-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
          <Music2Icon className="size-9 text-primary/70" />
        </div>
        <div className="absolute -bottom-1 -right-1 size-7 rounded-xl bg-muted border flex items-center justify-center">
          <WifiOffIcon className="size-3.5 text-muted-foreground" />
        </div>
      </div>
      <div>
        <h3 className="text-xl font-bold tracking-tight">Nenhuma música salva</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs leading-relaxed">
          As músicas ainda não foram sincronizadas. Clique em <strong>Atualizar</strong> para
          buscar todas as músicas do Holyrics e salvá-las localmente.
        </p>
      </div>
      <Button onClick={onSync} className="gap-2 shadow-md" id="btn-empty-sync-songs">
        <RefreshCwIcon className="size-4" />
        Sincronizar Músicas Agora
      </Button>
    </div>
  )
}
