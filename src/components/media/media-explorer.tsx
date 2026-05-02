import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  FolderIcon,
  ImageIcon,
  ListPlusIcon,
  LoaderIcon,
  Music2Icon,
  PlayIcon,
  RefreshCwIcon,
  VideoIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  useAddMediaPathToPlaylistMutation,
  usePresentMediaPathMutation,
} from '@/api/holyrics'
import {
  AppPage,
  EmptyStateSection,
  PageHeader,
  SearchToolbar,
  SectionBlock,
  StatusChip,
  SurfaceCard,
  ToolbarRow,
} from '@/components/design-system'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
import { Skeleton } from '@/components/ui/skeleton'
import { useMediaLibrary } from '@/hooks/use-media-library'
import { useMediaPresentationStore } from '@/hooks/use-media-presentation-store'
import { type MediaLibraryItem } from '@/lib/db'
import {
  type HolyricsMediaType,
  getMediaParentPath,
  normalizeMediaPath,
  splitMediaPath,
} from '@/lib/media'
import { cn } from '@/lib/utils'

const MEDIA_COPY: Record<
  HolyricsMediaType,
  {
    eyebrow: string
    title: string
    description: string
    emptyTitle: string
    emptyDescription: string
  }
> = {
  image: {
    eyebrow: 'Mídias',
    title: 'Imagens',
    description:
      'Explore pastas e arquivos do Holyrics como um file explorer, com caminhos persistidos para apresentação, playlist e programação.',
    emptyTitle: 'Nenhuma imagem encontrada',
    emptyDescription:
      'Sincronize a biblioteca de imagens do Holyrics para navegar por pastas, subpastas e arquivos no cache local.',
  },
  video: {
    eyebrow: 'Mídias',
    title: 'Vídeos',
    description:
      'Explore vídeos e pastas de vídeo do Holyrics com navegação em árvore e ações rápidas de reprodução.',
    emptyTitle: 'Nenhum vídeo encontrado',
    emptyDescription:
      'Sincronize a biblioteca de vídeos do Holyrics para navegar por pastas, subpastas e arquivos no cache local.',
  },
  audio: {
    eyebrow: 'Mídias',
    title: 'Áudios',
    description:
      'Explore áudios e pastas de áudio do Holyrics com caminhos persistidos para execução individual ou por pasta.',
    emptyTitle: 'Nenhum áudio encontrado',
    emptyDescription:
      'Sincronize a biblioteca de áudios do Holyrics para navegar por pastas, subpastas e arquivos no cache local.',
  },
}

