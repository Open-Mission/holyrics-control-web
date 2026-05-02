import * as React from "react";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useApiServerInfoQuery } from "@/api/holyrics";
import { Maximize2, Columns, Layout, MonitorPlay, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SurfaceCard } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { useServerStore } from "@/hooks/use-server-store";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const VIEWS = [
  { id: "widescreen", label: "Widescreen", path: "/view/widescreen" },
  { id: "standard", label: "Standard", path: "/view/standard" },
  { id: "text", label: "Text", path: "/view/text" },
  {
    id: "text-aux-control",
    label: "Text Aux Control",
    path: "/view/text-aux-control",
  },
  { id: "text2", label: "Text 2", path: "/view/text2" },
  {
    id: "text-aux-control2",
    label: "Text Aux Control 2",
    path: "/view/text-aux-control2",
  },
  { id: "text3", label: "Text 3", path: "/view/text3" },
  {
    id: "text-aux-control3",
    label: "Text Aux Control 3",
    path: "/view/text-aux-control3",
  },
  { id: "multiview", label: "Multiview", path: "/multiview" },
  { id: "chat", label: "Chat", path: "/chat" },
];

export function ProjectionPreview() {
  const { activeServer } = useServerStore();
  const [view1, setView1] = React.useState(VIEWS[0].path);
  const [view2, setView2] = React.useState(VIEWS[1].path);
  const [dualView, setDualView] = React.useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = React.useState(false);

  const { data: serverInfoResponse } = useApiServerInfoQuery();
  const previewBaseUrl = activeServer?.previewUrl?.replace(/\?.*$/, "").replace(/\/$/, "") ?? "";
  const hasPreviewUrl = previewBaseUrl.length > 0;

  const getFullUrl = (path: string) => `${previewBaseUrl}${path}`;

  return (
    <>
      <SurfaceCard className="flex flex-col rounded-2xl border">
        <CardHeader className="flex flex-col justify-between gap-2 px-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Layout className="text-primary" />
              Projeção em Tempo Real
            </CardTitle>
            <CardDescription>
              Visualize as saídas do Holyrics com foco no que está no ar agora.
            </CardDescription>
          </div>
          <div className="flex flex-row gap-2 sm:items-end">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2 rounded-sm border bg-muted/60 px-3 py-1.5">
                <Switch
                  id="dual-view"
                  checked={dualView}
                  onCheckedChange={setDualView}
                  size="sm"
                />
                <Label
                  htmlFor="dual-view"
                  className="flex cursor-pointer items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                >
                  <Columns className="size-3.5" />
                </Label>
              </div>

              <Button
                variant="outline"
                size="icon-sm"
                className="flex"
                onClick={() => setIsFullscreenOpen(true)}
              >
                <Maximize2 data-icon="inline-start" />
              </Button>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <Select value={view1} onValueChange={setView1}>
                <SelectTrigger size="sm" className="w-full sm:w-47.5">
                  <SelectValue placeholder="View 1" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {VIEWS.map((v) => (
                    <SelectItem key={v.id} value={v.path}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {dualView && (
                <Select value={view2} onValueChange={setView2}>
                  <SelectTrigger
                    size="sm"
                    className="w-full rounded-lg sm:w-47.5"
                  >
                    <SelectValue placeholder="View 2" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {VIEWS.map((v) => (
                      <SelectItem key={v.id} value={v.path}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex lg:min-h-75 flex-1 px-4">
          {hasPreviewUrl ? (
            <PreviewGrid
              dualView={dualView}
              view1={view1}
              view2={view2}
              getFullUrl={getFullUrl}
              className="h-full w-full"
            />
          ) : (
            <PreviewMissingState
              serverName={activeServer?.name}
              serverUrl={activeServer?.url}
              serverInfoResponse={serverInfoResponse}
              className="self-center"
            />
          )}
        </CardContent>
      </SurfaceCard>

      <Drawer
        open={isFullscreenOpen}
        onOpenChange={setIsFullscreenOpen}
        direction="bottom"
      >
        <DrawerContent className="inset-0 h-dvh max-h-dvh w-screen max-w-none rounded-none border-0 bg-background data-[vaul-drawer-direction=bottom]:top-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:max-h-dvh data-[vaul-drawer-direction=bottom]:rounded-none data-[vaul-drawer-direction=bottom]:border-0">
          <DrawerHeader className="border-b px-4 py-3 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <DrawerTitle className="flex items-center gap-2 text-base">
                  <MonitorPlay className="size-4 text-primary" />
                  Preview de projeção
                </DrawerTitle>
                <DrawerDescription>
                  Visualização ampliada das saídas selecionadas no dashboard.
                </DrawerDescription>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon-sm" className="rounded-xl">
                  <X />
                  <span className="sr-only">Fechar preview</span>
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-auto p-4 sm:p-6">
            {hasPreviewUrl ? (
              <PreviewGrid
                dualView={dualView}
                view1={view1}
                view2={view2}
                getFullUrl={getFullUrl}
                className=""
                fullscreen
              />
            ) : (
              <PreviewMissingState
                serverName={activeServer?.name}
                serverUrl={activeServer?.url}
                serverInfoResponse={serverInfoResponse}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

function PreviewMissingState({
  serverName,
  serverUrl,
  serverInfoResponse,
  className,
}: {
  serverName?: string;
  serverUrl?: string;
  serverInfoResponse: unknown;
  className?: string;
}) {
  const serverData = readRecord(serverInfoResponse);
  const fallbackLocation =
    serverData?.ip_list?.[0] ||
    serverData?.ip ||
    serverData?.address ||
    serverUrl ||
    null;

  return (
    <div className={cn("flex w-full items-center", className)}>
      <Alert className="border-dashed bg-muted/30">
        <Layout className="size-4 text-primary" />
        <AlertTitle>Preview nao configurado</AlertTitle>
        <AlertDescription>
          Configure a URL do preview nas configuracoes do servidor
          {serverName ? ` "${serverName}"` : ""} para liberar a projecao embutida.
          {fallbackLocation ? ` Servidor atual: ${fallbackLocation}.` : ""}
        </AlertDescription>
      </Alert>
    </div>
  );
}

function readRecord(value: unknown) {
  if (!value || typeof value !== "object") return undefined;

  const source = value as Record<string, unknown>;
  const ipList = Array.isArray(source.ip_list)
    ? source.ip_list.filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0,
      )
    : undefined;
  const ip = typeof source.ip === "string" ? source.ip : undefined;
  const address =
    typeof source.address === "string" ? source.address : undefined;
  const port =
    typeof source.port === "number"
      ? source.port
      : typeof source.port === "string" && source.port.trim()
        ? Number(source.port)
        : undefined;

  return {
    ip_list: ipList,
    ip,
    address,
    port: Number.isFinite(port) ? port : undefined,
  };
}

function PreviewGrid({
  dualView,
  view1,
  view2,
  getFullUrl,
  className,
  fullscreen = false,
}: {
  dualView: boolean;
  view1: string;
  view2: string;
  getFullUrl: (path: string) => string;
  className?: string;
  fullscreen?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid w-full gap-2 transition-all duration-300",
        dualView ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1",
        className,
      )}
    >
      <PreviewFrame
        src={getFullUrl(view1)}
        title="Holyrics View 1"
        label={VIEWS.find((v) => v.path === view1)?.label}
        fullscreen={fullscreen}
      />

      {dualView && (
        <PreviewFrame
          src={getFullUrl(view2)}
          title="Holyrics View 2"
          label={VIEWS.find((v) => v.path === view2)?.label}
          fullscreen={fullscreen}
        />
      )}
    </div>
  );
}

function PreviewFrame({
  src,
  title,
  label,
  fullscreen = false,
}: {
  src: string;
  title: string;
  label?: string;
  fullscreen?: boolean;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-card shadow-inner",
        fullscreen ? "aspect-video" : "aspect-video",
      )}
    >
      <iframe src={src} className="h-full w-full border-0" title={title} />
      <div className="absolute left-3 top-3 rounded-full border bg-background/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/80 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
        {label}
      </div>
    </div>
  );
}
