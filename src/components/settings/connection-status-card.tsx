import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ActivityIcon, BellRingIcon, WifiIcon } from 'lucide-react'
import { useHolyricsConnection } from '@/hooks/use-holyrics-connection'

export function ConnectionStatusCard() {
  const {
    activeServerName,
    browserOnline,
    holyricsReachable,
    notificationPermission,
    requestNotificationPermission,
  } = useHolyricsConnection()

  return (
    <Card className="bg-muted/30 border-dashed shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
          <ActivityIcon className="size-4 text-primary animate-pulse" />
          Monitoramento em Tempo Real
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-3">
        <div className="flex items-center justify-between p-4 rounded-xl bg-background border shadow-sm group hover:border-primary/50 transition-all">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Dispositivo / Rede</span>
            <span className="text-sm font-bold tracking-tight">{browserOnline ? 'Rede disponível' : 'Sem conectividade'}</span>
          </div>
          <div className="flex items-center gap-2.5 bg-muted/30 px-3 py-1.5 rounded-full border">
            <WifiIcon className="size-3.5 text-muted-foreground" />
            <div className={`size-2.5 rounded-full ${browserOnline ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]'}`} />
            <span className={`text-[11px] font-black tracking-tighter ${browserOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {browserOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-background border shadow-sm group hover:border-primary/50 transition-all">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Holyrics App</span>
            <span className="text-sm font-bold tracking-tight">{activeServerName ?? 'Sem contexto ativo'}</span>
          </div>
          <div className="flex items-center gap-2.5 bg-muted/30 px-3 py-1.5 rounded-full border">
            <div className={`size-2.5 rounded-full ${holyricsReachable ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]' : holyricsReachable === false ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]'}`} />
            <span className={`text-[11px] font-black tracking-tighter ${holyricsReachable ? 'text-emerald-600 dark:text-emerald-400' : holyricsReachable === false ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {holyricsReachable ? 'CONECTADO' : holyricsReachable === false ? 'DESCONECTADO' : 'AGUARDANDO'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-background border shadow-sm group hover:border-primary/50 transition-all">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Notificações</span>
            <span className="text-sm font-bold tracking-tight">
              {notificationPermission === 'granted'
                ? 'Ativadas'
                : notificationPermission === 'denied'
                  ? 'Bloqueadas'
                  : notificationPermission === 'unsupported'
                    ? 'Indisponíveis'
                    : 'Pendente'}
            </span>
          </div>
          <div className="flex items-center gap-2.5 bg-muted/30 px-3 py-1.5 rounded-full border">
            <BellRingIcon className="size-3.5 text-muted-foreground" />
            <span className={`text-[11px] font-black tracking-tighter ${
              notificationPermission === 'granted'
                ? 'text-emerald-600 dark:text-emerald-400'
                : notificationPermission === 'denied'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-amber-600 dark:text-amber-400'
            }`}>
              {notificationPermission === 'granted' ? 'ATIVO' : notificationPermission === 'denied' ? 'NEGADO' : notificationPermission === 'unsupported' ? 'SEM SUPORTE' : 'ATIVAR'}
            </span>
            {notificationPermission === 'default' ? (
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={() => void requestNotificationPermission()}
              >
                PERMITIR
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
