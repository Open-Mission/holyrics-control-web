import { Link } from '@tanstack/react-router'
import { CheckIcon, ChevronsUpDownIcon, PlusIcon, ServerIcon, Settings2Icon } from 'lucide-react'

import { StatusChip } from '@/components/design-system'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useServerStore } from '@/hooks/use-server-store'
import { cn } from '@/lib/utils'

export function ServerSwitcher() {
  const { activeServer, servers, switchServer, hasServers } = useServerStore()

  if (!hasServers || !activeServer) {
    return (
      <StatusChip className="hidden md:inline-flex">
        sem servidor ativo
      </StatusChip>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-10 rounded-xl gap-2 px-3">
          <ServerIcon className="size-4 text-primary" />
          <span className="hidden max-w-40 truncate sm:inline">{activeServer.name}</span>
          <ChevronsUpDownIcon className="size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 rounded-xl">
        <DropdownMenuLabel className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Servidores
        </DropdownMenuLabel>
        {servers.map((server) => {
          const isActive = server.id === activeServer.id
          return (
            <DropdownMenuItem
              key={server.id}
              onClick={() => switchServer(server.id)}
              className="flex items-start justify-between gap-3 rounded-lg py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{server.name}</span>
                  {isActive ? <StatusChip tone="primary">ativo</StatusChip> : null}
                </div>
                <p className="truncate text-xs text-muted-foreground">{server.url}</p>
              </div>
              <CheckIcon
                className={cn(
                  'mt-0.5 size-4 shrink-0 text-primary opacity-0',
                  isActive && 'opacity-100'
                )}
              />
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="rounded-lg">
          <Link to="/settings" search={{ tab: 'servers' } as never}>
            <Settings2Icon className="size-4" />
            Gerenciar servidores
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="rounded-lg">
          <Link to="/settings" search={{ tab: 'servers', mode: 'create' } as never}>
            <PlusIcon className="size-4" />
            Novo servidor
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
