import { createFileRoute } from '@tanstack/react-router'
import { ProjectionPreview } from '@/components/dashboard/projection-preview'
import { RecentActivities } from '@/components/dashboard/recent-activities'
import { AppPage, PageHeader, SplitPanelSection, StatusChip } from '@/components/design-system'
import { SetupWizard } from '@/components/setup-wizard'
import { ServerOnboardingCard } from '@/components/onboarding/server-onboarding-card'
import { useServerStore } from '@/hooks/use-server-store'
import { useSetupStore } from '@/hooks/use-setup-store'

export const Route = createFileRoute('/')({
  component: DashboardPage,
})

// eslint-disable-next-line react-refresh/only-export-components
function DashboardPage() {
  const { activeServer, needsOnboarding } = useServerStore()
  const setup = useSetupStore()

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
    )
  }

  return (
    <AppPage>
      <PageHeader
        eyebrow="Overview"
        title="Visão rápida do culto"
        description="Acompanhe a projeção ao vivo e mantenha a fila de mídias acessível sem excesso de informação."
        meta={
          <>
            <StatusChip tone="success">{activeServer?.name ?? 'servidor ativo'}</StatusChip>
            <StatusChip tone="primary">preview ao vivo</StatusChip>
          </>
        }
      />

      {setup.needsSetup ? <SetupWizard /> : null}

      <SplitPanelSection
        primary={<ProjectionPreview />}
        secondary={<RecentActivities />}
      />
    </AppPage>
  )
}
