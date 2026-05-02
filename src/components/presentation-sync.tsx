import { useEffect } from "react";
import { getSong, useCurrentPresentationQuery } from "@/api/holyrics";
import { usePresentationStore, setState } from "@/hooks/use-presentation-store";
import {
  clearMediaPresentation,
  getMediaPresentationState,
  setMediaPresentationState,
} from "@/hooks/use-media-presentation-store";
import { dbGetSongDetail, dbPutSongDetail } from "@/hooks/use-songs-store";
import { getMediaBaseName, getMediaParentPath, normalizeMediaPath } from "@/lib/media";

type CurrentPresentationPayload = {
  id?: string;
  index?: number | null;
  slide_number?: number | null;
  name?: string;
  status?: string;
  type?: string;
};

function readPayloadData(value: unknown): unknown {
  if (!value || typeof value !== "object") return undefined;

  const record = value as Record<string, unknown>;
  if ("data" in record) {
    return readPayloadData(record.data) ?? record.data;
  }

  return record;
}

export function GlobalPresentationSync() {
  const { song: currentSong, activeIndex: currentActiveIndex } =
    usePresentationStore();

  // Poll current presentation every 2 seconds
  const { data: presentationResponse } = useCurrentPresentationQuery({
    refetchInterval: 2000,
  });

  useEffect(() => {
    const sync = async () => {
      const presentation = presentationResponse as CurrentPresentationPayload | undefined;

      // No active presentation
      if (!presentation || presentation.status === "none" || !presentation.id) {
        if (currentSong) {
          setState({
            song: null,
            slides: [],
            activeIndex: null,
            presentationKind: null,
          });
        }
        clearMediaPresentation();
        return;
      }

      const songId = presentation.id;
      const apiIndex =
        presentation.index ??
        (typeof presentation.slide_number === "number"
          ? Math.max(0, presentation.slide_number - 1)
          : 0);

      if (
        presentation.type !== "song" &&
        presentation.type !== "verse" &&
        presentation.type !== "lyrics"
      ) {
        if (
          presentation.type === "image" ||
          presentation.type === "video" ||
          presentation.type === "audio"
        ) {
          const mediaType = presentation.type;
          const normalizedPath = normalizeMediaPath(
            presentation.name ?? presentation.id,
          );
          const currentMediaState = getMediaPresentationState();
          const matchedIndex = currentMediaState.items.findIndex(
            (item) => item.path === normalizedPath,
          );

          setState({
            song: null,
            slides: [],
            activeIndex: null,
            presentationKind: null,
          });

          setMediaPresentationState({
            mediaType,
            isPresenting: true,
            selectedIndex: matchedIndex >= 0 ? matchedIndex : apiIndex,
            presentedIndex: matchedIndex >= 0 ? matchedIndex : apiIndex,
            currentPath: normalizedPath,
            sourcePath: currentMediaState.sourcePath ?? normalizedPath,
            items:
              currentMediaState.items.length > 0
                ? currentMediaState.items
                : [
                    {
                      mediaType,
                      path: normalizedPath,
                      parentPath: getMediaParentPath(normalizedPath),
                      name: getMediaBaseName(normalizedPath),
                      isDir: false,
                      hasScannedChildren: true,
                      discoveredAt: new Date().toISOString(),
                    },
                  ],
          });
          return;
        }
        return;
      }

      clearMediaPresentation();

      // If it's the same song and index (optimistic check)
      if (currentSong?.id === songId && currentActiveIndex === apiIndex) {
        return;
      }

      // If it's a new song or index changed, we need full details
      try {
        let songDetail = await dbGetSongDetail(songId);

        // If not in cache or no slides, fetch from API
        if (
          !songDetail ||
          !songDetail.slides ||
          songDetail.slides.length === 0
        ) {
          const response = await getSong(songId);
          const resolved = readPayloadData(response) ?? response;
          songDetail = resolved as typeof songDetail;

          if (songDetail) {
            await dbPutSongDetail({
              ...songDetail,
              _fetchedAt: new Date().toISOString(),
            });
          }
        }

        if (songDetail) {
          setState({
            song: {
              id: songDetail.id,
              title: songDetail.title,
              artist: songDetail.artist,
            },
            slides: songDetail.slides || [],
            activeIndex: apiIndex,
            presentationKind: "song",
          });
        }
      } catch (err) {
        console.error(
          "[GlobalPresentationSync] Failed to sync presentation details:",
          err,
        );
      }
    };

    sync();
  }, [presentationResponse, currentSong, currentActiveIndex]);

  return null;
}
