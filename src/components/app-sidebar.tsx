import {
  Home,
  Music,
  PlaySquare,
  Settings,
  Layers,
  Search,
  PlusCircle,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const items = [
  {
    title: "Início",
    url: "/",
    icon: Home,
  },
  {
    title: "Músicas",
    url: "/songs",
    icon: Music,
  },
  {
    title: "Playlists",
    url: "/playlists",
    icon: PlaySquare,
  },
  {
    title: "Temas",
    url: "/themes",
    icon: Layers,
  },
  {
    title: "Pesquisar",
    url: "/search",
    icon: Search,
  },
  {
    title: "Configurações",
    url: "/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex flex-row items-center gap-2 p-4">
        <div className="flex aspect-square size-8 items-center justify-center rounded-sm overflow-hidden">
          <img src="/logo.png" alt="Holyrics Logo" className="size-full object-container" />
        </div>
        <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
          <span className="font-semibold uppercase tracking-wider">Holyrics</span>
          <span className="text-xs text-muted-foreground">Control Server</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="group-data-[collapsible=icon]:size-8">
              <PlusCircle />
              <span className="group-data-[collapsible=icon]:hidden">Nova Projeção</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
