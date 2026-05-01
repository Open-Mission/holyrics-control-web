import { createFileRoute } from "@tanstack/react-router";
import {
  BellRingIcon,
  LayoutGridIcon,
  ListFilterIcon,
  MonitorPlayIcon,
  PaletteIcon,
  SearchIcon,
  Settings2Icon,
  SparklesIcon,
} from "lucide-react";

import {
  AppPage,
  EmptyStateSection,
  MetricCard,
  PageHeader,
  SearchToolbar,
  SectionBlock,
  SplitPanelSection,
  StatusChip,
  SurfaceCard,
  ToolbarRow,
} from "@/components/design-system";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/design")({
  component: DesignPage,
});

// eslint-disable-next-line react-refresh/only-export-components
function DesignPage() {
  return (
    <AppPage>
      <PageHeader
        eyebrow="Design System"
        title="Minimalismo elegante sobre a base do shadcn"
        description="Esta rota é a referência canônica do sistema visual do projeto. Tudo o que for layout, ritmo, estados e seções de produto deve partir daqui, respeitando os tokens e o preset já configurados."
        meta={<StatusChip tone="success">mobile, tablet e desktop</StatusChip>}
        actions={
          <>
            <Button variant="outline">
              <SparklesIcon data-icon="inline-start" />
              pronto para produção
            </Button>
          </>
        }
      />

      <SectionBlock
        title="Foundations"
        description="A linguagem visual prioriza contraste baixo, superfícies suaves, tipografia firme e acento contido. A cor primária continua sendo o cyan do preset; o design é guiado por composição, não por customizações agressivas."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Background", "Base estrutural para o app"],
            ["Card", "Superfície principal para conteúdo"],
            ["Muted", "Camadas secundárias e agrupamentos"],
            ["Primary", "Realce de ação e estado"],
          ].map(([title, text], index) => (
            <SurfaceCard key={title} size="sm" className="rounded-2xl border">
              <CardHeader>
                <CardTitle className="text-sm">{title}</CardTitle>
                <CardDescription>{text}</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={
                    index === 0
                      ? "h-20 rounded-xl border bg-background"
                      : index === 1
                        ? "h-20 rounded-xl border bg-card"
                        : index === 2
                          ? "h-20 rounded-xl border bg-muted"
                          : "h-20 rounded-xl border border-primary/20 bg-primary/10"
                  }
                />
              </CardContent>
            </SurfaceCard>
          ))}
        </div>
      </SectionBlock>

      <SectionBlock
        title="Primitives"
        description="Essas peças formam o vocabulário do produto: headers, métricas, toolbars, superfícies e chips de estado."
      >
        <div className="app-grid-auto">
          <MetricCard
            label="Músicas sincronizadas"
            value="12.486"
            description="Exemplo de métrica com ênfase moderada."
            icon={LayoutGridIcon}
            tone="primary"
          />
          <MetricCard
            label="Playlists ativas"
            value="248"
            description="O card sustenta leitura rápida em qualquer breakpoint."
            icon={ListFilterIcon}
          />
          <MetricCard
            label="Temas"
            value="36"
            description="A hierarquia visual é a mesma em toda a aplicação."
            icon={PaletteIcon}
          />
          <MetricCard
            label="Conexão"
            value="Online"
            description="Estados podem usar chips, sem redesenhar o componente."
            icon={BellRingIcon}
          />
        </div>

        <ToolbarRow>
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip tone="neutral">sistema base</StatusChip>
            <StatusChip tone="primary">surface-card</StatusChip>
            <StatusChip tone="success">status online</StatusChip>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline">Ação secundária</Button>
            <Button>Ação principal</Button>
          </div>
        </ToolbarRow>

        <SearchToolbar
          value="adoração"
          onValueChange={() => undefined}
          onClear={() => undefined}
          placeholder="Buscar padrões, blocos ou conteúdo..."
          resultLabel={
            <Badge variant="secondary" className="rounded-full">
              18 resultados no sistema
            </Badge>
          }
          actions={
            <>
              <Button variant="outline" size="sm">
                <Settings2Icon data-icon="inline-start" />
                Filtros
              </Button>
              <Button size="sm">
                <SearchIcon data-icon="inline-start" />
                Pesquisar
              </Button>
            </>
          }
        />
      </SectionBlock>

      <SectionBlock
        title="Componentes de apoio"
        description="Os componentes shadcn continuam sendo a base. O design system organiza composição e consistência, não substitui a biblioteca."
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <SurfaceCard className="rounded-2xl border">
            <CardHeader>
              <CardTitle>Tabs como shell de workspace</CardTitle>
              <CardDescription>
                Configurações e áreas densas continuam usando composição padrão
                do shadcn.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="gap-4">
                <TabsList className="h-auto flex-wrap rounded-xl border bg-muted/70 p-1">
                  <TabsTrigger value="overview">Visão geral</TabsTrigger>
                  <TabsTrigger value="content">Conteúdo</TabsTrigger>
                  <TabsTrigger value="settings">Preferências</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="m-0">
                  <div className="rounded-xl border bg-background px-4 py-5 text-sm text-muted-foreground">
                    O shell padroniza margens, profundidade e densidade sem
                    esconder a API dos componentes.
                  </div>
                </TabsContent>
                <TabsContent value="content" className="m-0" />
                <TabsContent value="settings" className="m-0" />
              </Tabs>
            </CardContent>
          </SurfaceCard>

          <SurfaceCard className="rounded-2xl border">
            <CardHeader>
              <CardTitle>Alertas sem ruído visual</CardTitle>
              <CardDescription>
                Estados são claros sem romper a calma visual do layout.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Alert className="rounded-xl border">
                <BellRingIcon />
                <AlertTitle>Conexão estável</AlertTitle>
                <AlertDescription>
                  Use alertas para estados que precisam de contexto curto e
                  acionável.
                </AlertDescription>
              </Alert>
              <Alert variant="destructive" className="rounded-xl border">
                <BellRingIcon />
                <AlertTitle>Falha de autenticação</AlertTitle>
                <AlertDescription>
                  O componente semântico substitui blocos improvisados com borda
                  e fundo manual.
                </AlertDescription>
              </Alert>
            </CardContent>
          </SurfaceCard>
        </div>
      </SectionBlock>

      <SectionBlock
        title="Padrões de seção"
        description="Esses blocos simulam as áreas reais do produto: dashboard, lista pesquisável, preview e workspace de configuração."
      >
        <SplitPanelSection
          primary={
            <SurfaceCard className="rounded-2xl border">
              <CardHeader>
                <CardTitle>Preview / workspace principal</CardTitle>
                <CardDescription>
                  O conteúdo principal recebe espaço e foco sem abandonar o
                  grid.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex aspect-video items-center justify-center rounded-2xl border bg-muted/50 text-muted-foreground">
                  <MonitorPlayIcon className="size-5" />
                </div>
                <Separator />
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border bg-background px-4 py-4 text-sm text-muted-foreground">
                    Painel principal
                  </div>
                  <div className="rounded-xl border bg-background px-4 py-4 text-sm text-muted-foreground">
                    Painel de apoio
                  </div>
                </div>
              </CardContent>
            </SurfaceCard>
          }
          secondary={
            <SurfaceCard className="rounded-2xl border">
              <CardHeader>
                <CardTitle>Lista ou resumo lateral</CardTitle>
                <CardDescription>
                  A coluna secundária agrupa informação derivada, ações
                  auxiliares ou atividades recentes.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {["Abertura", "Momento de louvor", "Leitura", "Avisos"].map(
                  (item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between rounded-xl border bg-background px-4 py-3"
                    >
                      <span className="text-sm font-medium">{item}</span>
                      <StatusChip tone="neutral">ativo</StatusChip>
                    </div>
                  ),
                )}
              </CardContent>
            </SurfaceCard>
          }
        />
      </SectionBlock>

      <EmptyStateSection
        icon={SparklesIcon}
        title="O design system também define vazios"
        description="Estados vazios precisam parecer parte do produto, não telas esquecidas. A composição aqui deve ser reutilizada por músicas, playlists e futuras áreas sem conteúdo."
        action={<Button>Adicionar conteúdo</Button>}
      />
    </AppPage>
  );
}
