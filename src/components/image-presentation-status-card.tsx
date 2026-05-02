import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ImageIcon,
  XIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  closeImagePresentation,
  goToPresentedImage,
  openImagePresentationPanel,
  useImagePresentationStore,
} from '@/hooks/use-image-presentation-store'
import { cn } from '@/lib/utils'

export function ImagePresentationStatusCard() {
  const { presentedItem, items, presentedIndex, isPresenting, isNavigating } =
    useImagePresentationStore()

  if (!isPresenting || !presentedItem) return null

  const hasPrev = presentedIndex !== null && presentedIndex > 0
  const hasNext = presentedIndex !== null && presentedIndex < items.length - 1

  const navigate = async (index: number) => {
    if (isNavigating) return
    try {
      await goToPresentedImage(index)
    } catch {
      toast.error('Erro ao navegar na apresentação de imagens')
    }
  }

  return (
    <div
      role="status"
      aria-label="Apresentação de imagens em andamento"
      className={cn(
        'fixed bottom-5 right-5 z-40',
        'flex items-center gap-3 pr-2 pl-3 py-2.5',
        'rounded-2xl border bg-background/95 shadow-lg shadow-black/10',
        'backdrop-blur-md',
        'animate-in slide-in-from-bottom-4 fade-in duration-300',
        'min-w-[220px] max-w-xs'
      )}
    >
      <button
        onClick={openImagePresentationPanel}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
        title="Abrir controle da apresentação"
      >
        <div className="relative shrink-0">
          <div className="flex size-7 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/15">
            <ImageIcon className="size-3.5 text-emerald-500" />
          </div>
          <span className="absolute -right-0.5 -top-0.5 flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-bold leading-tight">
            {presentedItem.name}
          </p>
          <p className="mt-0.5 text-[10px] tabular-nums text-muted-foreground">
            Imagem{' '}
            <span className="font-semibold text-foreground">
              {presentedIndex === null ? 0 : presentedIndex + 1}
            </span>{' '}
            / {items.length}
          </p>
        </div>
      </button>

      {items.length > 1 ? (
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            onClick={() => navigate((presentedIndex ?? 0) - 1)}
            disabled={!hasPrev || isNavigating}
            className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
            aria-label="Imagem anterior"
          >
            <ChevronLeftIcon className="size-3.5" />
          </button>
          <button
            onClick={() => navigate((presentedIndex ?? 0) + 1)}
            disabled={!hasNext || isNavigating}
            className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
            aria-label="Próxima imagem"
          >
            <ChevronRightIcon className="size-3.5" />
          </button>
        </div>
      ) : null}

      <button
        onClick={async () => {
          try {
            await closeImagePresentation()
          } catch {
            toast.error('Erro ao encerrar apresentação')
          }
        }}
        className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        aria-label="Encerrar apresentação"
        title="Encerrar apresentação"
      >
        <XIcon className="size-3.5" />
      </button>
    </div>
  )
}
