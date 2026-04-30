/**
 * SongDetailPanel — Sheet (desktop) / Drawer (mobile) para detalhes de música
 *
 * - Sheet permanece aberto até o usuário fechar explicitamente
 * - Slides interativos com Optimistic UI (fundo verde no slide ativo)
 * - Integração com usePresentationStore para estado global de apresentação
 */
import { useState } from 'react'
import {
  PencilIcon,
  XIcon,
  Music2Icon,
  MicVocalIcon,
  TagIcon,
  KeyRoundIcon,
  GaugeIcon,
  LanguagesIcon,
  FileTextIcon,
  LoaderIcon,
  MonitorPlayIcon,
  ChevronRightIcon,
  ListMusicIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
  CheckCircle2Icon,
  CloudOffIcon,
  UserIcon,
  PlayIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-mobile'
import { useSongDetail, type LyricSlide } from '@/hooks/use-song-detail'
import {
  usePresentationStore,
  startPresentation,
  goToSlide,
} from '@/hooks/use-presentation-store'
import type { Song } from '@/hooks/use-songs-store'
import { cn } from '@/lib/utils'

// ─── Main component ───────────────────────────────────────────────────────────

interface SongDetailPanelProps {
  song: Song | null
  open: boolean
  onClose: () => void
}

export function SongDetailPanel({ song, open, onClose }: SongDetailPanelProps) {
  const isMobile = useIsMobile()

  const content = song ? (
    <SongDetailContent song={song} onClose={onClose} />
  ) : null

  if (isMobile) {
    return (
      <Drawer
        open={open}
        onOpenChange={(v) => !v && onClose()}
        direction="bottom"
      >
        <DrawerContent className="max-h-[92dvh] flex flex-col">
          <DrawerTitle className="sr-only">{song?.title ?? 'Detalhes da Música'}</DrawerTitle>
          {content}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full sm:!max-w-[50vw] sm:min-w-96 p-0 flex flex-col gap-0"
      >
        <SheetTitle className="sr-only">{song?.title ?? 'Detalhes da Música'}</SheetTitle>
        {content}
      </SheetContent>
    </Sheet>
  )
}

// ─── Inner content ────────────────────────────────────────────────────────────

function SongDetailContent({ song, onClose }: { song: Song; onClose: () => void }) {
  const {
    detail,
    loadState,
    isFetchingFromApi,
    isDirty,
    dirtyFields,
    markSynced,
    refetchFromApi,
  } = useSongDetail(song.id)

  const { song: presentingSong, activeIndex, isStarting, isNavigating } =
    usePresentationStore()

  const [activeTab, setActiveTab] = useState('info')

  const displaySong = detail ?? song
  const slides = detail?.slides ?? []
  const isLoadingAny = loadState === 'loading-cache' || loadState === 'loading-api'

  // Is this song the one currently being presented?
  const isPresentingThisSong = presentingSong?.id === song.id

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handlePresent = async () => {
    if (!song?.id) return
    try {
      // Does NOT close the panel — user stays in control
      await startPresentation(song, slides, 0)
      toast.success(`"${song.title}" iniciado!`, { duration: 2000 })
      // Switch to slides tab so user sees the active indicator
      setActiveTab('slides')
    } catch {
      toast.error('Erro ao apresentar. Verifique a conexão com o Holyrics.')
    }
  }

  const handleSlideClick = async (index: number) => {
    if (isNavigating) return
    if (!isPresentingThisSong) {
      // First click starts the presentation at this slide
      try {
        await startPresentation(song, slides, index, { respectInitialSlide: false })
        toast.success(`Iniciado no slide ${index + 1}`, { duration: 2000 })
      } catch {
        toast.error('Erro ao iniciar apresentação')
      }
      return
    }
    try {
      await goToSlide(index)
    } catch {
      toast.error('Erro ao navegar no slide')
    }
  }

  const handleRefresh = async () => {
    try {
      await refetchFromApi()
      toast.success('Detalhes atualizados.')
    } catch {
      toast.error('Erro ao buscar detalhes.')
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-background/80 backdrop-blur-sm shrink-0">
        <div className="flex-shrink-0 size-9 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center">
          <Music2Icon className="size-4 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate leading-tight">
            {displaySong?.title ?? song.title}
          </p>
          {(displaySong?.artist || displaySong?.author) && (
            <p className="text-xs text-muted-foreground truncate">
              {displaySong?.artist ?? displaySong?.author}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-8 text-xs"
            onClick={() => toast.info('Edição em breve!')}
            id={`btn-edit-song-${song.id}`}
          >
            <PencilIcon className="size-3.5" />
            <span className="hidden sm:inline">Editar</span>
          </Button>

          <Button
            size="sm"
            className={cn(
              'gap-1.5 h-8 text-xs',
              isPresentingThisSong &&
                'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
            )}
            onClick={handlePresent}
            disabled={isStarting}
            id={`btn-present-song-${song.id}`}
          >
            {isStarting
              ? <LoaderIcon className="size-3.5 animate-spin" />
              : <MonitorPlayIcon className="size-3.5" />
            }
            <span className="hidden sm:inline">
              {isPresentingThisSong ? 'Apresentando' : isStarting ? 'Iniciando…' : 'Apresentar'}
            </span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground"
            onClick={onClose}
          >
            <XIcon className="size-4" />
          </Button>
        </div>
      </div>

      {/* ── Dirty banner ─────────────────────────────────────────────────── */}
      {isDirty && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/50 shrink-0">
          <AlertTriangleIcon className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              Precisa sincronizar com o Holyrics
            </p>
            {dirtyFields.length > 0 && (
              <p className="text-[10px] text-amber-600/80 dark:text-amber-500/80 mt-0.5 truncate">
                Alterados: {dirtyFields.join(', ')}
              </p>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[10px] gap-1 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40"
            onClick={async () => {
              toast.info('Sincronização com o Holyrics em breve!')
              await markSynced()
            }}
          >
            <CheckCircle2Icon className="size-3" />
            Sincronizar
          </Button>
        </div>
      )}

      {/* ── Fetching from API banner ─────────────────────────────────────── */}
      {isFetchingFromApi && !isLoadingAny && (
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-800/50 shrink-0">
          <LoaderIcon className="size-3 text-blue-500 animate-spin shrink-0" />
          <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
            Buscando letra do servidor…
          </p>
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="px-4 pt-3 pb-0 border-b shrink-0">
          <TabsList className="h-9 p-1 gap-1 bg-muted/50 rounded-lg w-auto">
            <TabsTrigger value="info" className="gap-1.5 text-xs px-3 h-7 rounded-md">
              <FileTextIcon className="size-3.5" />
              Informações
            </TabsTrigger>
            <TabsTrigger value="slides" className="gap-1.5 text-xs px-3 h-7 rounded-md">
              <ListMusicIcon className="size-3.5" />
              Letra
              {slides.length > 0 && (
                <span className="ml-0.5 text-[10px] font-black bg-primary/15 text-primary px-1.5 py-0 rounded-full">
                  {slides.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ─ Info tab ─ */}
        <TabsContent value="info" className="flex-1 overflow-y-auto m-0 focus-visible:ring-0">
          <div className="p-4 space-y-2">
            {isLoadingAny && <LoadingRows />}
            {loadState === 'error' && <ErrorState onRetry={handleRefresh} />}

            {displaySong && !isLoadingAny && (
              <>
                <InfoSection title="Identificação">
                  <InfoRow
                    icon={<Music2Icon className="size-3.5" />}
                    label="Título"
                    value={displaySong.title}
                    dirty={dirtyFields.includes('title')}
                  />
                  {(displaySong.artist || displaySong.author) && (
                    <InfoRow
                      icon={<MicVocalIcon className="size-3.5" />}
                      label="Artista"
                      value={displaySong.artist ?? displaySong.author}
                      dirty={
                        dirtyFields.includes('artist') || dirtyFields.includes('author')
                      }
                    />
                  )}
                  {displaySong.group && (
                    <InfoRow
                      icon={<TagIcon className="size-3.5" />}
                      label="Grupo"
                      value={displaySong.group}
                      dirty={dirtyFields.includes('group')}
                    />
                  )}
                  {detail?.language && (
                    <InfoRow
                      icon={<LanguagesIcon className="size-3.5" />}
                      label="Idioma"
                      value={detail.language}
                      dirty={dirtyFields.includes('language')}
                    />
                  )}
                </InfoSection>

                {(detail?.key || detail?.bpm || detail?.time_sig) && (
                  <InfoSection title="Musical">
                    {detail?.key && (
                      <InfoRow
                        icon={<KeyRoundIcon className="size-3.5" />}
                        label="Tom"
                        value={detail.key}
                        dirty={dirtyFields.includes('key')}
                      />
                    )}
                    {detail?.bpm && (
                      <InfoRow
                        icon={<GaugeIcon className="size-3.5" />}
                        label="BPM"
                        value={String(detail.bpm)}
                        dirty={dirtyFields.includes('bpm')}
                      />
                    )}
                    {detail?.time_sig && (
                      <InfoRow
                        icon={<UserIcon className="size-3.5" />}
                        label="Compasso"
                        value={detail.time_sig}
                        dirty={dirtyFields.includes('time_sig')}
                      />
                    )}
                  </InfoSection>
                )}

                {displaySong.copyright && (
                  <InfoSection title="Direitos">
                    <p className="text-xs text-muted-foreground leading-relaxed bg-muted/40 rounded-lg px-3 py-2.5 border m-3">
                      {displaySong.copyright}
                    </p>
                  </InfoSection>
                )}

                {displaySong.note && (
                  <InfoSection title="Observação">
                    <p className="text-xs text-muted-foreground leading-relaxed bg-muted/40 rounded-lg px-3 py-2.5 border m-3">
                      {displaySong.note}
                    </p>
                  </InfoSection>
                )}

                {displaySong.order && (
                  <InfoSection title="Ordem">
                    <SlideOrderBadges order={String(displaySong.order)} />
                  </InfoSection>
                )}

                <div className="flex items-center justify-between pt-1">
                  {detail?._fetchedAt && (
                    <p className="text-[10px] text-muted-foreground/60">
                      Detalhes buscados {formatRelativeDate(detail._fetchedAt)}
                    </p>
                  )}
                  <button
                    onClick={handleRefresh}
                    className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors ml-auto"
                  >
                    <RefreshCwIcon className="size-2.5" />
                    Atualizar
                  </button>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* ─ Slides / Letra tab ─ */}
        <TabsContent value="slides" className="flex-1 overflow-y-auto m-0 focus-visible:ring-0">
          <div className="p-4 space-y-1.5">
            {isLoadingAny && <LoadingRows />}

            {isFetchingFromApi && !isLoadingAny && slides.length === 0 && (
              <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                <CloudOffIcon className="size-4 opacity-40" />
                <LoaderIcon className="size-4 animate-spin" />
                <span className="text-sm">Buscando letra do servidor…</span>
              </div>
            )}

            {loadState === 'error' && <ErrorState onRetry={handleRefresh} />}

            {!isLoadingAny &&
              slides.length === 0 &&
              !isFetchingFromApi &&
              loadState !== 'error' && (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <div className="size-12 rounded-xl bg-muted flex items-center justify-center">
                    <ListMusicIcon className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Sem letra cadastrada</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Os slides desta música não estão disponíveis.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={handleRefresh}
                  >
                    <RefreshCwIcon className="size-3.5" />
                    Buscar do servidor
                  </Button>
                </div>
              )}

            {slides.map((slide, idx) => (
              <SlideCard
                key={idx}
                slide={slide}
                index={idx}
                isActive={isPresentingThisSong && activeIndex === idx}
                isPresenting={isPresentingThisSong}
                isNavigating={isNavigating}
                onClick={() => handleSlideClick(idx)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-3 py-2 bg-muted/40 border-b">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          {title}
        </p>
      </div>
      <div className="divide-y">{children}</div>
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
  dirty,
}: {
  icon: React.ReactNode
  label: string
  value?: string | null
  dirty?: boolean
}) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2.5 px-3 py-2.5">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            {label}
          </p>
          {dirty && (
            <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-px rounded-full border border-amber-200 dark:border-amber-800/50">
              <AlertTriangleIcon className="size-2" />
              editado
            </span>
          )}
        </div>
        <p className="text-sm font-medium leading-snug mt-0.5 break-words">{value}</p>
      </div>
    </div>
  )
}

function SlideCard({
  slide,
  index,
  isActive,
  isPresenting,
  isNavigating,
  onClick,
}: {
  slide: LyricSlide
  index: number
  isActive: boolean
  isPresenting: boolean
  isNavigating: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={isNavigating && !isActive}
      className={cn(
        'group w-full rounded-xl border text-left overflow-hidden',
        'transition-all duration-150 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isActive
          ? 'border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30 shadow-sm shadow-emerald-500/10'
          : 'bg-card hover:border-primary/30 hover:shadow-sm hover:bg-accent/30'
      )}
    >
      {/* Card header */}
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 border-b',
          isActive
            ? 'bg-emerald-100/60 dark:bg-emerald-900/30 border-emerald-500/25'
            : 'bg-muted/30'
        )}
      >
        {/* Index / active indicator */}
        <div className="flex items-center gap-1.5">
          {isActive ? (
            <>
              <span className="flex size-2">
                <span className="animate-ping absolute inline-flex size-2 rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
              </span>
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                ATIVO
              </span>
            </>
          ) : (
            <span className="text-[10px] font-black text-muted-foreground tabular-nums">
              #{String(index + 1).padStart(2, '0')}
            </span>
          )}
        </div>

        {slide.slide_description && (
          <>
            <ChevronRightIcon className="size-3 text-muted-foreground/40" />
            <span
              className={cn(
                'text-[10px] uppercase tracking-wider font-semibold truncate',
                isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
              )}
            >
              {slide.slide_description}
            </span>
          </>
        )}

        <div className="flex-1" />

        {/* Action hint */}
        <span
          className={cn(
            'flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md',
            'transition-opacity',
            isActive
              ? 'text-emerald-600 dark:text-emerald-400 opacity-100'
              : isPresenting
                ? 'text-primary opacity-0 group-hover:opacity-100'
                : 'text-muted-foreground opacity-0 group-hover:opacity-100'
          )}
        >
          {isActive ? (
            <>
              <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
              Ao vivo
            </>
          ) : (
            <>
              <PlayIcon className="size-2.5" />
              {isPresenting ? 'Ir para' : 'Apresentar'}
            </>
          )}
        </span>
      </div>

      {/* Slide text */}
      <div className="px-3 py-3">
        <pre
          className={cn(
            'text-sm leading-relaxed whitespace-pre-wrap font-sans',
            isActive ? 'text-emerald-900 dark:text-emerald-100' : 'text-foreground/90'
          )}
        >
          {slide.text}
        </pre>

        {slide.translations && Object.keys(slide.translations).length > 0 && (
          <div className="mt-2 pt-2 border-t space-y-1">
            {Object.entries(slide.translations).map(([lang, text]) => (
              <div key={lang} className="flex gap-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0 pt-0.5">
                  {lang}
                </span>
                <p className="text-xs text-muted-foreground italic leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}

function SlideOrderBadges({ order }: { order: string }) {
  const parts = order.split(/[\s,]+/).filter(Boolean)
  return (
    <div className="px-3 py-2.5 flex flex-wrap gap-1.5">
      {parts.map((part, i) => (
        <span
          key={i}
          className="text-[10px] font-bold uppercase tracking-wide bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-primary/20"
        >
          {part}
        </span>
      ))}
    </div>
  )
}

function LoadingRows() {
  return (
    <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
      <LoaderIcon className="size-4 animate-spin" />
      <span className="text-sm">Carregando…</span>
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="size-12 rounded-xl bg-destructive/10 flex items-center justify-center">
        <CloudOffIcon className="size-5 text-destructive/70" />
      </div>
      <div>
        <p className="font-semibold text-sm">Erro ao carregar</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Não foi possível obter os detalhes desta música.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5 text-xs">
        <RefreshCwIcon className="size-3.5" />
        Tentar novamente
      </Button>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelativeDate(iso: string): string {
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diffMin < 1) return 'agora mesmo'
  if (diffMin < 60) return `há ${diffMin} min`
  const h = Math.floor(diffMin / 60)
  if (h < 24) return `há ${h}h`
  return `há ${Math.floor(h / 24)}d`
}
