import {
  AudioLines,
  Blocks,
  BookOpen,
  Home,
  Image,
  Music,
  PlaySquare,
  Settings,
  Layers,
  Search,
  PlusCircle,
  CalendarDays,
  Video,
} from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { ServerSwitcher } from "@/components/server/server-switcher";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Link } from "@tanstack/react-router";

const navigationItems = [
  {
    title: "Início",
    url: "/",
    icon: Home,
  },
  {
    title: "Culto",
    url: "/service",
    icon: CalendarDays,
  },
  {
    title: "Playlists",
    url: "/playlists",
    icon: PlaySquare,
  },
  {
    title: "Bíblia",
    url: "/bible",
    icon: BookOpen,
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
];

const mediaItems = [
  {
    title: "Músicas",
    url: "/songs",
    icon: Music,
  },
  {
    title: "Imagens",
    url: "/media/images",
    icon: Image,
  },
  {
    title: "Vídeos",
    url: "/media/videos",
    icon: Video,
  },
  {
    title: "Áudios",
    url: "/media/audios",
    icon: AudioLines,
  },
];

const utilityItems = [
  {
    title: "Design",
    url: "/design",
    icon: Blocks,
  },
];

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="border-b border-sidebar-border/70 p-3">
        <ServerSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/55 group-data-[collapsible=icon]:hidden">
            Navegação
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    className="h-10 rounded-xl px-3 text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                  >
                    <Link to={item.url as never}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/55 group-data-[collapsible=icon]:hidden">
            Mídias
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mediaItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    className="h-10 rounded-xl px-3 text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                  >
                    <Link to={item.url as never}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/55 group-data-[collapsible=icon]:hidden">
            Utilitários
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {utilityItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    className="h-10 rounded-xl px-3 text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                  >
                    <Link to={item.url as never}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/70 p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="h-10 rounded-xl bg-sidebar-primary/10 text-sidebar-primary hover:bg-sidebar-primary hover:text-sidebar-primary-foreground group-data-[collapsible=icon]:size-10">
              <PlusCircle />
              <span className="group-data-[collapsible=icon]:hidden">
                Nova Projeção
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <ModeToggle />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
