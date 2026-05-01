import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { HOLYRICS_SERVER_URL } from '@/lib/holyrics-instance'
import {
  useGetApiV1BackgroundsCurrentTheme,
  useGetApiV1BackgroundsCurrent,
  usePostApiV1BackgroundsSet,
  usePostApiV1BibleTheme
} from '@/api/generated'
import type { Theme } from '@/lib/db'
import { useThemesStore } from '@/hooks/use-themes-store'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search,
  Check,
  Layers,
  BookOpen,
  Palette,
  Layout,
  Monitor,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/themes')({
  component: ThemesPage,
})

function ThemesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'global' | 'bible'>('global')

  const { themes: allThemes, isLoading: isLoadingThemes, syncThemes } = useThemesStore()

  const {
    data: currentThemeData,
    refetch: refetchCurrentTheme
  } = useGetApiV1BackgroundsCurrentTheme()

  const {
    data: currentBackgroundData,
    refetch: refetchCurrentBackground,
    isLoading: isLoadingCurrent
  } = useGetApiV1BackgroundsCurrent()

  const setBackgroundMutation = usePostApiV1BackgroundsSet()
  const setBibleThemeMutation = usePostApiV1BibleTheme()

  const themes = useMemo(() => {
    return allThemes.filter((t: Theme) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [allThemes, searchQuery])

  const activeId = useMemo(() => {
    const currentTheme = currentThemeData?.data as { id?: string | number } | undefined
    const currentBackground = currentBackgroundData?.data as
      | { id?: string | number; type?: string }
      | undefined

    if (currentTheme?.id != null) return String(currentTheme.id)
    if (currentBackground?.type === 'theme' && currentBackground.id != null) {
      return String(currentBackground.id)
    }
    if (currentBackground?.id != null) return String(currentBackground.id)
    return null
  }, [currentThemeData, currentBackgroundData])

  const handleSetTheme = async (themeId: string) => {
    const t = toast.loading('Aplicando tema...')
    try {
      if (activeTab === 'global') {
        // Use setCurrentBackground for both immediate effect and global update
        // as suggested by the user and confirmed as the reliable endpoint.
        await setBackgroundMutation.mutateAsync({ data: { id: themeId } })
        toast.success('Tema global aplicado', { id: t })
      } else {
        await setBibleThemeMutation.mutateAsync({ data: { id: themeId } })
        toast.success('Tema da Bíblia atualizado', { id: t })
      }
      
      // Refresh all states to ensure UI is in sync
      refetchCurrentTheme()
      refetchCurrentBackground()
    } catch (error) {
      toast.error('Erro ao atualizar tema', { id: t })
    }
  }

  const handleRefresh = async () => {
    try {
      await syncThemes()
      await refetchCurrentTheme()
      await refetchCurrentBackground()
      toast.success('Temas atualizados')
    } catch (error) {
      toast.error('Erro ao atualizar temas')
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Temas</h1>
          <p className="text-muted-foreground">
            Visualize e alterne entre os temas de apresentação disponíveis.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            className="rounded-full shrink-0"
          >
            <RefreshCw className={cn("size-4", (isLoadingThemes || isLoadingCurrent) && "animate-spin")} />
          </Button>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar temas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50 border-muted-foreground/20 rounded-full focus-visible:ring-emerald-500/20"
            />
          </div>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as any)}
        className="space-y-6"
      >
        <div className="flex items-center justify-between border-b pb-1">
          <TabsList className="bg-muted/50 p-1 h-auto rounded-full">
            <TabsTrigger
              value="global"
              className="rounded-full px-6 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <Monitor className="size-4 mr-2" />
              Geral
            </TabsTrigger>
            <TabsTrigger
              value="bible"
              className="rounded-full px-6 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              <BookOpen className="size-4 mr-2" />
              Bíblia
            </TabsTrigger>
          </TabsList>

          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-1 rounded-full">
            <Palette className="size-3" />
            <span>Total: {themes.length} temas</span>
          </div>
        </div>

        <TabsContent value="global" className="m-0 focus-visible:outline-none">
          <ThemeGrid
            themes={themes}
            activeId={activeId}
            loading={isLoadingThemes || isLoadingCurrent}
            onSelect={handleSetTheme}
            isSetting={setBackgroundMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="bible" className="m-0 focus-visible:outline-none">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6 flex items-start gap-3">
            <Layout className="size-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Tema da Bíblia</p>
              <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
                Este tema será aplicado especificamente para as projeções de versículos bíblicos.
              </p>
            </div>
          </div>
          <ThemeGrid
            themes={themes}
            activeId={null} // We don't have current bible theme info yet in the GET response usually
            loading={isLoadingThemes}
            onSelect={handleSetTheme}
            isSetting={setBibleThemeMutation.isPending}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface ThemeGridProps {
  themes: any[]
  activeId: string | number | null
  loading: boolean
  onSelect: (id: string) => void
  isSetting: boolean
}

function ThemeGrid({ themes, activeId, loading, onSelect, isSetting }: ThemeGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="overflow-hidden border-muted/20">
            <div className="aspect-video bg-muted animate-pulse" />
            <CardHeader className="p-4 space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </CardHeader>
          </Card>
        ))}
      </div>
    )
  }

  if (themes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-xl border border-dashed">
        <Layers className="size-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium">Nenhum tema encontrado</h3>
        <p className="text-sm text-muted-foreground">Tente ajustar sua busca.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {themes.map((theme) => (
        <ThemeCard
          key={theme.id}
          theme={theme}
          isActive={String(activeId) === String(theme.id)}
          onSelect={() => onSelect(theme.id.toString())}
          isSetting={isSetting}
        />
      ))}
    </div>
  )
}

