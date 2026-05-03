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
      <Button
        asChild
        variant="ghost"
        className="h-12 w-full justify-start gap-3 rounded-xl border border-dashed border-sidebar-border/80 bg-sidebar-accent/30 px-3 text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:border-solid"
      >
        <Link to="/settings" search={{ tab: 'servers', mode: 'create' } as never}>
          <ServerIcon className="size-4 shrink-0 text-sidebar-primary" />
          <span className="truncate group-data-[collapsible=icon]:hidden">sem servidor ativo</span>
        </Link>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-12 w-full justify-start gap-3 rounded-xl border border-sidebar-border/70 bg-sidebar-accent/40 px-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <ServerIcon className="size-4 shrink-0 text-sidebar-primary" />
          <div className="flex min-w-0 flex-1 flex-col items-start text-left group-data-[collapsible=icon]:hidden">
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/55">
              Servidor
            </span>
            <span className="w-full truncate text-sm font-medium">{activeServer.name}</span>
          </div>
          <ChevronsUpDownIcon className="size-4 shrink-0 text-sidebar-foreground/55 group-data-[collapsible=icon]:hidden" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="right" className="w-72 rounded-xl">
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
