import {
  ClockIcon,
  ListMusicIcon,
  LoaderIcon,
  PlayIcon,
} from "lucide-react";

import type { Playlist } from "@/hooks/use-playlists-store";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SurfaceCard } from "@/components/design-system";

interface PlaylistCardProps {
  playlist: Playlist;
  isLoading: boolean;
  onLoad: () => void;
}

export function PlaylistCard({
  playlist,
  isLoading,
  onLoad,
}: PlaylistCardProps) {
  return (
    <SurfaceCard className="h-full rounded-lg border pb-0">
      <CardHeader className="gap-2 px-3 pt-0">
        <div className="flex items-stretch gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
            <ListMusicIcon className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base leading-snug whitespace-normal break-words">
              {playlist.name}
            </CardTitle>
            <CardDescription className="mt-1 whitespace-normal break-words">
              Lista salva no Holyrics e pronta para carregamento rapido.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 items-center pt-0">
        <Button onClick={onLoad} disabled={isLoading} className="h-10 w-full gap-2">
          {isLoading ? (
            <LoaderIcon className="size-4 animate-spin" />
          ) : (
            <PlayIcon className="size-3.5 fill-current" />
          )}
          Carregar playlist
        </Button>
      </CardContent>

      <CardFooter className="border-t bg-muted/50 px-3 py-2!">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ClockIcon className="size-3.5" />
          Disponivel na biblioteca sincronizada
        </div>
      </CardFooter>
    </SurfaceCard>
  );
}
