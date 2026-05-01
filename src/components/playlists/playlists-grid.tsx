import type { Playlist } from "@/hooks/use-playlists-store";

import { PlaylistCard } from "./playlist-card";

interface PlaylistsGridProps {
  playlists: Playlist[];
  loadingPlaylist: string | null;
  onLoadPlaylist: (playlist: Playlist) => void;
}

export function PlaylistsGrid({
  playlists,
  loadingPlaylist,
  onLoadPlaylist,
}: PlaylistsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {playlists.map((playlist) => (
        <PlaylistCard
          key={playlist.name}
          playlist={playlist}
          isLoading={loadingPlaylist === playlist.name}
          onLoad={() => onLoadPlaylist(playlist)}
        />
      ))}
    </div>
  );
}
