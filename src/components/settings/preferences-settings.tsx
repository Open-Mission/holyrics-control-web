import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useGetApiV1SettingsWallpaper } from '@/lib/holyrics'
import { SettingsIcon, ImageIcon } from 'lucide-react'

export function PreferencesSettings() {
  const { data, isLoading, error } = useGetApiV1SettingsWallpaper()

  return (
    <Card className="shadow-md bg-card/50 backdrop-blur-sm border-muted/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SettingsIcon className="size-5 text-primary" />
          Preferências da Interface
        </CardTitle>
        <CardDescription>
          Configurações de apresentação do Holyrics.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between rounded-xl border p-5 bg-background/50 shadow-sm group hover:bg-background transition-all">
          <div className="flex items-center gap-4">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ImageIcon className="size-6 text-primary" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-base font-bold tracking-tight">Plano de Fundo Atual</h3>
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Carregando..." : error ? "Erro ao carregar" : data?.data ? "Configurado" : "Nenhum papel de parede definido"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`size-2 rounded-full ${data?.data ? 'bg-emerald-500' : 'bg-muted'}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {data?.data ? 'ATIVO' : 'INATIVO'}
            </span>
          </div>
        </div>
        
        <p className="text-xs text-center text-muted-foreground opacity-50">
          Mais preferências serão adicionadas em breve.
        </p>
      </CardContent>
    </Card>
  )
}
