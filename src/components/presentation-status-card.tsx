/**
 * PresentationStatusCard — indicador flutuante minimalista de apresentação ativa.
 *
 * Aparece no canto inferior direito quando há uma apresentação em andamento.
 * Mostra título da música, slide atual / total, e botão de fechar.
 */
import { MonitorPlayIcon, XIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { usePresentationStore, goToSlide, closePresentation, openPanelForSong } from '@/hooks/use-presentation-store'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function PresentationStatusCard() {
  const { song, slides, activeIndex, isPresenting, isNavigating } = usePresentationStore()

  if (!isPresenting || !song) return null

  const total = slides.length
  const hasPrev = activeIndex !== null && activeIndex > 0
  const hasNext = activeIndex === null ? total > 0 : activeIndex < total - 1

  const navigate = async (index: number) => {
    if (isNavigating) return
    try {
      await goToSlide(index)
    } catch {
      toast.error('Erro ao navegar no slide')
    }
  }

  return (
    <div
      role="status"
      aria-label="Apresentação em andamento"
      className={cn(
        'fixed bottom-5 right-5 z-40',
        'flex items-center gap-3 pr-2 pl-3 py-2.5',
        'rounded-2xl border bg-background/95 shadow-lg shadow-black/10',
        'backdrop-blur-md',
        'animate-in slide-in-from-bottom-4 fade-in duration-300',
        'min-w-[220px] max-w-xs'
      )}
    >
      {/* Clickable area — opens detail panel */}
      <button
        onClick={() => openPanelForSong(song)}
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
        title="Abrir painel da música"
      >
        {/* Live dot + icon */}
        <div className="relative shrink-0">
          <div className="size-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
            <MonitorPlayIcon className="size-3.5 text-emerald-500" />
          </div>
          {/* Pulsing live dot */}
          <span className="absolute -top-0.5 -right-0.5 flex size-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
          </span>
        </div>

        {/* Song info */}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold truncate leading-tight">{song.title}</p>
          {total > 0 && (
          <p className="text-[10px] text-muted-foreground tabular-nums mt-0.5">
            Slide{' '}
            <span className="font-semibold text-foreground">{activeIndex === null ? 0 : activeIndex + 1}</span>
            {' / '}
            {total}
          </p>
          )}
        </div>
      </button>

      {/* Navigation */}
      {total > 1 && (
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => navigate((activeIndex ?? 0) - 1)}
            disabled={!hasPrev || isNavigating}
            className="size-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
            aria-label="Slide anterior"
          >
            <ChevronLeftIcon className="size-3.5" />
          </button>
          <button
            onClick={() => navigate(activeIndex === null ? 0 : activeIndex + 1)}
            disabled={!hasNext || isNavigating}
            className="size-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
            aria-label="Próximo slide"
          >
            <ChevronRightIcon className="size-3.5" />
          </button>
        </div>
      )}

      {/* Close */}
      <button
        onClick={async () => {
          try {
            await closePresentation()
          } catch {
            toast.error('Erro ao encerrar apresentação')
          }
        }}
        className="size-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
        aria-label="Encerrar apresentação"
        title="Encerrar apresentação"
      >
        <XIcon className="size-3.5" />
      </button>
    </div>
  )
}
