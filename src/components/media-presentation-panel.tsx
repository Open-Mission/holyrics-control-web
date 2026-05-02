import { useMemo } from 'react'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FolderOpenIcon,
  ImageIcon,
  LoaderIcon,
  MonitorPlayIcon,
  Music2Icon,
  PlayIcon,
  VideoIcon,
  XIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'
import { useMediaPresentationStore } from '@/hooks/use-media-presentation-store'
import { type MediaType } from '@/lib/db'
import { getMediaBaseName } from '@/lib/media'
import { cn } from '@/lib/utils'

function mediaLabel(mediaType: MediaType | null) {
  switch (mediaType) {
    case 'image':
      return 'imagem'
    case 'video':
      return 'vídeo'
    case 'audio':
      return 'áudio'
    default:
      return 'mídia'
  }
}

function mediaIcon(mediaType: MediaType | null) {
  switch (mediaType) {
    case 'video':
      return VideoIcon
    case 'audio':
      return Music2Icon
    case 'image':
    default:
      return ImageIcon
  }
}

function renderMediaIcon(mediaType: MediaType | null, className?: string) {
  switch (mediaType) {
    case 'video':
      return <VideoIcon className={className} />
    case 'audio':
      return <Music2Icon className={className} />
    case 'image':
    default:
      return <ImageIcon className={className} />
  }
}

