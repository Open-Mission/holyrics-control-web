/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Film, Music, RefreshCw, WifiOff } from "lucide-react";

import {
  useGetApiV1Schedules,
  useGetApiV1SchedulesCurrent,
  usePostApiV1SchedulesSet,
} from "@/api/generated";
import { ServiceList } from "@/components/service/service-list";
import { useSongsStore } from "@/hooks/use-songs-store";
import {
  AppPage,
  EmptyStateSection,
  MetricCard,
  PageHeader,
  SearchToolbar,
  SectionBlock,
  StatusChip,
  SurfaceCard,
  ToolbarRow,
} from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/service")({
  component: ServicePage,
});

function ServicePage() {
  const queryClient = useQueryClient();
  const now = useMemo(() => new Date(), []);
  const { songs } = useSongsStore();

  const {
    data: scheduleItems,
    isLoading,
    isError,
    refetch,
  } = useGetApiV1SchedulesCurrent();
  const { data: allSchedules, isError: allSchedulesError } =
    useGetApiV1Schedules({
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    });
  const { mutate: setSchedule, isPending: isSettingSchedule } =
    usePostApiV1SchedulesSet();

  const [search, setSearch] = useState("");

  const scheduleResponse = scheduleItems?.data;
  const scheduleData = Array.isArray(scheduleResponse)
    ? scheduleResponse[0]
    : scheduleResponse;
  const lyricsPlaylist = useMemo(
    () => scheduleData?.lyrics_playlist || [],
    [scheduleData?.lyrics_playlist],
  );
  const mediaPlaylist = useMemo(
    () => scheduleData?.media_playlist || [],
    [scheduleData?.media_playlist],
  );
  const currentScheduleValue = String(
    scheduleData?.id || scheduleData?.datetime || "",
  );
  const availableSchedules = allSchedules?.data || [];

  const handleScheduleChange = (id: string) => {
    setSchedule(
      { data: { event_id: id } },
      {
        onSuccess: () => {
          toast.success("Programação alterada com sucesso");
          queryClient.invalidateQueries({
            queryKey: ["/api/v1/schedules/current"],
          });
        },
        onError: () => {
          toast.error("Erro ao alterar programação");
        },
      },
    );
  };

  const filteredLyrics = useMemo(() => {
    if (!search.trim()) return lyricsPlaylist;
    const q = search.toLowerCase();
    return lyricsPlaylist.filter(
      (item: { name?: string; artist?: string }) =>
        item.name?.toLowerCase().includes(q) ||
        item.artist?.toLowerCase().includes(q),
    );
  }, [lyricsPlaylist, search]);

  const filteredMedia = useMemo(() => {
    if (!search.trim()) return mediaPlaylist;
    const q = search.toLowerCase();
    return mediaPlaylist.filter(
      (item: { name?: string; type?: string }) =>
        item.name?.toLowerCase().includes(q) ||
        item.type?.toLowerCase().includes(q),
    );
  }, [mediaPlaylist, search]);

  const songLookup = useMemo(
    () =>
      new Map(
        songs.map((song) => [song.id, song as { [key: string]: unknown }]),
      ),
    [songs],
  );

  const resultSummary = search ? (
    <Badge variant="secondary" className="rounded-full">
      {filteredLyrics.length + filteredMedia.length} resultado
      {filteredLyrics.length + filteredMedia.length !== 1 ? "s" : ""}
    </Badge>
  ) : (
    <span className="text-sm text-muted-foreground">
      Encontre rapidamente músicas, letras e mídias da programação atual.
    </span>
  );

  if (isLoading) {
    return (
      <AppPage narrow>
        <EmptyStateSection
          icon={RefreshCw}
          title="Carregando programação"
          description="Conectando ao Holyrics para buscar o evento e seus itens."
          className="min-h-[60vh]"
          action={<Spinner className="text-primary" />}
        />
      </AppPage>
    );
  }

  if (isError) {
    return (
      <AppPage narrow>
        <EmptyStateSection
          icon={WifiOff}
          title="Sem conexão com o Holyrics"
          description="Verifique se o servidor está acessível e tente novamente."
          className="min-h-[60vh]"
          action={
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw data-icon="inline-start" />
              Tentar novamente
            </Button>
          }
        />
      </AppPage>
    );
  }

  return (
    <AppPage>
      <PageHeader
        eyebrow="Programação"
        title="Serviço"
        description="Visualize a programação atual, troque o evento ativo e apresente letras ou mídias com menos ruído e mais contexto."
        actions={
          <>
            <StatusChip tone="success">ao vivo</StatusChip>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={isLoading ? "animate-spin" : ""} />
              Atualizar
            </Button>
          </>
        }
      />

      <ToolbarRow>
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip tone="neutral">
            {scheduleData?.datetime || "sem horário"}
          </StatusChip>
          <StatusChip tone="primary">{lyricsPlaylist.length} letras</StatusChip>
          <StatusChip tone="neutral">{mediaPlaylist.length} mídias</StatusChip>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip tone={isSettingSchedule ? "primary" : "success"}>
            {isSettingSchedule
              ? "alterando programação"
              : "pronto para apresentar"}
          </StatusChip>
        </div>
      </ToolbarRow>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Letras disponíveis"
          value={lyricsPlaylist.length}
          description="Inclui músicas, versos e blocos de texto da programação."
          icon={Music}
          tone="primary"
        />
        <MetricCard
          label="Mídias disponíveis"
          value={mediaPlaylist.length}
          description="Vídeos, imagens e outros itens de apoio prontos para uso."
          icon={Film}
        />
        <MetricCard
          label="Programações no mês"
          value={availableSchedules.length}
          description="Use a troca rápida para navegar entre eventos disponíveis."
          icon={CalendarClock}
        />
      </div>

      <SectionBlock
        title="Workspace do serviço"
        description="O conteúdo principal fica focado na apresentação, enquanto o resumo e a troca de programação permanecem acessíveis ao lado em telas maiores."
      >
        <div className="app-section-grid">
          <SurfaceCard className="gap-6 p-4 sm:p-6">
            <SearchToolbar
              value={search}
              onValueChange={setSearch}
              onClear={() => setSearch("")}
              placeholder="Buscar por nome, artista ou tipo..."
              resultLabel={resultSummary}
            />

            <Tabs defaultValue="lyrics" className="w-full gap-4">
              <TabsList className="w-full flex-wrap justify-start rounded-2xl border bg-muted/60 h-8 flex-1 gap-1">
                <TabsTrigger
                  value="lyrics"
                  className="flex-1 rounded-xl px-4 sm:flex-none"
                >
                  <Music data-icon="inline-start" />
                  Letras
                  <Badge
                    variant="secondary"
                    className="ml-1 min-w-6 justify-center rounded-full px-1.5"
                  >
                    {filteredLyrics.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="media"
                  className=" flex-1 rounded-xl px-4 sm:flex-none"
                >
                  <Film data-icon="inline-start" />
                  Mídias
                  <Badge
                    variant="secondary"
                    className="ml-1 min-w-6 justify-center rounded-full px-1.5"
                  >
                    {filteredMedia.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="lyrics" className="m-0 pt-2">
                <ServiceList
                  items={filteredLyrics}
                  emptyMessage={
                    search
                      ? `Nenhum resultado para "${search}".`
                      : "Nenhuma letra ou música na programação."
                  }
                  searchQuery={search}
                  songLookup={songLookup}
                  flatMode={!!search}
                />
              </TabsContent>

              <TabsContent value="media" className="m-0 pt-2">
                <ServiceList
                  items={filteredMedia}
                  emptyMessage={
                    search
                      ? `Nenhum resultado para "${search}".`
                      : "Nenhuma mídia na programação."
                  }
                  searchQuery={search}
                  songLookup={songLookup}
                  flatMode={!!search}
                />
              </TabsContent>
            </Tabs>
          </SurfaceCard>

          <div className="flex flex-col gap-4 xl:sticky xl:top-6 xl:self-start">
            <SurfaceCard className="gap-5 p-5 sm:p-6">
              <div className="flex flex-col gap-2">
                <span className="app-kicker">Programação ativa</span>
                <h2 className="text-lg font-semibold tracking-tight">
                  {scheduleData?.name || "Selecionar programação"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {scheduleData?.datetime ||
                    "Escolha um evento para atualizar o workspace."}
                </p>
              </div>

              <Select
                value={currentScheduleValue}
                onValueChange={handleScheduleChange}
                disabled={isSettingSchedule}
              >
                <SelectTrigger className="h-auto w-full rounded-2xl border bg-background px-4 py-3.5 shadow-none">
                  <div className="flex min-w-0 flex-col items-start gap-1 text-left">
                    <span className="truncate font-semibold">
                      {scheduleData?.name ||
                        `Culto - ${scheduleData?.datetime?.split(" ")?.[0] || "Sem data"}`}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {isSettingSchedule
                        ? "Alterando programação..."
                        : "Toque para trocar o evento"}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent
                  align="start"
                  position="popper"
                  className="rounded-2xl border-border/60 bg-popover/95 backdrop-blur-xl"
                >
                  <SelectGroup>
                    <SelectLabel>Programações disponíveis</SelectLabel>

                    {!allSchedules?.data && !allSchedulesError && (
                      <div className="flex items-center justify-center py-6">
                        <Spinner className="size-4 text-primary" />
                      </div>
                    )}

                    {allSchedulesError && (
                      <p className="px-3 py-4 text-center text-xs text-destructive">
                        Erro ao carregar programações.
                      </p>
                    )}

                    {availableSchedules.map((schedule) => {
                      const value = String(
                        schedule.id || schedule.datetime || "",
                      );
                      const label =
                        schedule.name ||
                        `Culto - ${schedule.datetime?.split(" ")?.[0] || "Sem data"}`;

                      return (
                        <SelectItem
                          key={value}
                          value={value}
                          className="rounded-xl py-2.5"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium">{label}</span>
                            <span className="text-xs text-muted-foreground">
                              {schedule.datetime}
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}

                    {availableSchedules.length === 0 && allSchedules?.data && (
                      <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                        Nenhuma programação encontrada.
                      </p>
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </SurfaceCard>

            <SurfaceCard className="gap-4 p-5 sm:p-6">
              <div className="flex flex-col gap-1">
                <span className="app-kicker">Resumo rápido</span>
                <h2 className="text-base font-semibold tracking-tight">
                  Leitura mais objetiva
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-2xl border bg-background px-4 py-3">
                  <p className="text-sm font-medium">Pesquisa unificada</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Um único campo encontra letras, artistas, tipos e mídias sem
                    trocar de contexto.
                  </p>
                </div>
                <div className="rounded-2xl border bg-background px-4 py-3">
                  <p className="text-sm font-medium">Foco na ação principal</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Itens ativos ficam evidentes e as ações de apresentação
                    aparecem com menos ruído.
                  </p>
                </div>
              </div>
            </SurfaceCard>
          </div>
        </div>
      </SectionBlock>
    </AppPage>
  );
}
