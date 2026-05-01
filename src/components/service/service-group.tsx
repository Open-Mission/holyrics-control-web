import type {
  GetApiV1Schedules200ItemLyricsPlaylistItem,
  GetApiV1Schedules200ItemMediaPlaylistItem,
} from "@/api/generated";
import { ServiceItem } from "./service-item";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ItemGroup } from "@/components/ui/item";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";

type ScheduleItem =
  | GetApiV1Schedules200ItemLyricsPlaylistItem
  | GetApiV1Schedules200ItemMediaPlaylistItem;

interface ServiceGroupProps {
  title?: ScheduleItem;
  items: ScheduleItem[];
  songLookup?: Map<string, { [key: string]: unknown }>;
}

export function ServiceGroup({ title, items, songLookup }: ServiceGroupProps) {
  if (!title) {
    return (
      <ItemGroup className="gap-2 pb-6">
        {items.map((item, index) => (
          <ServiceItem
            key={item.id || `item-${index}`}
            item={item}
            songLookup={songLookup}
          />
        ))}
      </ItemGroup>
    );
  }

  const isActive = title.active || items.some((item) => item.active);

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={title.id}
      className="w-full"
    >
      <AccordionItem
        value={title.id || "default"}
        className={cn(
          "overflow-hidden rounded-lg border bg-card",
          isActive && "border-primary/20 bg-primary/5",
        )}
      >
        <SidebarGroup className="gap-1 p-0">
          <AccordionTrigger
            className={cn(
              "w-full px-3 py-2.5 text-left transition-colors bg-muted/50 hover:bg-muted/60 hover:no-underline sm:px-4",
              "data-[state=open]:border-b data-[state=open]:border-border/60 rounded-none",
            )}
          >
            <SidebarGroupLabel
              className={cn(
                "h-auto w-full flex-1 min-w-0 items-center justify-between gap-3 rounded-none px-0 text-foreground opacity-100",
                isActive && "text-primary",
              )}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="truncate text-sm font-medium tracking-tight">
                  {title.name || "Grupo"}
                </span>
                <Badge
                  variant="secondary"
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                >
                  {items.length} {items.length === 1 ? "item" : "itens"}
                </Badge>
              </div>
              {isActive ? (
                <span className="hidden items-center gap-1.5 text-[10px] font-medium tracking-[0.16em] text-primary sm:flex">
                  <span className="size-1.5 rounded-full bg-primary" />
                  ATIVO
                </span>
              ) : null}
            </SidebarGroupLabel>
          </AccordionTrigger>
          <AccordionContent
            className={cn(
              "px-3 pb-3 pt-2 sm:px-4",
              isActive ? "bg-primary/5" : "bg-background",
            )}
          >
            <SidebarGroupContent>
              <ItemGroup className="gap-2">
                {items.map((item, index) => (
                  <ServiceItem
                    key={item.id || `item-${index}`}
                    item={item}
                    songLookup={songLookup}
                  />
                ))}
              </ItemGroup>
            </SidebarGroupContent>
          </AccordionContent>
        </SidebarGroup>
      </AccordionItem>
    </Accordion>
  );
}
