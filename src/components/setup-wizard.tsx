import { useState } from 'react'
import { CheckCircle2Icon, CircleDashedIcon, LoaderIcon, XIcon, RefreshCwIcon, SparklesIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { SETUP_STEPS, type SetupStep, useSetupStore } from '@/hooks/use-setup-store'
import { useSongsStore } from '@/hooks/use-songs-store'
import { fetchGlobalSettings } from '@/lib/global-settings'

interface SetupWizardProps {
  /** Called when setup is fully completed or dismissed */
  onClose?: () => void
}

export function SetupWizard({ onClose }: SetupWizardProps) {
  const setup = useSetupStore()
  const songsStore = useSongsStore()
  const [syncingStep, setSyncingStep] = useState<SetupStep | null>(null)

  const handleSyncSongs = async () => {
    setSyncingStep('songs')
    try {
      await fetchGlobalSettings()
      const songs = await songsStore.syncSongs()
      setup.markStepCompleted('songs')
      toast.success(`${songs.length} músicas e global settings sincronizadas com sucesso!`)
    } catch {
      toast.error('Erro ao sincronizar músicas/global settings. Verifique a conexão com o Holyrics.')
    } finally {
      setSyncingStep(null)
    }
  }

  const handleSync = async (step: SetupStep) => {
    if (step === 'songs') return handleSyncSongs()
    // Future steps will be handled here
  }

  const handleDismiss = () => {
    setup.dismissSetup()
    onClose?.()
  }

  const handleComplete = () => {
    onClose?.()
  }

  return (
    <div className="rounded-2xl border bg-gradient-to-br from-primary/5 via-card to-card shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="relative flex items-start justify-between p-6 pb-4 border-b bg-muted/20">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 border border-primary/20 text-xl shrink-0">
            <SparklesIcon className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight">Configuração Inicial</h2>
            <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
              Sincronize os recursos do Holyrics para uso offline.
              Isso garante que a lista de músicas fique disponível sem necessidade de buscar no servidor toda vez.
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 -mt-1 -mr-2 size-8 text-muted-foreground hover:text-foreground"
          onClick={handleDismiss}
        >
          <XIcon className="size-4" />
        </Button>
      </div>

      {/* Steps */}
      <div className="p-6 space-y-3">
        {SETUP_STEPS.map((step) => {
          const isCompleted = setup.isStepCompleted(step.id)
          const isSyncing = syncingStep === step.id

          return (
            <div
              key={step.id}
              className={`
                flex items-center gap-4 p-4 rounded-xl border transition-all duration-300
                ${isCompleted
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50'
                  : 'bg-background border-border hover:border-primary/30'
                }
              `}
            >
              {/* Status icon */}
              <div className={`shrink-0 size-9 rounded-lg flex items-center justify-center text-base font-semibold
                ${isCompleted ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-muted'}
              `}>
                {isSyncing ? (
                  <LoaderIcon className="size-4 text-primary animate-spin" />
                ) : isCompleted ? (
                  <CheckCircle2Icon className="size-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <CircleDashedIcon className="size-5 text-muted-foreground" />
                )}
              </div>

              {/* Label + desc */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{step.icon}</span>
                  <span className={`text-sm font-semibold ${isCompleted ? 'text-emerald-700 dark:text-emerald-400' : ''}`}>
                    {step.label}
                  </span>
                  {isCompleted && (
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-500 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full">
                      Sincronizado
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                {step.id === 'songs' && songsStore.hasSongs && isCompleted && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                    {songsStore.songs.length} músicas disponíveis offline
                  </p>
                )}
              </div>

              {/* Action */}
              <Button
                size="sm"
                variant={isCompleted ? 'outline' : 'default'}
                disabled={isSyncing}
                onClick={() => handleSync(step.id)}
                className={`shrink-0 ${isCompleted ? 'text-xs' : ''}`}
              >
                {isSyncing ? (
                  <>
                    <LoaderIcon className="mr-1.5 size-3 animate-spin" />
                    Sincronizando...
                  </>
                ) : isCompleted ? (
                  <>
                    <RefreshCwIcon className="mr-1.5 size-3" />
                    Atualizar
                  </>
                ) : (
                  'Sincronizar'
                )}
              </Button>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/10">
        <p className="text-xs text-muted-foreground">
          {setup.isSetupComplete
            ? '✅ Todos os recursos foram sincronizados'
            : `${setup.completed.length}/${SETUP_STEPS.length} itens concluídos`}
        </p>
        <div className="flex items-center gap-2">
          {!setup.isSetupComplete && (
            <Button variant="ghost" size="sm" onClick={handleDismiss} className="text-xs">
              Fazer depois
            </Button>
          )}
          {setup.isSetupComplete && (
            <Button size="sm" onClick={handleComplete} className="text-xs">
              Concluir
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
