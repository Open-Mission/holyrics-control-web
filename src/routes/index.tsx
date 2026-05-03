import { createFileRoute } from "@tanstack/react-router";
import { ProjectionPreview } from "@/components/dashboard/projection-preview";
import { RecentActivities } from "@/components/dashboard/recent-activities";
import {
  AppPage,
  PageHeader,
  SplitPanelSection,
  StatusChip,
} from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { SetupWizard } from "@/components/setup-wizard";
import { ServerOnboardingCard } from "@/components/onboarding/server-onboarding-card";
import { useProjectionPreviewVisibility } from "@/hooks/use-projection-preview-visibility";
import { useServerStore } from "@/hooks/use-server-store";
import { useSetupStore } from "@/hooks/use-setup-store";
import { Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

// eslint-disable-next-line react-refresh/only-export-components
function DashboardPage() {
  const { activeServer, needsOnboarding } = useServerStore();
  const setup = useSetupStore();
  const { isVisible: isProjectionPreviewVisible, toggle: toggleProjectionPreview } =
    useProjectionPreviewVisibility();

  if (needsOnboarding) {
    return (
      <AppPage narrow>
        <PageHeader
          eyebrow="Onboarding"
          title="Preparar o primeiro ambiente"
          description="Cadastre um servidor Holyrics local para desbloquear autenticação, setup e sincronização offline com isolamento por contexto."
          meta={<StatusChip tone="primary">multi-server</StatusChip>}
        />

        <ServerOnboardingCard />
      </AppPage>
    );
  }

  return (
    <AppPage>
      <PageHeader
        eyebrow="Overview"
        title="Visão rápida do culto"
        description="Acompanhe a projeção ao vivo e mantenha a fila de mídias acessível sem excesso de informação."
        meta={
          <>
            <StatusChip tone="success">
              {activeServer?.name ?? "servidor ativo"}
            </StatusChip>
          </>
        }
        actions={
          <Button
            variant={isProjectionPreviewVisible ? "secondary" : "outline"}
            size="sm"
            onClick={toggleProjectionPreview}
          >
            {isProjectionPreviewVisible ? (
              <EyeOff data-icon="inline-start" />
            ) : (
              <Eye data-icon="inline-start" />
            )}
            {isProjectionPreviewVisible ? "Ocultar preview" : "Mostrar preview"}
          </Button>
        }
      />

      {setup.needsSetup ? <SetupWizard /> : null}

      <SplitPanelSection
        primary={isProjectionPreviewVisible ? <ProjectionPreview /> : null}
        secondary={<RecentActivities />}
      />
    </AppPage>
  );
}
