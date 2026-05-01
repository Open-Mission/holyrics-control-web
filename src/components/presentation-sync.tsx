import { useEffect } from "react";
import { useGetApiV1PresentationCurrent } from "@/api/generated";
import { usePresentationStore, setState } from "@/hooks/use-presentation-store";
import { getDb } from "@/lib/db";
import { getApiV1SongsId } from "@/lib/holyrics";

type CurrentPresentationPayload = {
  id?: string;
  index?: number | null;
  status?: string;
  type?: string;
};

export function GlobalPresentationSync() {
  const { song: currentSong, activeIndex: currentActiveIndex } =
    usePresentationStore();

  // Poll current presentation every 2 seconds
  const { data: presentationResponse } = useGetApiV1PresentationCurrent({
    query: {
      refetchInterval: 2000,
    },
  } as any);

  useEffect(() => {
    const sync = async () => {
      const presentation = presentationResponse?.data as
        | CurrentPresentationPayload
        | undefined;

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
        return;
      }

      const songId = presentation.id;
      const apiIndex = presentation.index ?? 0;

      // TODO: Handle types other than song if needed
      if (
        presentation.type !== "song" &&
        presentation.type !== "verse" &&
        presentation.type !== "lyrics"
      ) {
        return;
      }

      // If it's the same song and index (optimistic check)
      if (currentSong?.id === songId && currentActiveIndex === apiIndex) {
        return;
      }

      // If it's a new song or index changed, we need full details
      try {
        const db = await getDb();
        let songDetail = await db.get("song_details", songId);

        // If not in cache or no slides, fetch from API
        if (
          !songDetail ||
          !songDetail.slides ||
          songDetail.slides.length === 0
        ) {
          const response = await getApiV1SongsId(songId);
          const raw = response as any;
          songDetail = raw?.data?.data ?? raw?.data ?? raw;

          if (songDetail) {
            await db.put("song_details", {
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
