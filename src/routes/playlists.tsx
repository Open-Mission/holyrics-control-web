import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo, useCallback } from 'react'
import {
  ListMusicIcon,
  RefreshCwIcon,
  SearchIcon,
  ClockIcon,
  AlertCircleIcon,
  DatabaseIcon,
  LoaderIcon,
  PlayIcon,
  MoreVerticalIcon,
  ExternalLinkIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { usePlaylistsStore, type Playlist } from '@/hooks/use-playlists-store'
import { postApiV1PlaylistsLoad } from '@/api/generated'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AppPage, EmptyStateSection, PageHeader, SearchToolbar, SectionBlock, StatusChip, ToolbarRow } from '@/components/design-system'

export const Route = createFileRoute('/playlists')({
  component: PlaylistsPage,
})

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

function PlaylistsPage() {
  const { playlists, totalCount, lastSyncedAt, isSyncing, isLoading, syncError, hasPlaylists, syncPlaylists } =
    usePlaylistsStore()

  const [search, setSearch] = useState('')
  const [loadingPlaylist, setLoadingPlaylist] = useState<string | null>(null)

  const handleRefresh = async () => {
    try {
      const result = await syncPlaylists()
      toast.success(`${result.length} playlists atualizadas!`)
    } catch {
      toast.error('Erro ao buscar playlists do servidor.')
    }
  }

  const handleLoadPlaylist = async (playlist: Playlist) => {
    setLoadingPlaylist(playlist.name)
    try {
      await postApiV1PlaylistsLoad({ name: playlist.name })
      toast.success(`Playlist "${playlist.name}" carregada no Holyrics!`)
    } catch (err) {
      toast.error('Erro ao carregar playlist.')
      console.error(err)
    } finally {
      setLoadingPlaylist(null)
    }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return playlists
    const q = search.toLowerCase()
    return playlists.filter((p) => p.name.toLowerCase().includes(q))
  }, [playlists, search])

  const clearSearch = useCallback(() => {
    setSearch('')
  }, [])

  return (
    <AppPage narrow>
      <PageHeader
        eyebrow="Coleções"
        title="Playlists"
        description="Listas de reprodução salvas no Holyrics para acesso rápido, com foco em busca simples e ações imediatas de carregamento."
        actions={
          <>
            <StatusChip tone="neutral">{isLoading ? 'carregando' : `${totalCount} playlists`}</StatusChip>
            <StatusChip tone="primary">{formatSyncDate(lastSyncedAt)}</StatusChip>
          </>
        }
      />

      <ToolbarRow>
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip tone="neutral">
            <DatabaseIcon data-icon="inline-start" />
            biblioteca local
          </StatusChip>
          <StatusChip tone={isSyncing ? 'primary' : 'success'}>
            <ClockIcon data-icon="inline-start" />
            {isSyncing ? 'sincronizando' : 'pronto'}
          </StatusChip>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isSyncing || isLoading}
          className="gap-2 shrink-0"
          id="btn-refresh-playlists"
        >
          <RefreshCwIcon className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Atualizando…' : 'Atualizar do Servidor'}
        </Button>
      </ToolbarRow>

      <SearchToolbar
        value={search}
        onValueChange={setSearch}
        onClear={clearSearch}
        placeholder="Buscar playlists por nome…"
        resultLabel={
          search && !isLoading ? (
            <Badge variant="secondary" className="rounded-full">
              {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">Busque dentro das playlists já sincronizadas.</span>
          )
        }
      />

      {syncError && (
        <Alert variant="destructive" className="rounded-2xl border">
          <AlertCircleIcon />
          <AlertTitle>Erro ao sincronizar</AlertTitle>
          <AlertDescription>{syncError}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-muted-foreground">
          <LoaderIcon className="size-8 animate-spin opacity-40" />
          <p className="text-sm">Carregando playlists…</p>
        </div>
      )}

      {!isLoading && !hasPlaylists && !isSyncing && (
        <EmptyStateSection
          icon={ListMusicIcon}
          title="Nenhuma playlist salva"
          description="As listas de reprodução ainda não foram sincronizadas. Atualize agora para buscar as playlists do Holyrics e armazená-las localmente."
          action={
            <Button onClick={handleRefresh} id="btn-empty-sync-playlists">
              <RefreshCwIcon data-icon="inline-start" />
              Sincronizar playlists
            </Button>
          }
        />
      )}

      {!isLoading && hasPlaylists && filtered.length === 0 && search && (
        <EmptyStateSection
          icon={SearchIcon}
          title="Nenhuma playlist encontrada"
          description={<>Nenhum resultado para <strong>{search}</strong>.</>}
          action={
            <Button variant="outline" onClick={clearSearch} size="sm">
              Limpar busca
            </Button>
          }
        />
      )}

      {!isLoading && hasPlaylists && filtered.length > 0 && (
        <SectionBlock title="Playlists disponíveis" description="Cada card prioriza a ação principal sem abandonar o menu contextual.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((playlist) => (
              <PlaylistCard
                key={playlist.name}
                playlist={playlist}
                isLoading={loadingPlaylist === playlist.name}
                onLoad={() => handleLoadPlaylist(playlist)}
              />
            ))}
          </div>
        </SectionBlock>
      )}
    </AppPage>
  )
}

// ─── Playlist Card ────────────────────────────────────────────────────────────

function PlaylistCard({
  playlist,
  isLoading,
  onLoad,
}: {
  playlist: Playlist
  isLoading: boolean
  onLoad: () => void
}) {
  return (
    <div className="group relative flex flex-col gap-4 rounded-2xl border app-surface p-5 transition-all duration-300 hover:border-primary/20 hover:bg-accent/5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10">
          <ListMusicIcon className="size-5 text-primary" />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 rounded-lg opacity-0 transition-opacity group-hover:opacity-100">
              <MoreVerticalIcon className="size-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem className="gap-2" onClick={onLoad}>
              <PlayIcon className="size-3.5" />
              Carregar agora
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2">
              <ExternalLinkIcon className="size-3.5" />
              Ver detalhes
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-lg leading-tight truncate group-hover:text-primary transition-colors">
          {playlist.name}
        </h3>
        <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
          <ClockIcon className="size-3" />
          Lista salva no Holyrics
        </p>
      </div>

      <Button
        onClick={onLoad}
        disabled={isLoading}
        className="h-10 w-full gap-2 rounded-xl"
      >
        {isLoading ? (
          <LoaderIcon className="size-4 animate-spin" />
        ) : (
          <PlayIcon className="size-3.5 fill-current" />
        )}
        Carregar Playlist
      </Button>
    </div>
  )
}
