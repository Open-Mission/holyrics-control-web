import { ChevronRightIcon, Music2Icon } from 'lucide-react'
import type { Song } from '@/hooks/use-songs-store'
import { MusicItemCard } from './music-item-card'

interface SongRowProps {
  song: Song
  onClick: () => void
}

export function SongRow({ song, onClick }: SongRowProps) {
  const metadata = [
    typeof song.key === 'string' && song.key.trim() ? `Tom ${song.key}` : null,
    typeof song.bpm === 'number' ? `${song.bpm} BPM` : null,
    typeof song.group === 'string' && song.group.trim() ? song.group : null,
  ].filter((value): value is string => Boolean(value))

  return (
    <MusicItemCard
      title={song.title || 'Sem título'}
      subtitle={song.artist || song.author}
      metadata={metadata}
      leading={<Music2Icon />}
      trailing={<ChevronRightIcon className="size-4" />}
      onClick={onClick}
    />
  )
}