function formatBytes(value?: number) {
  if (!value || value <= 0) return null

  if (value < 1024 * 1024) {
    return `${Math.round(value / 1024)} KB`
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function formatDuration(durationMs?: number) {
  if (!durationMs || durationMs <= 0) return null

  const totalSeconds = Math.floor(durationMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function buildDescription(item: MediaLibraryItem) {
  const parts = [
    item.isDir ? 'pasta' : item.extension?.toUpperCase(),
    formatBytes(item.length),
    formatDuration(item.duration_ms),
    item.width && item.height ? `${item.width}x${item.height}` : null,
    item.modified_time,
  ]

  return parts.filter(Boolean).join(' · ')
}

function renderMediaPreview(item: MediaLibraryItem, mediaType: HolyricsMediaType) {
  if (item.isDir) {
    return <FolderIcon />
  }

  if (item.thumbnail) {
    return (
      <img
        src={`data:image/jpeg;base64,${item.thumbnail}`}
        alt={item.name}
        className="size-full object-cover"
      />
    )
  }

  switch (mediaType) {
    case 'image':
      return <ImageIcon />
    case 'video':
      return <VideoIcon />
    case 'audio':
      return <Music2Icon />
  }
}

interface MediaExplorerProps {
  mediaType: HolyricsMediaType
}

export function MediaExplorer({ mediaType }: MediaExplorerProps) {
  const copy = MEDIA_COPY[mediaType]
  const {
    items,
    totalCount,
    lastSyncedAt,
    isLoading,
    isSyncing,
    syncError,
    hasItems,
    syncMediaLibrary,
    ensureMediaFolderLoaded,
  } = useMediaLibrary(mediaType)
  const presentMedia = usePresentMediaPathMutation(mediaType)
  const addToPlaylist = useAddMediaPathToPlaylistMutation(mediaType)
  const mediaPresentation = useMediaPresentationStore()

  const [currentPath, setCurrentPath] = useState('')
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)

  const currentFolderItems = useMemo(() => {
    return items.filter(
      (item) => normalizeMediaPath(item.parentPath) === normalizeMediaPath(currentPath)
    )
  }, [currentPath, items])

  const filteredItems = useMemo(() => {
    if (!deferredSearch.trim()) return currentFolderItems

    const query = deferredSearch.toLowerCase()
    return currentFolderItems.filter((item) =>
      item.name.toLowerCase().includes(query)
    )
  }, [currentFolderItems, deferredSearch])

  const folderSegments = useMemo(() => splitMediaPath(currentPath), [currentPath])

  useEffect(() => {
    if (!currentPath) return
    void ensureMediaFolderLoaded(currentPath)
  }, [currentPath, ensureMediaFolderLoaded])

  const handleRefresh = async () => {
    try {
      await syncMediaLibrary()
      toast.success(`${copy.title} sincronizadas com o Holyrics.`)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `Erro ao sincronizar ${copy.title.toLowerCase()}`
      )
    }
  }

  const handlePresent = async (path: string) => {
    try {
      const normalizedPath = normalizeMediaPath(path)
      const panelItems =
        currentFolderItems.filter((item) => !item.isDir)
      const selectedIndex = panelItems.findIndex(
        (item) => item.path === normalizedPath
      )

      mediaPresentation.openSession({
        mediaType,
        items:
          panelItems.length > 0
            ? panelItems
            : [items.find((item) => item.path === normalizedPath)].filter(
                (item): item is MediaLibraryItem => Boolean(item && !item.isDir)
              ),
        selectedIndex: selectedIndex >= 0 ? selectedIndex : 0,
        sourcePath: currentPath || normalizedPath,
        sourceMode: currentPath ? 'folder' : 'selection',
      })
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao apresentar mídia.'
      )
    }
  }

  const handleAddToPlaylist = async (path: string) => {
    try {
      await addToPlaylist.mutateAsync(path)
      toast.success('Item adicionado à playlist de mídias.')
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao adicionar item à playlist.'
      )
    }
  }

  const navigateTo = (path: string) => {
    startTransition(() => {
      setSearch('')
      setCurrentPath(normalizeMediaPath(path))
    })
  }

  const handlePrimaryAction = async (item: MediaLibraryItem) => {
    if (item.isDir) {
      navigateTo(item.path)
      return
    }

    await handlePresent(item.path)
  }

  const handlePresentCurrentFolder = async () => {
    if (!currentPath) return
    const folderItems = items.filter(
      (item) =>
        normalizeMediaPath(item.parentPath) === normalizeMediaPath(currentPath) &&
        !item.isDir
    )

    if (folderItems.length === 0) {
      toast.error(`Nenhum item de ${copy.title.toLowerCase()} encontrado nesta pasta.`)
      return
    }

    mediaPresentation.openSession({
      mediaType,
      items: folderItems,
      selectedIndex: 0,
      sourcePath: currentPath,
      sourceMode: 'folder',
    })
  }

  const handlePresentFolderItem = async (item: MediaLibraryItem) => {
    const refreshedItems = await ensureMediaFolderLoaded(item.path)
    const folderItems = refreshedItems.filter(
      (candidate) =>
        normalizeMediaPath(candidate.parentPath) === normalizeMediaPath(item.path) &&
        !candidate.isDir
    )

    if (folderItems.length === 0) {
      toast.error(`Nenhum item de ${copy.title.toLowerCase()} encontrado nesta pasta.`)
      return
    }

    mediaPresentation.openSession({
      mediaType,
      items: folderItems,
      selectedIndex: 0,
      sourcePath: item.path,
      sourceMode: 'folder',
    })
  }

  return (
    <AppPage>
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        meta={
          <>
            <StatusChip tone="neutral">{totalCount} itens em cache</StatusChip>
            <StatusChip tone="primary">
              {isSyncing
                ? 'sincronizando em background'
                : lastSyncedAt
                  ? `sync ${new Date(lastSyncedAt).toLocaleDateString('pt-BR')}`
                  : 'sem sync'}
            </StatusChip>
          </>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isSyncing}
          >
            <RefreshCwIcon
              data-icon="inline-start"
              className={cn(isSyncing && 'animate-spin')}
            />
            Atualizar biblioteca
          </Button>
        }
      />

      <ToolbarRow>
        <div className="flex flex-col gap-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                {currentPath ? (
                  <BreadcrumbLink asChild>
                    <button type="button" onClick={() => navigateTo('')}>
                      raiz
                    </button>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>raiz</BreadcrumbPage>
                )}
              </BreadcrumbItem>

              {folderSegments.map((segment, index) => {
                const path = folderSegments.slice(0, index + 1).join('/')
                const isCurrent = path === currentPath

                return (
                  <BreadcrumbItem key={path}>
                    <BreadcrumbSeparator />
                    {isCurrent ? (
                      <BreadcrumbPage>{segment}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <button type="button" onClick={() => navigateTo(path)}>
                          {segment}
                        </button>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                )
              })}
            </BreadcrumbList>
          </Breadcrumb>

          <span className="text-sm text-muted-foreground">
            {currentPath
              ? `${filteredItems.length} item(ns) nesta pasta`
              : `${filteredItems.length} item(ns) na raiz`}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentPath ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateTo(getMediaParentPath(currentPath))}
            >
              Voltar um nível
            </Button>
          ) : null}
          {currentPath ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddToPlaylist(currentPath)}
                disabled={addToPlaylist.isPending}
              >
                <ListPlusIcon data-icon="inline-start" />
                Adicionar pasta à playlist
              </Button>
              <Button
                size="sm"
                onClick={handlePresentCurrentFolder}
                disabled={presentMedia.isPending}
              >
                <PlayIcon data-icon="inline-start" />
                Apresentar pasta
              </Button>
            </>
          ) : null}
        </div>
      </ToolbarRow>

      <SearchToolbar
        value={search}
        onValueChange={setSearch}
        onClear={() => setSearch('')}
        placeholder={`Buscar ${copy.title.toLowerCase()} nesta pasta...`}
        resultLabel={
          syncError ? (
            <span className="text-sm text-destructive">{syncError}</span>
          ) : (
            <span className="text-sm text-muted-foreground">
              Navegação e resolução de caminhos usando cache persistido.
            </span>
          )
        }
      />

      <SectionBlock>
        <SurfaceCard className="gap-3 p-3 sm:p-4">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : null}

          {!isLoading && !hasItems ? (
            <EmptyStateSection
              icon={
                mediaType === 'image'
                  ? ImageIcon
                  : mediaType === 'video'
                    ? VideoIcon
                    : Music2Icon
              }
              title={copy.emptyTitle}
              description={copy.emptyDescription}
              action={
                <Button onClick={handleRefresh}>
                  <RefreshCwIcon data-icon="inline-start" />
                  Sincronizar agora
                </Button>
              }
            />
          ) : null}

          {!isLoading && hasItems && filteredItems.length === 0 ? (
            <EmptyStateSection
              icon={FolderIcon}
              title="Nenhum item nesta pasta"
              description="Abra outra pasta ou sincronize novamente para atualizar o cache local."
            />
          ) : null}

          {!isLoading && filteredItems.length > 0 ? (
            <ItemGroup className="gap-2">
              {filteredItems.map((item) => {
                const isPresentedImage =
                  mediaPresentation.isPresenting &&
                  mediaPresentation.mediaType === mediaType &&
                  mediaPresentation.presentedItem?.path === item.path

                return (
                <Item
                  key={item.path}
                  asChild
                  variant="outline"
                  className={cn(
                    'rounded-xl border-border/70',
                    isPresentedImage && 'border-emerald-500/25 bg-emerald-500/5'
                  )}
                >
                  <button type="button" onClick={() => void handlePrimaryAction(item)}>
                    <ItemMedia
                      variant={item.thumbnail && !item.isDir ? 'image' : 'icon'}
                      className={cn(
                        'text-muted-foreground',
                        item.isDir && 'text-primary'
                      )}
                    >
                      {renderMediaPreview(item, mediaType)}
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle className={cn(isPresentedImage && 'text-emerald-700 dark:text-emerald-300')}>
                        {item.name}
                      </ItemTitle>
                      <ItemDescription>
                        {isPresentedImage
                          ? `apresentando agora · ${buildDescription(item)}`
                          : buildDescription(item)}
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions className="ml-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation()
                          if (item.isDir) {
                            navigateTo(item.path)
                            return
                          }
                          void handlePresent(item.path)
                        }}
                      >
                        {item.isDir ? 'Abrir' : 'Apresentar'}
                      </Button>
                      {item.isDir ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation()
                            void handlePresentFolderItem(item)
                          }}
                        >
                          <PlayIcon />
                        </Button>
                      ) : null}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation()
                          void handleAddToPlaylist(item.path)
                        }}
                      >
                        <ListPlusIcon />
                      </Button>
                    </ItemActions>
                  </button>
                </Item>
                )
              })}
            </ItemGroup>
          ) : null}

          {presentMedia.isPending || addToPlaylist.isPending ? (
            <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
              <LoaderIcon className="size-4 animate-spin" />
              Enviando ação ao Holyrics...
            </div>
          ) : null}
        </SurfaceCard>
      </SectionBlock>
    </AppPage>
  )
}
