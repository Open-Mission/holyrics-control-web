import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { requestHolyricsAction } from "@/api/holyrics/core/client";
import { holyricsKeys } from "@/api/holyrics/core/query";

const bibleVersionSchema = z
  .object({
    key: z.string(),
    version: z.string(),
    title: z.string(),
    language: z
      .object({
        id: z.string().optional(),
        iso: z.string().optional(),
        name: z.string().optional(),
        alt_name: z.string().nullable().optional(),
      })
      .optional(),
  })
  .passthrough();

const bibleSettingsSchema = z
  .object({
    tab_version_1: z.string().optional(),
    tab_version_2: z.string().optional(),
    tab_version_3: z.string().optional(),
    show_x_verses: z.number().optional(),
    uppercase: z.boolean().optional(),
    show_only_reference: z.boolean().optional(),
    show_second_version: z.boolean().optional(),
    show_third_version: z.boolean().optional(),
    book_panel_type: z.string().optional(),
    book_panel_order: z.string().optional(),
    book_panel_order_available_items: z.array(z.string()).optional(),
  })
  .passthrough();

export type HolyricsBibleVersion = z.infer<typeof bibleVersionSchema>;
export type HolyricsBibleSettings = z.infer<typeof bibleSettingsSchema>;

export async function listBibleVersions() {
  return requestHolyricsAction({
    action: "GetBibleVersionsV2",
    responseSchema: z.array(bibleVersionSchema),
  });
}

export async function getBibleSettings() {
  return requestHolyricsAction({
    action: "GetBibleSettings",
    responseSchema: bibleSettingsSchema,
  });
}

export interface ShowBibleVerseInput {
  id?: string;
  references?: string;
  version?: string;
  quickPresentation?: boolean;
  showXVerses?: number;
  defaultAction?: "default" | "responsive_reading" | "only_reference";
}

export async function showBibleVerse(input: ShowBibleVerseInput) {
  return requestHolyricsAction({
    action: "ShowVerse",
    payload: {
      ...(input.id ? { id: input.id } : {}),
      ...(input.references ? { references: input.references } : {}),
      ...(input.version ? { version: input.version } : {}),
      ...(input.quickPresentation != null
        ? { quick_presentation: input.quickPresentation }
        : {}),
      ...(input.showXVerses != null
        ? { show_x_verses: input.showXVerses }
        : {}),
      ...(input.defaultAction ? { default_action: input.defaultAction } : {}),
    },
  });
}

export async function selectVerse(input: { id?: string; reference?: string }) {
  return requestHolyricsAction({
    action: "SelectVerse",
    payload: input.id ? { id: input.id } : { reference: input.reference },
  });
}

export function useBibleVersionsQuery() {
  return useQuery({
    queryKey: holyricsKeys.bibleVersions(),
    queryFn: listBibleVersions,
  });
}

export function useBibleSettingsQuery() {
  return useQuery({
    queryKey: holyricsKeys.bibleSettings(),
    queryFn: getBibleSettings,
  });
}

export function useShowBibleVerseMutation() {
  return useMutation({
    mutationKey: [...holyricsKeys.bible(), "show-verse"],
    mutationFn: showBibleVerse,
  });
}

export function useSelectVerseMutation() {
  return useMutation({
    mutationKey: [...holyricsKeys.bible(), "select-verse"],
    mutationFn: selectVerse,
  });
}
