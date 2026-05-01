import { createFileRoute } from '@tanstack/react-router'
import { ProjectionPreview } from '@/components/dashboard/projection-preview'
import { RecentActivities } from '@/components/dashboard/recent-activities'
import { AppPage, PageHeader, SplitPanelSection, StatusChip } from '@/components/design-system'

export const Route = createFileRoute('/')({
  component: DashboardPage,
})

// eslint-disable-next-line react-refresh/only-export-components
function DashboardPage() {
  return (
    <AppPage>
      <PageHeader
        eyebrow="Overview"
        title="Visão rápida do culto"
        description="Acompanhe a projeção ao vivo e mantenha a fila de mídias acessível sem excesso de informação."
        actions={
          <>
            <StatusChip tone="success">servidor conectado</StatusChip>
            <StatusChip tone="primary">preview ao vivo</StatusChip>
          </>
        }
      />

      <SplitPanelSection
        primary={<ProjectionPreview />}
        secondary={<RecentActivities />}
      />
    </AppPage>
  )
}

