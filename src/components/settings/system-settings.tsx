import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useTokenInfoQuery } from '@/api/holyrics'
import { ActivityIcon, ServerIcon, ShieldCheckIcon, CpuIcon, SearchIcon, KeyRoundIcon } from 'lucide-react'

/** Determines if a value should be rendered as a permission/badge list. */
function isPermissionValue(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

/** Determines if a value is a boolean-like field. */
function isBooleanValue(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

function PermissionBadge({ value }: { value: boolean }) {
  return value ? (
    <Badge
      variant="default"
      className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
    >
      Ativo
    </Badge>
  ) : (
    <Badge variant="destructive">Inativo</Badge>
  )
}

export function SystemSettings() {
  const { data: tokenData, isLoading, error } = useTokenInfoQuery()
  const [permissionSearch, setPermissionSearch] = useState('')

  /** Separate entries into scalar fields and permission (array) fields. */
  const { scalarEntries, permissionEntries } = useMemo(() => {
    if (!tokenData) return { scalarEntries: [], permissionEntries: [] }

    const scalar: [string, unknown][] = []
    const permission: [string, unknown[]][] = []

    for (const [key, value] of Object.entries(tokenData)) {
      if (isPermissionValue(value)) {
        permission.push([key, value])
      } else {
        scalar.push([key, value])
      }
    }

    return { scalarEntries: scalar, permissionEntries: permission }
  }, [tokenData])

  /** Filtered permission items (all arrays flattened with their parent key). */
  const filteredPermissions = useMemo(() => {
    const lower = permissionSearch.trim().toLowerCase()
    return permissionEntries.map(([key, items]) => ({
      key,
      items: lower
        ? items.filter((item) => String(item).toLowerCase().includes(lower))
        : items,
    }))
  }, [permissionEntries, permissionSearch])

  const hasPermissions = permissionEntries.length > 0

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
            <p className="text-sm opacity-80">
              Verifique sua conexão ou realize o login para tentar novamente.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ── Summary Cards ─────────────────────────────────── */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-4 rounded-xl border p-4 bg-background/50 shadow-sm transition-all hover:shadow-md hover:bg-background">
                <div className="size-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <ShieldCheckIcon className="size-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Status da Conexão
                  </span>
                  <Badge
                    variant="default"
                    className={
                      tokenData
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-sm h-auto py-0.5 px-2'
                        : 'bg-muted text-muted-foreground text-sm h-auto py-0.5 px-2'
                    }
                  >
                    {tokenData ? 'Conectado' : 'Aguardando'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-xl border p-4 bg-background/50 shadow-sm transition-all hover:shadow-md hover:bg-background">
                <div className="size-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <CpuIcon className="size-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Identificador
                  </span>
                  <span className="text-lg font-bold font-mono">
                    {tokenData?.id ? String(tokenData.id) : '---'}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Token Details (scalar fields) ─────────────────── */}
            <div className="rounded-xl border bg-muted/20 overflow-hidden">
              <div className="bg-muted/30 px-4 py-2 border-b">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Detalhes do Token
                </span>
              </div>
              <div className="p-4 grid gap-3 sm:grid-cols-2">
                {scalarEntries.length > 0 ? (
                  scalarEntries.map(([key, value]) => (
                    <div
                      key={key}
                      className="flex flex-col gap-1 p-2 rounded-lg bg-background/40 border border-transparent hover:border-muted/50 transition-colors"
                    >
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {key}
                      </span>
                      {isBooleanValue(value) ? (
                        <PermissionBadge value={value} />
                      ) : (
                        <span className="text-sm font-medium font-mono break-all">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-8 text-center text-muted-foreground italic">
                    Nenhum detalhe disponível
                  </div>
                )}
              </div>
            </div>

            {/* ── Permissions (array fields) with search ─────────── */}
            {hasPermissions && (
              <div className="rounded-xl border bg-muted/20 overflow-hidden">
                <div className="bg-muted/30 px-4 py-3 border-b flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <KeyRoundIcon className="size-3.5 text-muted-foreground" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Permissões
                    </span>
                  </div>
                  <div className="relative flex-1 sm:max-w-xs ml-auto">
                    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      id="permission-search"
                      placeholder="Buscar permissão..."
                      value={permissionSearch}
                      onChange={(e) => setPermissionSearch(e.target.value)}
                      className="h-7 pl-8 text-xs bg-background/60"
                    />
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  {filteredPermissions.map(({ key, items }) => (
                    <div key={key}>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">
                        {key}
                      </span>
                      {items.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {items.map((item, i) => (
                            <Badge key={i} variant="secondary" className="font-mono text-xs">
                              {String(item)}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          {permissionSearch
                            ? `Nenhuma permissão encontrada para "${permissionSearch}".`
                            : 'Nenhuma permissão.'}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
