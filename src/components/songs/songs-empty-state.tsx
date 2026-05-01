import { Music2Icon, RefreshCwIcon, WifiOffIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SongsEmptyStateProps {
  onSync: () => void
}

export function SongsEmptyState({ onSync }: SongsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
      <div className="relative">
        <div className="size-20 rounded-3xl bg-linear-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
          <Music2Icon className="size-9 text-primary/70" />
        </div>
        <div className="absolute -bottom-1 -right-1 size-7 rounded-xl bg-muted border flex items-center justify-center">
          <WifiOffIcon className="size-3.5 text-muted-foreground" />
        </div>
      </div>
      <div>
        <h3 className="text-xl font-bold tracking-tight">Nenhuma música salva</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs leading-relaxed">
          As músicas ainda não foram sincronizadas. Clique em <strong>Atualizar</strong> para
          buscar todas as músicas do Holyrics e salvá-las localmente.
        </p>
      </div>
      <Button onClick={onSync} className="gap-2 shadow-md" id="btn-empty-sync-songs">
        <RefreshCwIcon className="size-4" />
        Sincronizar Músicas Agora
      </Button>
    </div>
  )
}
