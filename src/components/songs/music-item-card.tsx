import type { ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface MusicItemCardProps {
  title: string
  subtitle?: string
  metadata?: string[]
  leading: ReactNode
  trailing?: ReactNode
  active?: boolean
  onClick?: () => void
}

export function MusicItemCard({
  title,
  subtitle,
  metadata = [],
  leading,
  trailing,
  active = false,
  onClick,
}: MusicItemCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border px-4 py-4 text-left transition-all duration-200 active:scale-[0.995] sm:px-5',
        active
          ? 'border-primary/30 bg-primary/5 ring-1 ring-primary/15'
          : 'bg-background hover:border-primary/20 hover:bg-accent/35'
      )}
    >
      <div
        className={cn(
          'flex size-14 shrink-0 items-center justify-center rounded-2xl border transition-colors',
          active
            ? 'border-primary/15 bg-primary text-primary-foreground'
            : 'border-primary/15 bg-primary/10 text-primary'
        )}
      >
        <div className="size-7 [&>svg]:size-full">{leading}</div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <p className={cn('truncate text-lg font-semibold tracking-tight', active && 'text-primary')}>
            {title}
          </p>
          {active ? <div className="size-1.5 shrink-0 rounded-full bg-primary animate-pulse" /> : null}
        </div>

        {subtitle ? <p className="truncate text-sm text-muted-foreground sm:text-base">{subtitle}</p> : null}

        {metadata.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {metadata.map((value) => (
              <Badge
                key={value}
                variant="secondary"
                className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
              >
                {value}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>

      {trailing ? (
        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-xl border transition-colors',
            active
              ? 'border-primary/15 bg-primary text-primary-foreground'
              : 'border-border/60 bg-background/80 text-muted-foreground group-hover:text-primary'
          )}
        >
          {trailing}
        </div>
      ) : null}

      {active ? <div className="absolute inset-y-0 left-0 w-1 rounded-r-full bg-primary" /> : null}
    </button>
  )
}
