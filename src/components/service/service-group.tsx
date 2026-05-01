import type {
  GetApiV1Schedules200ItemLyricsPlaylistItem,
  GetApiV1Schedules200ItemMediaPlaylistItem,
} from '@/api/generated'
import { ServiceItem } from './service-item'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import { Badge } from '../ui/badge'

type ScheduleItem = GetApiV1Schedules200ItemLyricsPlaylistItem | GetApiV1Schedules200ItemMediaPlaylistItem

interface ServiceGroupProps {
  title?: ScheduleItem
  items: ScheduleItem[]
  songLookup?: Map<string, { [key: string]: unknown }>
}

export function ServiceGroup({ title, items, songLookup }: ServiceGroupProps) {
  if (!title) {
    return (
        <div className="flex flex-col gap-2 pb-6">
        {items.map((item, index) => (
          <ServiceItem key={item.id || `item-${index}`} item={item} songLookup={songLookup} />
        ))}
      </div>
    )
  }

  const isActive = title.active || items.some(item => item.active)

  return (
    <Accordion type="single" collapsible defaultValue={title.id} className="w-full">
      <AccordionItem value={title.id || 'default'} className="mb-4 rounded-2xl border app-surface">
        <AccordionTrigger
          className={cn(
            'group/trigger flex items-center justify-between rounded-2xl px-4 py-4 transition-colors hover:no-underline sm:px-5',
            isActive
              ? 'bg-primary/5 text-foreground'
              : 'bg-transparent text-foreground hover:bg-accent/40',
            'data-[state=open]:rounded-b-none'
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="truncate text-sm font-semibold tracking-tight sm:text-base">
              {title.name || 'Grupo'}
            </span>
            <Badge
              variant="secondary"
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            >
              {items.length} {items.length === 1 ? 'item' : 'itens'}
            </Badge>
            {isActive && (
              <span className="ml-1 hidden items-center gap-1.5 sm:flex">
                <div className="size-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-semibold tracking-[0.18em] text-primary">ATIVO</span>
              </span>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent
          className={cn(
            'rounded-b-2xl border-t border-border/60 px-3 pb-3 pt-1 sm:px-4 sm:pb-4',
            isActive ? 'bg-primary/5' : 'bg-background/60'
          )}
        >
          <div className="flex flex-col gap-2">
            {items.map((item, index) => (
              <ServiceItem key={item.id || `item-${index}`} item={item} songLookup={songLookup} />
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
