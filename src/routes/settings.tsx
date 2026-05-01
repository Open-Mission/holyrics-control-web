import { createFileRoute } from '@tanstack/react-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ShieldIcon, SettingsIcon, MonitorSmartphoneIcon } from 'lucide-react'
import { AuthSettings } from '@/components/settings/auth-settings'
import { SystemSettings } from '@/components/settings/system-settings'
import { PreferencesSettings } from '@/components/settings/preferences-settings'
import { ConnectionStatusCard } from '@/components/settings/connection-status-card'
import { AppPage, PageHeader, StatusChip } from '@/components/design-system'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <AppPage narrow>
      <PageHeader
        eyebrow="Workspace"
        title="Configurações"
        description="Gerencie autenticação, comportamento do sistema e preferências do operador sem sair do mesmo padrão visual do restante da aplicação."
        actions={<StatusChip tone="primary">configuração central</StatusChip>}
      />

      <ConnectionStatusCard />

      <Tabs defaultValue="auth" className="flex flex-col gap-8 w-full">
        <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0">
          <TabsList className="h-auto w-full justify-start rounded-2xl border bg-muted/55 p-1.5">
            <TabsTrigger value="auth" className="gap-2.5 py-2.5 px-4 rounded-lg data-[state=active]:shadow-md transition-all">
              <ShieldIcon className="size-4" />
              Autenticação
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2.5 py-2.5 px-4 rounded-lg data-[state=active]:shadow-md transition-all">
              <MonitorSmartphoneIcon className="size-4" />
              Sistema
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2.5 py-2.5 px-4 rounded-lg data-[state=active]:shadow-md transition-all">
              <SettingsIcon className="size-4" />
              Preferências
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="auth" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <AuthSettings />
        </TabsContent>
        <TabsContent value="system" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <SystemSettings />
        </TabsContent>
        <TabsContent value="settings" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <PreferencesSettings />
        </TabsContent>
      </Tabs>
    </AppPage>
  )
}
