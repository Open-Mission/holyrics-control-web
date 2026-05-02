import { useMemo, useState } from 'react'
import { PencilIcon, PlusIcon, ServerIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'

import {
  EmptyStateSection,
  PageHeader,
  SectionBlock,
  StatusChip,
  SurfaceCard,
} from '@/components/design-system'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useServerStore } from '@/hooks/use-server-store'
import {
  clearServerAuthState,
  isValidHttpUrl,
  loadServerAuthState,
  normalizeServerUrl,
  saveServerAuthState,
} from '@/lib/server-storage'

interface ServerFormState {
  id: string | null
  name: string
  url: string
  previewUrl: string
  authToken: string
}

const EMPTY_FORM: ServerFormState = {
  id: null,
  name: '',
  url: 'http://localhost:8091',
  previewUrl: '',
  authToken: '',
}

export function ServerSettings() {
  const {
    activeServerId,
    servers,
    createServer,
    removeServer,
    switchServer,
    updateServer,
  } = useServerStore()
  const [form, setForm] = useState<ServerFormState>(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [isRemovingId, setIsRemovingId] = useState<string | null>(null)

  const isEditing = Boolean(form.id)
  const sortedServers = useMemo(
    () =>
      [...servers].sort((a, b) =>
        a.id === activeServerId ? -1 : b.id === activeServerId ? 1 : a.name.localeCompare(b.name)
      ),
    [activeServerId, servers]
  )

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

    const payload = {
      name: form.name.trim(),
      url: normalizeServerUrl(form.url),
      previewUrl: form.previewUrl.trim() ? normalizeServerUrl(form.previewUrl) : null,
    }

    setIsSaving(true)
    try {
      if (form.id) {
        updateServer(form.id, payload)
        if (form.authToken.trim()) {
          saveServerAuthState(form.id, { token: form.authToken.trim() })
        } else {
          clearServerAuthState(form.id)
        }
        toast.success('Servidor atualizado.')
      } else {
        const createdServer = createServer(payload)
        if (form.authToken.trim()) {
          saveServerAuthState(createdServer.id, { token: form.authToken.trim() })
        }
        toast.success('Servidor cadastrado.')
      }

      setForm(EMPTY_FORM)
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (serverId: string) => {
    const server = servers.find((item) => item.id === serverId)
    if (!server) return

    setForm({
      id: server.id,
      name: server.name,
      url: server.url,
      previewUrl: server.previewUrl ?? '',
      authToken: loadServerAuthState(server.id)?.token ?? '',
    })
  }

  const handleRemove = async (serverId: string) => {
    setIsRemovingId(serverId)
    try {
      await removeServer(serverId)
      if (form.id === serverId) {
        setForm(EMPTY_FORM)
      }
      toast.success('Servidor removido com seus dados locais.')
    } finally {
      setIsRemovingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Contexto"
        title="Servidores"
        description="Cadastre ambientes locais, alterne o contexto ativo e remova um servidor sem misturar autenticação, setup ou dados offline."
        meta={<StatusChip tone="primary">{servers.length} contextos</StatusChip>}
      />

      {sortedServers.length === 0 ? (
        <EmptyStateSection
          icon={ServerIcon}
          title="Nenhum servidor configurado"
          description="Cadastre o primeiro ambiente para liberar autenticação, setup e sincronização offline."
        />
      ) : (
        <SectionBlock title="Ambientes cadastrados">
          <div className="grid gap-4 xl:grid-cols-2">
            {sortedServers.map((server) => {
              const isActive = server.id === activeServerId
              return (
                <SurfaceCard key={server.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold">{server.name}</h3>
                        {isActive ? <StatusChip tone="success">ativo</StatusChip> : null}
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p className="truncate">URL: {server.url}</p>
                        <p className="truncate">
                          Preview: {server.previewUrl || 'nao configurado'}
                        </p>
                      </div>
                    </div>
                    <ServerIcon className="size-5 shrink-0 text-primary" />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {!isActive ? (
                      <Button size="sm" onClick={() => switchServer(server.id)}>
                        Ativar
                      </Button>
                    ) : null}
                    <Button size="sm" variant="outline" onClick={() => handleEdit(server.id)}>
                      <PencilIcon className="size-3.5" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemove(server.id)}
                      disabled={isRemovingId === server.id}
                    >
                      <Trash2Icon className="size-3.5" />
                      Remover
                    </Button>
                  </div>
                </SurfaceCard>
              )
            })}
          </div>
        </SectionBlock>
      )}

      <SurfaceCard className="p-6">
        <SectionBlock
          title={isEditing ? 'Editar servidor' : 'Novo servidor'}
          description="As URLs são persistidas localmente e cada servidor recebe seu próprio namespace para setup, global settings e cache offline."
          action={
            isEditing ? (
              <Button variant="ghost" size="sm" onClick={() => setForm(EMPTY_FORM)}>
                Cancelar edição
              </Button>
            ) : (
              <StatusChip>
                <PlusIcon className="mr-1 size-3" />
                adicionar
              </StatusChip>
            )
          }
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <FieldGroup className="grid gap-4 md:grid-cols-2">
              <Field className="md:col-span-2">
                <FieldLabel htmlFor="settings-server-name">Nome</FieldLabel>
                <Input
                  id="settings-server-name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Produção"
                />
                <FieldDescription>
                  Este nome aparece no switcher global do cabeçalho.
                </FieldDescription>
              </Field>

              <Field className="md:col-span-2">
                <FieldLabel htmlFor="settings-server-url">URL</FieldLabel>
                <Input
                  id="settings-server-url"
                  value={form.url}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, url: event.target.value }))
                  }
                  placeholder="http://localhost:8091"
                />
                <FieldDescription>
                  Use a URL direta do Holyrics. Em acesso web, inclua o `api_key` na query string da URL base.
                </FieldDescription>
              </Field>

              <Field className="md:col-span-2">
                <FieldLabel htmlFor="settings-server-preview-url">URL do preview</FieldLabel>
                <Input
                  id="settings-server-preview-url"
                  value={form.previewUrl}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, previewUrl: event.target.value }))
                  }
                  placeholder="http://localhost:8091"
                />
                <FieldDescription>
                  Opcional. Use quando o plugin do Holyrics que expoe o preview estiver em outra URL.
                </FieldDescription>
              </Field>

              <Field className="md:col-span-2">
                <FieldLabel htmlFor="settings-auth-token">Token de autenticação</FieldLabel>
                <Input
                  id="settings-auth-token"
                  value={form.authToken}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, authToken: event.target.value }))
                  }
                  placeholder="Opcional"
                />
                <FieldDescription>
                  Token opcional salvo somente neste servidor para reaproveitar na autenticação.
                </FieldDescription>
              </Field>
            </FieldGroup>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving} className="gap-2">
                <ServerIcon className="size-4" />
                {isSaving
                  ? 'Salvando...'
                  : isEditing
                    ? 'Salvar alterações'
                    : 'Cadastrar servidor'}
              </Button>
            </div>
          </form>
        </SectionBlock>
      </SurfaceCard>
    </div>
  )
}
