import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { Separator } from '@/components/ui/separator'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { PresentationStatusCard } from '@/components/presentation-status-card'
import { SongDetailPanel } from '@/components/song-detail-panel'
import { usePresentationStore, closePanel, openPanelForSong } from '@/hooks/use-presentation-store'
import { MonitorPlayIcon } from 'lucide-react'

const queryClient = new QueryClient()

function HeaderPresentationBadge() {
  const { song, slides, activeIndex, isPresenting } = usePresentationStore()
  if (!isPresenting || !song) return null

  return (
    <button
      onClick={() => openPanelForSong(song)}
      className="flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
      title="Abrir controle de apresentação"
    >
      {/* Pulsing dot */}
      <span className="relative flex size-1.5 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full size-1.5 bg-emerald-500" />
      </span>
      <MonitorPlayIcon className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 max-w-[160px] truncate">
        {song.title}
      </span>
      {slides.length > 0 && (
        <span className="text-[10px] text-emerald-600/70 dark:text-emerald-500/70 tabular-nums shrink-0">
          {activeIndex === null ? 0 : activeIndex + 1}/{slides.length}
        </span>
      )}
    </button>
  )
}

/** Painel global — abre de qualquer rota via presentation store */
function GlobalSongDetailPanel() {
  const { selectedSong, panelOpen } = usePresentationStore()
  return (
    <SongDetailPanel
      song={selectedSong}
      open={panelOpen}
      onClose={closePanel}
    />
  )
}

export const Route = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <div className="flex items-center gap-2 px-4">
                <span className="text-sm font-medium">Holyrics Control</span>
              </div>
              {/* Spacer */}
              <div className="flex-1" />
              {/* Live presentation badge — clicável para abrir painel */}
              <HeaderPresentationBadge />
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
              <Outlet />
            </div>
          </SidebarInset>
          <TanStackRouterDevtools />
        </SidebarProvider>
        {/* Global floating presentation indicator */}
        <PresentationStatusCard />
        {/* Global song detail panel — driven by presentation store */}
        <GlobalSongDetailPanel />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  ),
})
