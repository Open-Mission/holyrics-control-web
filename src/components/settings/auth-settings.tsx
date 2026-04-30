import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group'
import { Field, FieldLabel, FieldGroup, FieldDescription } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { KeyIcon, LogInIcon, RefreshCwIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { getApiV1AuthLoginHash, getApiV1AuthLoginToken } from '@/lib/holyrics'
import { SetupWizard } from '@/components/setup-wizard'
import { useSetupStore } from '@/hooks/use-setup-store'

export function AuthSettings() {
  const [token, setToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const queryClient = useQueryClient()
  const setup = useSetupStore()

  const handleLoginToken = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setIsLoading(true)
    try {
      await getApiV1AuthLoginToken({ token })
      toast.success('Login efetuado com sucesso!')
      queryClient.invalidateQueries()
      if (setup.needsSetup) setShowSetup(true)
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
      if (setup.needsSetup) setShowSetup(true)
    } catch (error) {
      toast.error('Nenhuma sessão ativa encontrada')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
    <div className="grid gap-6 md:grid-cols-2 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="border-primary/50 shadow-md bg-card/50 backdrop-blur-sm overflow-hidden group hover:border-primary transition-all duration-300">
        <CardHeader className="relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <RefreshCwIcon className="size-24 -mr-8 -mt-8 rotate-12" />
          </div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <RefreshCwIcon className="size-5 text-primary animate-spin-slow" />
            Conectar / Re-autenticar
          </CardTitle>
          <CardDescription>
            Conecte-se utilizando a sessão padrão. O servidor usará o token já configurado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            A autenticação padrão usa o hash de sessão. Recomendado caso o token já esteja salvo no servidor para evitar reconfiguração.
          </p>
        </CardContent>
        <CardFooter className="border-t bg-muted/30 px-6 py-4 mt-auto">
          <Button onClick={handleLoginHash} disabled={isLoading} className="w-full sm:w-auto shadow-sm">
            <LogInIcon className="mr-2 size-4" />
            Autenticar Agora
          </Button>
        </CardFooter>
      </Card>

      <Card className="shadow-md bg-card/50 backdrop-blur-sm overflow-hidden group hover:border-muted-foreground/30 transition-all duration-300">
        <form onSubmit={handleLoginToken}>
          <CardHeader className="relative">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <KeyIcon className="size-24 -mr-8 -mt-8 rotate-12" />
            </div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <KeyIcon className="size-5 text-muted-foreground" />
              Novo Token
            </CardTitle>
            <CardDescription>
              Apenas necessário caso queira alterar ou inserir um token diferente no servidor.
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
                    className="bg-background/50"
                  />
                </InputGroup>
                <FieldDescription>
                  O token pode ser encontrado nas configurações de rede do Holyrics.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter className="border-t bg-muted/30 px-6 py-4">
            <Button variant="secondary" type="submit" disabled={!token || isLoading} className="w-full sm:w-auto shadow-sm">
              <KeyIcon className="mr-2 size-4" />
              Atualizar Token
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>

    {/* Setup wizard — shown after first successful connection */}
    {showSetup && (
      <div className="animate-in fade-in slide-in-from-top-4 duration-500">
        <SetupWizard onClose={() => setShowSetup(false)} />
      </div>
    )}
    </div>
  )
}
