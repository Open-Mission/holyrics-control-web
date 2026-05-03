import { useState } from 'react'
import { ServerCogIcon } from 'lucide-react'

import { SectionBlock, SurfaceCard } from '@/components/design-system'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useServerStore } from '@/hooks/use-server-store'
import {
  isValidHttpUrl,
  normalizeServerUrl,
  saveServerAuthState,
} from '@/lib/server-storage'
import { toast } from 'sonner'

interface ServerFormState {
  name: string
  url: string
  previewUrl: string
  authToken: string
}

const INITIAL_STATE: ServerFormState = {
  name: '',
  url: 'http://localhost:8091',
  previewUrl: '',
  authToken: '',
}

export function ServerOnboardingCard() {
  const { createServer } = useServerStore()
  const [form, setForm] = useState<ServerFormState>(INITIAL_STATE)
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!form.name.trim()) {
      toast.error('Informe um nome para o servidor.')
      return
    }

    if (!isValidHttpUrl(form.url)) {
      toast.error('Use uma URL http(s) válida para o Holyrics.')
      return
    }

    if (form.previewUrl.trim() && !isValidHttpUrl(form.previewUrl)) {
      toast.error('Use uma URL http(s) válida para o preview.')
      return
    }

    setIsSaving(true)
    try {
      const createdServer = createServer({
        name: form.name.trim(),
        url: normalizeServerUrl(form.url),
        previewUrl: form.previewUrl.trim()
          ? normalizeServerUrl(form.previewUrl)
          : null,
      })
      if (form.authToken.trim()) {
        saveServerAuthState(createdServer.id, { token: form.authToken.trim() })
      }
      toast.success('Servidor criado. Continue a configuração neste contexto.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <SurfaceCard className="mx-auto w-full max-w-3xl p-6 sm:p-8">
      <SectionBlock
        title="Registrar o primeiro servidor"
        description="Crie o primeiro contexto antes de autenticar e sincronizar músicas, temas e playlists. Tudo o que vier depois ficará isolado por servidor."
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="server-name">Nome</FieldLabel>
              <Input
                id="server-name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Produção, Teste, Auditório..."
              />
              <FieldDescription>
                Use um nome curto para identificar o ambiente no cabeçalho.
              </FieldDescription>
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel htmlFor="server-url">URL</FieldLabel>
              <Input
                id="server-url"
                value={form.url}
                onChange={(event) =>
                  setForm((current) => ({ ...current, url: event.target.value }))
                }
                placeholder="http://localhost:8091"
              />
              <FieldDescription>
                Use a URL direta do Holyrics. Para acesso web, inclua o `api_key` na query string.
              </FieldDescription>
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel htmlFor="server-preview-url">URL do preview</FieldLabel>
              <Input
                id="server-preview-url"
                value={form.previewUrl}
                onChange={(event) =>
                  setForm((current) => ({ ...current, previewUrl: event.target.value }))
                }
                placeholder="http://localhost:3000"
              />
              <FieldDescription>
                Opcional. Use a URL da interface web para abrir o preview deste servidor.
              </FieldDescription>
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel htmlFor="server-auth-token">Token de autenticação</FieldLabel>
              <Input
                id="server-auth-token"
                value={form.authToken}
                onChange={(event) =>
                  setForm((current) => ({ ...current, authToken: event.target.value }))
                }
                placeholder="Opcional"
              />
              <FieldDescription>
                Se já souber o token deste ambiente, deixe-o salvo para reutilizar na autenticação.
              </FieldDescription>
            </Field>
          </FieldGroup>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving} className="gap-2">
              <ServerCogIcon className="size-4" />
              {isSaving ? 'Salvando...' : 'Criar servidor'}
            </Button>
          </div>
        </form>
      </SectionBlock>
    </SurfaceCard>
  )
}
