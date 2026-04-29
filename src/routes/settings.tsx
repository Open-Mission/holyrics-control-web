/* eslint-disable @typescript-eslint/no-unused-vars */
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group'
import { Field, FieldLabel, FieldGroup, FieldDescription } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { KeyIcon, ShieldIcon, SettingsIcon, LogInIcon, RefreshCwIcon, MonitorSmartphoneIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { getApiV1AuthLoginHash, getApiV1AuthLoginToken, useGetApiV1SettingsWallpaper, useGetApiV1SystemTokenInfo } from '@/lib/holyrics'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-5xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie a autenticação e preferências do sistema.
        </p>
      </div>

      <Tabs defaultValue="auth" className="flex flex-col gap-6 w-full">
        <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0">
          <TabsList className="w-full justify-start h-auto p-1 bg-muted/50">
            <TabsTrigger value="auth" className="gap-2 py-2">
              <ShieldIcon className="size-4" />
              Autenticação
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2 py-2">
              <MonitorSmartphoneIcon className="size-4" />
              Sistema
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 py-2">
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
    </div>
  )
}

function AuthSettings() {
  const [token, setToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const queryClient = useQueryClient()

  const handleLoginToken = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setIsLoading(true)
    try {
      await getApiV1AuthLoginToken({ token })
      toast.success('Login efetuado com sucesso!')
      queryClient.invalidateQueries()
    } catch (error) {
      toast.error('Erro ao efetuar login com token')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoginHash = async () => {
    setIsLoading(true)
    try {
      await getApiV1AuthLoginHash()
      toast.success('Sessão restaurada com sucesso!')
      queryClient.invalidateQueries()
    } catch (error) {
      toast.error('Nenhuma sessão ativa encontrada')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 items-start">
      <Card className="border-primary/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <RefreshCwIcon className="size-5 text-primary" />
            Conectar / Re-autenticar
          </CardTitle>
          <CardDescription>
            Conecte-se utilizando a sessão padrão. O servidor usará o token já configurado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            A autenticação padrão usa o hash de sessão. Recomendado caso o token já esteja salvo no servidor para evitar reconfiguração.
          </p>
        </CardContent>
        <CardFooter className="border-t bg-muted/20 px-6 py-4 mt-auto">
          <Button onClick={handleLoginHash} disabled={isLoading} className="w-full sm:w-auto">
            <LogInIcon data-icon="inline-start" />
            Autenticar Agora
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <form onSubmit={handleLoginToken}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <KeyIcon className="size-5 text-muted-foreground" />
              Novo Token
            </CardTitle>
            <CardDescription>
              Apenas necessário caso queira alterar ou inserir um token diferente do servidor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="token">Token Manual</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="token"
                    placeholder="Insira o novo token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                </InputGroup>
                <FieldDescription>
                  O token pode ser encontrado nas configurações de rede do Holyrics.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter className="border-t bg-muted/20 px-6 py-4">
            <Button variant="secondary" type="submit" disabled={!token || isLoading} className="w-full sm:w-auto">
              <KeyIcon data-icon="inline-start" />
              Atualizar Token
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

function SystemSettings() {
  const { data, isLoading, error } = useGetApiV1SystemTokenInfo()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações do Sistema</CardTitle>
        <CardDescription>
          Status da conexão e informações do servidor Holyrics.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            Carregando informações...
          </div>
        ) : error ? (
          <div className="flex h-32 items-center justify-center text-destructive bg-destructive/10 rounded-md border border-destructive/20 p-4">
            Não foi possível carregar as informações. Verifique sua conexão ou realize o login.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1 rounded-lg border p-4 bg-muted/10">
              <span className="text-sm font-medium text-muted-foreground">Status da Conexão</span>
              <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                {data ? 'Conectado' : 'Aguardando'}
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-lg border p-4 bg-muted/10">
              <span className="text-sm font-medium text-muted-foreground">Token Info</span>
              <span className="text-sm font-mono truncate">
                {JSON.stringify(data) || 'N/A'}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function PreferencesSettings() {
  const { data, isLoading, error } = useGetApiV1SettingsWallpaper()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferências da Interface</CardTitle>
        <CardDescription>
          Configurações de apresentação do Holyrics.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/10">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Plano de Fundo Atual</h3>
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Carregando..." : error ? "Erro ao carregar" : data ? "Configurado" : "Nenhum"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
