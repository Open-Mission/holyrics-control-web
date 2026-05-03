import * as React from "react";

import { useIsMobile } from "@/hooks/use-mobile";
import { useServerStore } from "@/hooks/use-server-store";

const PROJECTION_PREVIEW_VISIBILITY_KEY = "holyrics:projection-preview:visible";

function getProjectionPreviewVisibilityKey(serverId?: string | null) {
  return `${PROJECTION_PREVIEW_VISIBILITY_KEY}:${serverId ?? "default"}`;
}

export function useProjectionPreviewVisibility() {
  const { activeServer } = useServerStore();
  const isMobile = useIsMobile();
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const storageKey = getProjectionPreviewVisibilityKey(activeServer?.id);
    const rawValue = window.localStorage.getItem(storageKey);

    if (rawValue === "true" || rawValue === "false") {
      setIsVisible(rawValue === "true");
      return;
    }

    setIsVisible(!isMobile);
  }, [activeServer?.id, isMobile]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(
      getProjectionPreviewVisibilityKey(activeServer?.id),
      String(isVisible),
    );
  }, [activeServer?.id, isVisible]);

  return {
    isVisible,
    setIsVisible,
    toggle: () => setIsVisible((current) => !current),
  };
}
