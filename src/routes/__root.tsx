import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { PresentationStatusCard } from "@/components/presentation-status-card";
import { SongDetailPanel } from "@/components/song-detail-panel";
import { MediaPresentationPanel } from "@/components/media-presentation-panel";
import { MediaPresentationStatusCard } from "@/components/media-presentation-status-card";
import {
  usePresentationStore,
  closePanel,
  openPanelForSong,
} from "@/hooks/use-presentation-store";
import {
  openMediaPresentationPanel,
  useMediaPresentationStore,
} from "@/hooks/use-media-presentation-store";
import { GlobalPresentationSync } from "@/components/presentation-sync";
import { ImageIcon, MonitorPlayIcon, Music2Icon, VideoIcon } from "lucide-react";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import { StatusChip } from "@/components/design-system";
import { ServerSwitcher } from "@/components/server/server-switcher";
import { useServerStore } from "@/hooks/use-server-store";
import { useEffect } from "react";
import { fetchGlobalSettings } from "@/lib/global-settings";

const queryClient = new QueryClient();

// eslint-disable-next-line react-refresh/only-export-components
function ServerRuntimeCoordinator() {
  const { activeServerId } = useServerStore()

  useEffect(() => {
    queryClient.clear()

    if (!activeServerId) {
      return
    }

    fetchGlobalSettings({ serverId: activeServerId, force: true }).catch(() => {})
  }, [activeServerId])

  return null
}

// eslint-disable-next-line react-refresh/only-export-components
function HeaderPresentationBadge() {
  const { song, slides, activeIndex, isPresenting } = usePresentationStore();
  const {
    mediaType,
    presentedItem: currentMedia,
    items: mediaItems,
    presentedIndex: mediaActiveIndex,
    isPresenting: isPresentingMedia,
  } = useMediaPresentationStore();

  if (isPresentingMedia && currentMedia) {
    const MediaIcon =
      mediaType === "video"
        ? VideoIcon
        : mediaType === "audio"
          ? Music2Icon
          : ImageIcon;

    return (
      <button
        onClick={openMediaPresentationPanel}
        className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 transition-colors hover:bg-emerald-500/15"
        title="Abrir controle de apresentação"
      >
        <span className="relative flex size-1.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full size-1.5 bg-emerald-500" />
        </span>
        <MediaIcon className="size-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <span className="max-w-40 truncate text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          {currentMedia.name}
        </span>
        <span className="shrink-0 text-[10px] tabular-nums text-emerald-600/70 dark:text-emerald-400/70">
          {mediaActiveIndex === null ? 0 : mediaActiveIndex + 1}/{mediaItems.length}
        </span>
      </button>
    );
  }

  if (!isPresenting || !song) return null;

  return (
    <button
      onClick={() => openPanelForSong(song)}
      className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 transition-colors hover:bg-emerald-500/15"
      title="Abrir controle de apresentação"
    >
      <span className="relative flex size-1.5 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full size-1.5 bg-emerald-500" />
      </span>
      <MonitorPlayIcon className="size-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
      <span className="max-w-40 truncate text-xs font-semibold text-emerald-700 dark:text-emerald-300">
        {song.title}
      </span>
      {slides.length > 0 && (
        <span className="shrink-0 text-[10px] tabular-nums text-emerald-600/70 dark:text-emerald-400/70">
          {activeIndex === null ? 0 : activeIndex + 1}/{slides.length}
        </span>
      )}
    </button>
  );
}

/** Painel global — abre de qualquer rota via presentation store */
// eslint-disable-next-line react-refresh/only-export-components
function GlobalSongDetailPanel() {
  const { selectedSong, panelOpen } = usePresentationStore();
  return (
    <SongDetailPanel
      song={selectedSong}
      open={panelOpen}
      onClose={closePanel}
    />
  );
}

// eslint-disable-next-line react-refresh/only-export-components
function GlobalMediaPresentationPanel() {
  return <MediaPresentationPanel />;
}

export const Route = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <ServerRuntimeCoordinator />
      <ThemeProvider>
        <GlobalPresentationSync />
        <TooltipProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b border-border/70 bg-background/85 px-4 backdrop-blur md:px-6">
                <SidebarTrigger className="-ml-1 rounded-xl" />
                <Separator orientation="vertical" className="hidden md:block" />
                <div className="flex min-w-0 items-center gap-3">
                  <div className="size-10 items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-primary/10 shadow-xs sm:flex">
                    <img
                      src="/logo.png"
                      alt="Holyrics Control"
                      className="size-full object-contain p-1.5"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Holyrics Control
                    </span>
                    <span className="text-sm font-semibold tracking-tight">
                      Workspace
                    </span>
                  </div>
                </div>
                <div className="flex-1" />
                <ServerSwitcher />
                <StatusChip className="hidden xl:inline-flex">
                  contexto local
                </StatusChip>
                <HeaderPresentationBadge />
                <ModeToggle />
              </header>
              <div className="flex flex-1 flex-col">
                <Outlet />
              </div>
            </SidebarInset>
            <TanStackRouterDevtools />
          </SidebarProvider>
          <PresentationStatusCard />
          <MediaPresentationStatusCard />
          <GlobalSongDetailPanel />
          <GlobalMediaPresentationPanel />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  ),
});
