import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import {
  ListMusicIcon,
  RefreshCwIcon,
  SearchIcon,
  AlertCircleIcon,
  LoaderIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { usePlaylistsStore, type Playlist } from "@/hooks/use-playlists-store";
import { loadSavedPlaylist } from "@/api/holyrics";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  AppPage,
  EmptyStateSection,
  PageHeader,
  SearchToolbar,
  SectionBlock,
  StatusChip,
} from "@/components/design-system";
import { PlaylistsGrid } from "@/components/playlists/playlists-grid";
import {
  PlaylistsPagination,
  type PageSize,
} from "@/components/playlists/playlists-pagination";

export const Route = createFileRoute("/playlists")({
  component: PlaylistsPage,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSyncDate(isoDate: string | null): string {
  if (!isoDate) return "Nunca sincronizado";
  const date = new Date(isoDate);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (diffMin < 1) return "Agora mesmo";
  if (diffMin < 60) return `Há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Há ${diffH}h`;
  return `Há ${Math.floor(diffH / 24)}d`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
function PlaylistsPage() {
  const {
    playlists,
    totalCount,
    lastSyncedAt,
    isSyncing,
    isLoading,
    syncError,
    hasPlaylists,
    syncPlaylists,
  } = usePlaylistsStore();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(50);
  const [loadingPlaylist, setLoadingPlaylist] = useState<string | null>(null);

  const handleRefresh = async () => {
    try {
      const result = await syncPlaylists();
      toast.success(`${result.length} playlists atualizadas!`);
    } catch {
      toast.error("Erro ao buscar playlists do servidor.");
    }
  };

  const handleLoadPlaylist = async (playlist: Playlist) => {
    setLoadingPlaylist(playlist.name);
    try {
      await loadSavedPlaylist(playlist.name);
      toast.success(`Playlist "${playlist.name}" carregada no Holyrics!`);
    } catch (err) {
      toast.error("Erro ao carregar playlist.");
      console.error(err);
    } finally {
      setLoadingPlaylist(null);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return playlists;
    const q = search.toLowerCase();
    return playlists.filter((p) => p.name.toLowerCase().includes(q));
  }, [playlists, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize],
  );

  const clearSearch = useCallback(() => {
    setSearch("");
    setPage(1);
  }, []);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handlePageSizeChange = (value: PageSize) => {
    setPageSize(value);
    setPage(1);
  };

  return (
    <AppPage>
      <PageHeader
        eyebrow="Coleções"
        title="Playlists"
        description="Listas de reprodução salvas no Holyrics para acesso rápido, com foco em busca simples e ações imediatas de carregamento."
        meta={
          <>
            <StatusChip tone="neutral">
              {isLoading ? "carregando" : `${totalCount} playlists`}
            </StatusChip>
            <StatusChip tone="primary">
              {isSyncing ? "sincronizando" : formatSyncDate(lastSyncedAt)}
            </StatusChip>
          </>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isSyncing || isLoading}
            className="gap-2 shrink-0"
            id="btn-refresh-playlists"
          >
            <RefreshCwIcon className={isSyncing ? "animate-spin" : ""} />
            {isSyncing ? "Atualizando…" : "Atualizar do Servidor"}
          </Button>
        }
      />

      <SearchToolbar
        value={search}
        onValueChange={handleSearchChange}
        onClear={clearSearch}
        placeholder="Buscar playlists por nome…"
        resultLabel={
          search && !isLoading ? (
            <Badge variant="secondary" className="rounded-full mt-3">
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground mt-2">
              Busque dentro das playlists já sincronizadas.
            </span>
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
          description={
            <>
              Nenhum resultado para <strong>{search}</strong>.
            </>
          }
          action={
            <Button variant="outline" onClick={clearSearch} size="sm">
              Limpar busca
            </Button>
          }
        />
      )}

      {!isLoading && hasPlaylists && filtered.length > 0 && (
        <SectionBlock>
          <PlaylistsGrid
            playlists={paginated}
            loadingPlaylist={loadingPlaylist}
            onLoadPlaylist={handleLoadPlaylist}
          />
          <PlaylistsPagination
            page={safePage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
        </SectionBlock>
      )}
    </AppPage>
  );
}
