import {
  type HolyricsScheduleItem,
  usePlayAudioMutation,
  usePlayVideoMutation,
  useShowImageMutation,
  useShowScheduleItemMutation,
} from "@/api/holyrics";
import {
  AlertCircle,
  Book,
  FileText,
  Image as ImageIcon,
  LoaderIcon,
  Mic2,
  Music,
  Play,
  Video,
} from "lucide-react";
import { toast } from "sonner";

import { resolveActiveServerMediaPath } from "@/hooks/use-media-library";
import { openPanelForSong } from "@/hooks/use-presentation-store";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { cn } from "@/lib/utils";

type ScheduleItem = HolyricsScheduleItem;
type SongLookup = Map<string, { [key: string]: unknown }>;

interface ServiceItemProps {
  item: ScheduleItem;
  songLookup?: SongLookup;
}

function readString(
  source: { [key: string]: unknown } | undefined,
  ...keys: string[]
) {
  for (const key of keys) {
    const value = source?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function readNumber(
  source: { [key: string]: unknown } | undefined,
  ...keys: string[]
) {
  for (const key of keys) {
    const value = source?.[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

export function ServiceItem({ item, songLookup }: ServiceItemProps) {
  const showScheduleItem = useShowScheduleItemMutation();
  const playVideo = usePlayVideoMutation();
  const playAudio = usePlayAudioMutation();
  const showImage = useShowImageMutation();

  const song = item.song_id ? songLookup?.get(item.song_id) : undefined;

  const resolveMediaReference = async (
    mediaType: "image" | "video" | "audio",
  ) => {
    const candidate =
      item.path ||
      item.name ||
      item.image ||
      item.video ||
      item.audio ||
      item.id;

    if (!candidate) {
      throw new Error("Item de mídia sem referência utilizável.");
    }

    return (
      (await resolveActiveServerMediaPath(mediaType, String(candidate))) ||
      String(candidate)
    );
  };

  const handleShow = async () => {
    const id = item.id || item.song_id;
    const isMediaItem =
      item.type === "video" || item.type === "audio" || item.type === "image";

    if (!id && !isMediaItem) return;

    try {
      if (
        item.song_id ||
        item.type === "song" ||
        item.type === "lyrics" ||
        item.type === "verse"
      ) {
        openPanelForSong({
          id: item.song_id,
          title: item.name || readString(song, "title") || "Música",
          artist: item.artist || readString(song, "artist", "author"),
          group: readString(song, "group"),
          key: readString(item, "key") || readString(song, "key"),
          bpm: readNumber(song, "bpm"),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
      } else if (item.type === "video") {
        await playVideo.mutateAsync(await resolveMediaReference("video"));
      } else if (item.type === "audio") {
        await playAudio.mutateAsync(await resolveMediaReference("audio"));
      } else if (item.type === "image") {
        await showImage.mutateAsync(await resolveMediaReference("image"));
      } else {
        await showScheduleItem.mutateAsync({
          id: item.id,
          type: item.type,
          song_id: item.song_id,
          index: item.index,
          name: item.name,
        });
      }

      if (!item.song_id && item.type !== "song") {
        toast.success(`Apresentando: ${item.name || "Item"}`);
      }
    } catch (error: unknown) {
      console.error("Show error:", error);
      toast.error(
        `Erro ao apresentar item: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      );
    }
  };

  const getIcon = () => {
    switch (item.type) {
      case "song":
      case "lyrics":
      case "verse":
        return <Mic2 />;
      case "bible":
        return <Book />;
      case "image":
        return <ImageIcon />;
      case "video":
      case "audio":
        return <Video />;
      case "text":
        return <FileText />;
      case "announcement":
        return <AlertCircle />;
      default:
        return <Music />;
    }
  };

  const getTypeLabel = () => {
    switch (item.type) {
      case "song":
      case "lyrics":
      case "verse":
        return "Música";
      case "bible":
        return "Bíblia";
      case "image":
        return "Imagem";
      case "video":
        return "Vídeo";
      case "audio":
        return "Áudio";
      case "text":
        return "Texto";
      case "announcement":
        return "Aviso";
      case "presentation":
        return "Apresentação";
      case "media":
        return "Mídia";
      default:
        return item.type || "Item";
    }
  };

  const isSongLike =
    item.song_id ||
    item.type === "song" ||
    item.type === "lyrics" ||
    item.type === "verse";
  const subtitle = item.artist || readString(song, "artist", "author");
  const musicMetadata = [
    readString(item, "key") || readString(song, "key")
      ? `Tom ${readString(item, "key") || readString(song, "key")}`
      : null,
    readNumber(song, "bpm") ? `${readNumber(song, "bpm")} BPM` : null,
    readString(song, "group") || readString(item, "group", "group_name"),
  ].filter((value): value is string => Boolean(value));

  const defaultMetadata = [getTypeLabel()].filter(Boolean);
  const metadata = isSongLike ? musicMetadata : defaultMetadata;
  const description = [subtitle, metadata.join(" · ")]
    .filter(Boolean)
    .join(" · ");

  const isPending =
    showScheduleItem.isPending ||
    playVideo.isPending ||
    playAudio.isPending ||
    showImage.isPending;

  return (
    <Item
      asChild
      variant={item.active ? "muted" : "default"}
      className={cn(
        "border border-border/60 transition-colors hover:bg-muted/50",
        item.active && "border-primary/20 bg-primary/5 text-primary",
      )}
    >
      <button
        type="button"
        onClick={handleShow}
        aria-pressed={Boolean(item.active)}
      >
        <ItemMedia
          variant="icon"
          className={cn("text-muted-foreground", item.active && "text-primary")}
        >
          {getIcon()}
        </ItemMedia>
        <ItemContent>
          <ItemTitle className={cn(item.active && "text-primary")}>
            {item.name || readString(song, "title") || "Sem nome"}
          </ItemTitle>
          {description ? (
            <ItemDescription>{description}</ItemDescription>
          ) : null}
        </ItemContent>
        <ItemActions className="ml-auto">
          {isPending ? (
            <LoaderIcon className="size-4 animate-spin text-muted-foreground" />
          ) : (
            <Play
              className={cn(
                "size-4 text-muted-foreground",
                item.active && "text-primary",
              )}
            />
          )}
        </ItemActions>
      </button>
    </Item>
  );
}
