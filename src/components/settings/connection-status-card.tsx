import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ActivityIcon } from 'lucide-react'
import { useConnectionStatusQuery } from '@/api/holyrics'
import { useServerStore } from '@/hooks/use-server-store'

export function ConnectionStatusCard() {
  const { activeServer } = useServerStore()
  const { data, error } = useConnectionStatusQuery({ refetchInterval: 5000 })

  const isServerOnline = !error
  const isHolyricsConnected = data?.holyrics === 'connected'

  return (
    <Card className="bg-muted/30 border-dashed shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
          <ActivityIcon className="size-4 text-primary animate-pulse" />
          Monitoramento em Tempo Real
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center justify-between p-4 rounded-xl bg-background border shadow-sm group hover:border-primary/50 transition-all">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Web Server</span>
            <span className="text-sm font-bold tracking-tight">{activeServer?.name ?? 'Sem contexto ativo'}</span>
          </div>
          <div className="flex items-center gap-2.5 bg-muted/30 px-3 py-1.5 rounded-full border">
            <div className={`size-2.5 rounded-full ${isServerOnline ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]'}`} />
            <span className={`text-[11px] font-black tracking-tighter ${isServerOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {isServerOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-background border shadow-sm group hover:border-primary/50 transition-all">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Holyrics App</span>
            <span className="text-sm font-bold tracking-tight">Software Local</span>
          </div>
          <div className="flex items-center gap-2.5 bg-muted/30 px-3 py-1.5 rounded-full border">
            <div className={`size-2.5 rounded-full ${isHolyricsConnected ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]'}`} />
            <span className={`text-[11px] font-black tracking-tighter ${isHolyricsConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {isHolyricsConnected ? 'CONECTADO' : 'DESCONECTADO'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
