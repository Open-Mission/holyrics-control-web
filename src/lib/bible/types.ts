export type BibleTestament = "old" | "new";

export interface BibleBook {
  id: string;
  order: number;
  name: string;
  shortName: string;
  chapterCount: number;
  testament: BibleTestament;
  aliases: string[];
}
