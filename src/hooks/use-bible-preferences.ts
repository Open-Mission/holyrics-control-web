import { useCallback, useEffect, useState } from "react";

import { getCurrentActiveServer } from "@/hooks/use-server-store";
import {
  deleteServerMeta,
  readServerMeta,
  writeServerMeta,
} from "@/lib/db-server";
import { subscribeToServerContextChange } from "@/lib/server-context-events";

export interface BiblePreferences {
  versionPrimary: string;
  versionSecondary: string;
  versionTertiary: string;
  showXVerses: number;
  defaultAction: "default" | "responsive_reading" | "only_reference";
}

const META_KEY = "bible:preferences";

function normalizePreferences(
  value: unknown,
  fallback?: Partial<BiblePreferences>,
): BiblePreferences {
  const record =
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  const showXVersesRaw =
    typeof record.showXVerses === "number"
      ? record.showXVerses
      : fallback?.showXVerses;

  const defaultActionRaw =
    typeof record.defaultAction === "string"
      ? record.defaultAction
      : fallback?.defaultAction;

  return {
    versionPrimary:
      typeof record.versionPrimary === "string"
        ? record.versionPrimary
        : fallback?.versionPrimary ?? "",
    versionSecondary:
      typeof record.versionSecondary === "string"
        ? record.versionSecondary
        : fallback?.versionSecondary ?? "",
    versionTertiary:
      typeof record.versionTertiary === "string"
        ? record.versionTertiary
        : fallback?.versionTertiary ?? "",
    showXVerses:
      typeof showXVersesRaw === "number" && Number.isFinite(showXVersesRaw)
        ? Math.min(Math.max(Math.floor(showXVersesRaw), 1), 6)
        : 1,
    defaultAction:
      defaultActionRaw === "default" ||
      defaultActionRaw === "responsive_reading" ||
      defaultActionRaw === "only_reference"
        ? defaultActionRaw
        : "responsive_reading",
  };
}

export function buildBiblePreferencesDefaults(source?: {
  tab_version_1?: string;
  tab_version_2?: string;
  tab_version_3?: string;
  show_x_verses?: number;
  show_only_reference?: boolean;
}) {
  return normalizePreferences(undefined, {
    versionPrimary: source?.tab_version_1 ?? "",
    versionSecondary: source?.tab_version_2 ?? "",
    versionTertiary: source?.tab_version_3 ?? "",
    showXVerses: source?.show_x_verses ?? 1,
    defaultAction: source?.show_only_reference
      ? "only_reference"
      : "responsive_reading",
  });
}

export function useBiblePreferences(defaults: BiblePreferences) {
  const [preferences, setPreferences] = useState<BiblePreferences>(defaults);
  const [isLoading, setIsLoading] = useState(true);

  const loadPreferences = useCallback(async () => {
    const serverId = getCurrentActiveServer()?.id;
    if (!serverId) {
      setPreferences(defaults);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const persisted = await readServerMeta(serverId, META_KEY);
      if (!persisted?.value) {
        setPreferences(defaults);
        await writeServerMeta(serverId, META_KEY, JSON.stringify(defaults));
      } else {
        let parsed: unknown = undefined;
        try {
          parsed = JSON.parse(persisted.value);
        } catch {
          parsed = undefined;
        }

        const normalized = normalizePreferences(parsed, defaults);
        setPreferences(normalized);
      }
    } finally {
      setIsLoading(false);
    }
  }, [defaults]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPreferences();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadPreferences]);

  useEffect(() => {
    return subscribeToServerContextChange(() => {
      void loadPreferences();
    });
  }, [loadPreferences]);

  const updatePreferences = useCallback(
    async (patch: Partial<BiblePreferences>) => {
      const serverId = getCurrentActiveServer()?.id;
      const next = normalizePreferences({ ...preferences, ...patch }, defaults);
      setPreferences(next);
      if (!serverId) return next;
      await writeServerMeta(serverId, META_KEY, JSON.stringify(next));
      return next;
    },
    [defaults, preferences],
  );

  const resetPreferences = useCallback(async () => {
    const serverId = getCurrentActiveServer()?.id;
    setPreferences(defaults);
    if (!serverId) return;
    await deleteServerMeta(serverId, META_KEY);
    await writeServerMeta(serverId, META_KEY, JSON.stringify(defaults));
  }, [defaults]);

  return {
    preferences,
    isLoading,
    updatePreferences,
    resetPreferences,
  };
}
