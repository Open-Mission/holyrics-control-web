import { useGetApiV1SchedulesCurrent } from "@/api/generated"
import { ServiceList } from "@/components/service/service-list"
import { RefreshCw, Music, Layers } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SurfaceCard, StatusChip } from "@/components/design-system"

export function RecentActivities() {
  const { data: scheduleItems, isLoading, isError, refetch } = useGetApiV1SchedulesCurrent()

  const scheduleResponse = scheduleItems?.data
  const scheduleData = Array.isArray(scheduleResponse) ? scheduleResponse[0] : scheduleResponse
  const mediaPlaylist = scheduleData?.media_playlist || []
  const hasItems = mediaPlaylist.length > 0

  return (
    <SurfaceCard className="flex h-full flex-col rounded-2xl border">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <CardTitle className="flex items-center gap-2.5 text-lg font-semibold tracking-tight">
            <div className="flex size-8 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <Layers className="size-4" />
            </div>
            Agenda de Hoje
          </CardTitle>
          <CardDescription>
            Itens de mídia preparados para apresentação no culto atual.
          </CardDescription>
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip tone="success">holyrics sincronizado</StatusChip>
            <Badge variant="secondary" className="rounded-full">
              {mediaPlaylist.length} mídias
            </Badge>
          </div>
        </div>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => refetch()}
          disabled={isLoading}
          className="rounded-xl"
        >
          <RefreshCw className={isLoading ? "animate-spin" : ""} />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : isError || !hasItems ? (
          <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
            <div className="flex size-20 items-center justify-center rounded-3xl border bg-muted/60">
              <Music className="size-10 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">Silêncio absoluto</p>
              <p className="text-xs text-muted-foreground">Nenhuma mídia agendada para o culto de hoje.</p>
            </div>
            <Button variant="outline" onClick={() => refetch()} size="sm" className="rounded-full">
              Verificar novamente
            </Button>
          </div>
        ) : (
          <div className="max-h-[620px] overflow-auto pr-2">
            <div className="mb-4 flex items-center gap-3 rounded-2xl border bg-muted/45 px-4 py-3">
              <div className="flex size-8 items-center justify-center rounded-xl border bg-background text-muted-foreground">
                <Layers className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">Fila de mídias</p>
                <p className="text-xs text-muted-foreground">
                  Imagens, vídeos, áudios e apresentações da programação atual.
                </p>
              </div>
            </div>

            <ServiceList items={mediaPlaylist} emptyMessage="Sem mídias" />
          </div>
        )}
      </CardContent>
    </SurfaceCard>
  )
}
