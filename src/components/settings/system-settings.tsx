import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useGetApiV1SystemTokenInfo } from '@/lib/holyrics'
import { ActivityIcon, ServerIcon, ShieldCheckIcon, CpuIcon } from 'lucide-react'

export function SystemSettings() {
  const { data, isLoading, error } = useGetApiV1SystemTokenInfo()

  const tokenData = data?.data as Record<string, any> | undefined

  return (
    <Card className="shadow-md bg-card/50 backdrop-blur-sm border-muted/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ServerIcon className="size-5 text-primary" />
          Informações do Sistema
        </CardTitle>
        <CardDescription>
          Status da conexão e informações detalhadas do servidor Holyrics.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-32 flex-col items-center justify-center text-muted-foreground gap-3">
            <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Carregando informações...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col h-32 items-center justify-center text-destructive bg-destructive/5 rounded-xl border border-destructive/20 p-6 text-center gap-2">
            <ActivityIcon className="size-8 opacity-50" />
            <p className="font-medium">Não foi possível carregar as informações.</p>
            <p className="text-sm opacity-80">Verifique sua conexão ou realize o login para tentar novamente.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-4 rounded-xl border p-4 bg-background/50 shadow-sm transition-all hover:shadow-md hover:bg-background">
                <div className="size-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <ShieldCheckIcon className="size-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status da Conexão</span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {tokenData ? 'Conectado' : 'Aguardando'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-xl border p-4 bg-background/50 shadow-sm transition-all hover:shadow-md hover:bg-background">
                <div className="size-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <CpuIcon className="size-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Identificador</span>
                  <span className="text-lg font-bold font-mono">
                    {tokenData?.id || '---'}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-muted/20 overflow-hidden">
              <div className="bg-muted/30 px-4 py-2 border-b">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Detalhes do Token</span>
              </div>
              <div className="p-4 grid gap-3 sm:grid-cols-2">
                {tokenData ? (
                  Object.entries(tokenData).map(([key, value]) => (
                    <div key={key} className="flex flex-col gap-1 p-2 rounded-lg bg-background/40 border border-transparent hover:border-muted/50 transition-colors">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{key}</span>
                      <span className="text-sm font-medium font-mono break-all">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-8 text-center text-muted-foreground italic">
                    Nenhum detalhe disponível
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
