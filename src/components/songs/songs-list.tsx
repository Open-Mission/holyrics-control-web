import { SongRow } from './song-row'
import type { Song } from '@/hooks/use-songs-store'

interface SongsListProps {
  songs: Song[]
  isSyncing: boolean
  onSongClick: (song: Song) => void
}

export function SongsList({
  songs,
  isSyncing,
  onSongClick,
}: SongsListProps) {
  return (
    <div className={`flex flex-col gap-2 transition-opacity duration-300 ${isSyncing ? 'opacity-50' : ''}`}>
        {songs.map((song, idx) => (
          <SongRow key={song.id ?? idx} song={song} onClick={() => onSongClick(song)} />
        ))}
    </div>
  )
}