function ThemeCard({ theme, isActive, onSelect, isSetting }: { theme: any, isActive: boolean, onSelect: () => void, isSetting: boolean }) {
  // Base URL for thumbnails
  const baseUrl = HOLYRICS_SERVER_URL.endsWith('/') ? HOLYRICS_SERVER_URL.slice(0, -1) : HOLYRICS_SERVER_URL
  const thumbnailUrl = `${baseUrl}/api/v1/backgrounds/thumbnail?id=${theme.id}&type=theme`

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-muted/30",
        isActive && "ring-2 ring-emerald-500 border-emerald-500/50 shadow-emerald-500/10"
      )}
    >
      <div className="aspect-video relative overflow-hidden bg-black/5">
        <img
          src={thumbnailUrl}
          alt={theme.name}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            // Fallback if thumbnail fails
            (e.target as any).src = 'https://placehold.co/400x225/101010/333333?text=Preview+Indisponível'
          }}
        />

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          {!isActive && (
            <Button
              size="sm"
              className="bg-white text-black hover:bg-white/90 rounded-full"
              onClick={(e) => {
                e.stopPropagation()
                onSelect()
              }}
              disabled={isSetting}
            >
              Aplicar Tema
            </Button>
          )}
        </div>

        {/* Active Indicator */}
        {isActive && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 pl-1 pr-2 gap-1 rounded-full shadow-lg border-emerald-400">
              <Check className="size-3" />
              Ativo
            </Badge>
          </div>
        )}
      </div>

      <CardHeader className="p-4">
        <CardTitle className="text-base truncate group-hover:text-emerald-500 transition-colors">
          {theme.name}
        </CardTitle>
        <CardDescription className="text-xs flex items-center gap-2">
          ID: {theme.id}
          {theme.background?.type && (
            <span className="capitalize opacity-70">• {theme.background.type}</span>
          )}
        </CardDescription>
      </CardHeader>

      {/* Bottom accent bar */}
      <div className={cn(
        "h-1 w-full transition-all duration-300",
        isActive ? "bg-emerald-500" : "bg-transparent group-hover:bg-emerald-500/30"
      )} />
    </Card>
  )
}
