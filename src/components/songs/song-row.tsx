import { Music2Icon, PlayIcon } from 'lucide-react'
import type { Song } from '@/hooks/use-songs-store'
import { Badge } from '@/components/ui/badge'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'

interface SongRowProps {
  song: Song
  onClick: () => void
}

function normalizeGroups(group: Song['group'] | unknown): string[] {
  if (Array.isArray(group)) {
    return group
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.trim())
      .filter(Boolean)
  }

  if (typeof group !== 'string') return []

  return group
    .split(/[,;|]/)
    .map((value) => value.trim())
    .filter(Boolean)
}

export function SongRow({ song, onClick }: SongRowProps) {
  const groups = normalizeGroups(song.group)
  const metadata = [
    typeof song.key === 'string' && song.key.trim() ? `Tom ${song.key}` : null,
    typeof song.bpm === 'number' && song.bpm > 0 ? `${song.bpm} BPM` : null,
  ].filter((value): value is string => Boolean(value))

  const description = [song.artist || song.author, metadata.join(' · ')]
    .filter(Boolean)
    .join(' · ')

  return (
    <Item
      asChild
      className="border border-border/60 transition-colors hover:bg-muted/50"
    >
      <button type="button" onClick={onClick}>
        <ItemMedia variant="icon" className="text-muted-foreground">
          <Music2Icon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{song.title || 'Sem título'}</ItemTitle>
          {description ? <ItemDescription>{description}</ItemDescription> : null}
          {groups.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {groups.map((group) => (
                <Badge key={group} variant="secondary" className="rounded-full">
                  {group}
                </Badge>
              ))}
            </div>
          ) : null}
        </ItemContent>
        <ItemActions className="ml-auto">
          <PlayIcon className="size-4 text-muted-foreground" />
        </ItemActions>
      </button>
    </Item>
  )
}