function renderPreview(
  mediaType: MediaType | null,
  previewItem: ReturnType<typeof useMediaPresentationStore>['currentItem']
) {
  const Icon = mediaIcon(mediaType)

  if (previewItem?.thumbnail) {
    return (
      <img
        src={`data:image/jpeg;base64,${previewItem.thumbnail}`}
        alt={previewItem.name}
        className="size-full object-contain"
      />
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 text-muted-foreground">
      <Icon className="size-10" />
      <span className="text-sm">Preview indisponível</span>
    </div>
  )
}

export function MediaPresentationPanel() {
  const isMobile = useIsMobile()
  const { panelOpen, closePanel } = useMediaPresentationStore()

  const content = <MediaPresentationContent />

  if (isMobile) {
    return (
      <Drawer
        open={panelOpen}
        onOpenChange={(open) => {
          if (!open) closePanel()
        }}
        direction="bottom"
      >
        <DrawerContent className="h-dvh flex flex-col rounded-none">
          <DrawerTitle className="sr-only">Controle de apresentação de mídia</DrawerTitle>
          {content}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Sheet
      open={panelOpen}
      onOpenChange={(open) => {
        if (!open) closePanel()
      }}
    >
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full sm:max-w-[62vw]! sm:min-w-[32rem] p-0 flex flex-col gap-0"
      >
        <SheetTitle className="sr-only">Controle de apresentação de mídia</SheetTitle>
        {content}
      </SheetContent>
    </Sheet>
  )
}

function MediaPresentationContent() {
  const {
    mediaType,
    items,
    selectedIndex,
    presentedIndex,
    currentItem,
    presentedItem,
    sourcePath,
    isPresenting,
    isStarting,
    isNavigating,
    selectMedia,
    startSelectedPresentation,
    goToMedia,
    closePresentation,
    closePanel,
  } = useMediaPresentationStore()

  const label = mediaLabel(mediaType)
  const title = useMemo(() => {
    if (sourcePath && sourcePath !== currentItem?.path) return getMediaBaseName(sourcePath)
    if (currentItem) return currentItem.name
    return 'Apresentação de mídia'
  }, [currentItem, sourcePath])

  const folderLabel = useMemo(() => {
    if (!sourcePath) return null
    return sourcePath.includes('/') ? sourcePath : 'raiz'
  }, [sourcePath])

  const previewItem = currentItem ?? presentedItem

  const shiftSelection = (direction: -1 | 1) => {
    if (items.length === 0) return
    const base = selectedIndex ?? 0
    const next = base + direction
    if (next < 0 || next >= items.length) return
    selectMedia(next)
  }

  const handlePresentSelected = async () => {
    try {
      if (isPresenting && selectedIndex !== null) {
        await goToMedia(selectedIndex)
      } else {
        await startSelectedPresentation()
      }
      toast.success('Apresentação enviada ao Holyrics.')
    } catch {
      toast.error(`Erro ao apresentar ${label} selecionad${label === 'imagem' ? 'a' : 'o'}.`)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b px-4 py-4 shrink-0">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/10">
          {renderMediaIcon(mediaType, 'size-4 text-primary')}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-bold leading-tight">{title}</p>
            {isPresenting ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                </span>
                apresentando
              </span>
            ) : null}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {items.length} {label}(ns)
            {folderLabel ? ` · ${folderLabel}` : null}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => shiftSelection(-1)}
            disabled={(selectedIndex ?? 0) <= 0}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => shiftSelection(1)}
            disabled={selectedIndex === null || selectedIndex >= items.length - 1}
          >
            <ChevronRightIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={async () => {
              try {
                await closePresentation()
              } catch {
                toast.error('Erro ao encerrar apresentação.')
              }
            }}
            disabled={!isPresenting}
          >
            <XIcon />
          </Button>
        </div>
      </div>

      <div className="border-b px-4 py-3 shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-xl border bg-muted/40 px-3 py-2 text-sm">
            <MonitorPlayIcon className="size-4 text-emerald-500" />
            <span>
              Selecionad{label === 'imagem' ? 'a' : 'o'} {selectedIndex === null ? 0 : selectedIndex + 1} / {items.length}
            </span>
          </div>
          {isPresenting ? (
            <div className="inline-flex items-center gap-2 rounded-xl border bg-background px-3 py-2 text-sm text-muted-foreground">
              <span>
                Apresentando {presentedIndex === null ? 0 : presentedIndex + 1} / {items.length}
              </span>
            </div>
          ) : null}
          {sourcePath ? (
            <div className="inline-flex items-center gap-2 rounded-xl border bg-background px-3 py-2 text-sm text-muted-foreground">
              <FolderOpenIcon className="size-4" />
              <span className="max-w-72 truncate">{sourcePath}</span>
            </div>
          ) : null}
          {(isStarting || isNavigating) ? (
            <div className="inline-flex items-center gap-2 rounded-xl border bg-background px-3 py-2 text-sm text-muted-foreground">
              <LoaderIcon className="size-4 animate-spin" />
              <span>{isStarting ? 'iniciando apresentação' : `trocando ${label}`}</span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="border-b p-4 shrink-0">
          <div className="flex flex-col gap-4">
            <div className="relative aspect-video overflow-hidden rounded-2xl border bg-muted/30">
              <div className="absolute inset-0 flex items-center justify-center">
                {renderPreview(mediaType, previewItem)}
              </div>
              {isPresenting && previewItem?.path === presentedItem?.path ? (
                <div className="absolute left-4 top-4 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
                  item ao vivo
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="truncate text-base font-semibold">
                {previewItem?.name ?? `Nenhum ${label} selecionado`}
              </h3>
              <p className="truncate text-sm text-muted-foreground">
                {previewItem?.path ?? `Selecione um ${label} na lista para visualizar.`}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handlePresentSelected}
                disabled={!previewItem || isStarting || isNavigating}
              >
                <PlayIcon data-icon="inline-start" />
                {isPresenting ? `Apresentar selecionad${label === 'imagem' ? 'a' : 'o'}` : 'Iniciar apresentação'}
              </Button>
              <Button variant="outline" onClick={closePanel}>
                Fechar painel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  try {
                    await closePresentation()
                  } catch {
                    toast.error('Erro ao encerrar apresentação.')
                  }
                }}
                disabled={!isPresenting}
              >
                Encerrar apresentação
              </Button>
            </div>
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto px-4 py-4">
          <ItemGroup className="gap-2">
            {items.map((item, index) => {
              const isSelected = index === selectedIndex
              const isPresented = index === presentedIndex
              return (
                <Item
                  key={item.path}
                  asChild
                  variant={isSelected ? 'muted' : 'outline'}
                  className={cn(
                    'rounded-xl border border-border/70 transition-colors',
                    isSelected && 'border-primary/20 bg-primary/5',
                    isPresented && 'border-emerald-500/25'
                  )}
                >
                  <button type="button" onClick={() => selectMedia(index)}>
                    <ItemMedia
                      variant={item.thumbnail ? 'image' : 'icon'}
                      className={cn(
                        isSelected && 'text-primary',
                        isPresented && 'text-emerald-600'
                      )}
                    >
                      {item.thumbnail ? (
                        <img
                          src={`data:image/jpeg;base64,${item.thumbnail}`}
                          alt={item.name}
                          className="size-full object-cover"
                        />
                      ) : (
                        renderMediaIcon(mediaType)
                      )}
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle
                        className={cn(
                          isSelected && 'text-primary',
                          isPresented && 'text-emerald-700 dark:text-emerald-300'
                        )}
                      >
                        {item.name}
                      </ItemTitle>
                      <ItemDescription>
                        {isPresented
                          ? `${label} atualmente apresentad${label === 'imagem' ? 'a' : 'o'}`
                          : isSelected
                            ? `${label} selecionad${label === 'imagem' ? 'a' : 'o'} para preview`
                            : item.path}
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions className="ml-auto">
                      {isPresented ? (
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
                          ativo
                        </span>
                      ) : isSelected ? (
                        <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                          preview
                        </span>
                      ) : null}
                    </ItemActions>
                  </button>
                </Item>
              )
            })}
          </ItemGroup>
        </div>
      </div>
    </div>
  )
}
