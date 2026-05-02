/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import {
  RefreshCwIcon,
  SearchIcon,
  AlertCircleIcon,
  DatabaseIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSongsStore, type Song } from "@/hooks/use-songs-store";
import { openPanelForSong } from "@/hooks/use-presentation-store";
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

// Extracted components
import { SongsList } from "@/components/songs/songs-list";
import {
  SongsPagination,
  type PageSize,
} from "@/components/songs/songs-pagination";

export const Route = createFileRoute("/songs")({
  component: SongsPage,
});

// ─── Page ─────────────────────────────────────────────────────────────────────

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

function SongsPage() {
  const {
    songs,
    totalCount,
    lastSyncedAt,
    isSyncing,
    isLoading,
    syncError,
    hasSongs,
    syncSongs,
  } = useSongsStore();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(25);

  const handleSongClick = useCallback((song: Song) => {
    openPanelForSong(song);
  }, []);

  // Reset to page 1 whenever search or pageSize changes
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handlePageSizeChange = (val: PageSize) => {
    setPageSize(val);
    setPage(1);
  };

  // Client-side filter
  const filtered = useMemo(() => {
    if (!search.trim()) return songs;
    const q = search.toLowerCase();
    return songs.filter(
      (s) =>
        s.title?.toLowerCase().includes(q) ||
        s.artist?.toLowerCase().includes(q) ||
        s.author?.toLowerCase().includes(q) ||
        s.group?.toLowerCase().includes(q),
    );
  }, [songs, search]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize],
  );

  const handleRefresh = async () => {
    try {
      const result = await syncSongs();
      toast.success(`${result.length} músicas atualizadas!`);
    } catch {
      toast.error("Erro ao buscar músicas do servidor.");
    }
  };

  const clearSearch = useCallback(() => {
    setSearch("");
    setPage(1);
  }, []);

  return (
    <AppPage>
      <PageHeader
        eyebrow="Biblioteca"
        title="Músicas"
        description="Biblioteca completa sincronizada localmente para busca rápida, navegação por contexto e abertura imediata do painel de apresentação."
        meta={
          <>
            <StatusChip tone="neutral">
              {isLoading ? "carregando" : `${totalCount} músicas`}
            </StatusChip>
            <StatusChip tone="primary">
              {isSyncing ? "sincronizando" : formatSyncDate(lastSyncedAt)}
            </StatusChip>
          </>
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isSyncing || isLoading}
              className="gap-2 shrink-0"
              id="btn-refresh-songs"
            >
              <RefreshCwIcon className={isSyncing ? "animate-spin" : ""} />
              {isSyncing ? "Atualizando…" : "Atualizar do Servidor"}
            </Button>
          </>
        }
      />

      <SearchToolbar
        value={search}
        onValueChange={handleSearchChange}
        onClear={clearSearch}
        placeholder="Buscar por título, artista ou grupo…"
        resultLabel={
          search && !isLoading ? (
            <Badge variant="secondary" className="rounded-full">
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">
              Busca instantânea sobre o banco local.
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
          <RefreshCwIcon className="size-8 animate-spin opacity-40" />
          <p className="text-sm">Carregando músicas…</p>
        </div>
      )}

      {!isLoading && !hasSongs && !isSyncing && (
        <EmptyStateSection
          icon={DatabaseIcon}
          title="Nenhuma música salva"
          description="As músicas ainda não foram sincronizadas. Atualize agora para buscar o catálogo do Holyrics e armazenar tudo localmente."
          action={
            <Button onClick={handleRefresh} id="btn-empty-sync-songs">
              <RefreshCwIcon data-icon="inline-start" />
              Sincronizar músicas
            </Button>
          }
        />
      )}

      {!isLoading && hasSongs && filtered.length === 0 && search && (
        <EmptyStateSection
          icon={SearchIcon}
          title="Nenhuma música encontrada"
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

      {!isLoading && hasSongs && filtered.length > 0 && (
        <SectionBlock
          title="Resultados"
          description="Toque em uma música para abrir o painel lateral com detalhes e ações de apresentação."
        >
          <SongsList
            songs={paginated}
            isSyncing={isSyncing}
            onSongClick={handleSongClick}
          />
          <SongsPagination
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
