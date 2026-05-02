import type { HolyricsScheduleItem } from '@/api/holyrics'
import { ServiceGroup } from './service-group'
import { ServiceItem } from './service-item'
import { useMemo } from 'react'
import { LayoutGrid, SearchX } from 'lucide-react'
import { EmptyStateSection } from '@/components/design-system'

type ScheduleItem = HolyricsScheduleItem

interface ServiceListProps {
  items: ScheduleItem[]
  emptyMessage: string
  searchQuery?: string
  songLookup?: Map<string, { [key: string]: unknown }>
  /** When true, skip grouping and render all items flat (used during search) */
  flatMode?: boolean
}

export function ServiceList({ items, emptyMessage, searchQuery, songLookup, flatMode }: ServiceListProps) {
  const groups = useMemo(() => {
    if (flatMode) return []

    const result: { title?: ScheduleItem; items: ScheduleItem[] }[] = []
    let current: { title?: ScheduleItem; items: ScheduleItem[] } = { items: [] }

    items.forEach(item => {
      if (item.type === 'title') {
        if (current.items.length > 0) result.push(current)
        current = { title: item, items: [] }
      } else {
        current.items.push(item)
      }
    })

    if (current.items.length > 0) result.push(current)

    return result
  }, [items, flatMode])

  // ─── Empty ────────────────────────────────────────────────────────────────

  const isEmpty = flatMode ? items.length === 0 : groups.length === 0

  if (isEmpty) {
    return (
      <EmptyStateSection
        icon={searchQuery ? SearchX : LayoutGrid}
        title={searchQuery ? 'Nenhum resultado' : 'Lista vazia'}
        description={emptyMessage}
        className="py-12"
      />
    )
  }

  // ─── Flat (search mode) ───────────────────────────────────────────────────

  if (flatMode) {
    const flatItems = items.filter(item => item.type !== 'title')
    return (
      <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-400">
        {flatItems.map((item, index) => (
          <ServiceItem key={item.id || `flat-${index}`} item={item} songLookup={songLookup} />
        ))}
      </div>
    )
  }

  // ─── Grouped ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {groups.map((group, index) => (
        <ServiceGroup
          key={group.title?.id || `group-${index}`}
          title={group.title}
          items={group.items}
          songLookup={songLookup}
        />
      ))}
    </div>
  )
}
