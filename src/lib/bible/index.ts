import { BIBLE_BOOKS } from "@/lib/bible/books";
import type { BibleBook } from "@/lib/bible/types";

export { BIBLE_BOOKS };
export type { BibleBook } from "@/lib/bible/types";

export function normalizeBibleText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function getBibleBookById(id: string | null | undefined) {
  if (!id) return null;
  return BIBLE_BOOKS.find((book) => book.id === id) ?? null;
}

export function getBibleBookSearchTerms(book: BibleBook) {
  return [book.name, book.shortName, ...book.aliases].map(normalizeBibleText);
}

export function matchesBibleBookQuery(book: BibleBook, query: string) {
  const normalized = normalizeBibleText(query);
  if (!normalized) return true;

  return getBibleBookSearchTerms(book).some(
    (term) => term === normalized || term.startsWith(normalized),
  );
}

export function findExactBibleBook(query: string) {
  const normalized = normalizeBibleText(query);
  if (!normalized) return null;

  return (
    BIBLE_BOOKS.find((book) =>
      getBibleBookSearchTerms(book).some((term) => term === normalized),
    ) ?? null
  );
}

export function listBibleChapters(book: BibleBook) {
  return Array.from({ length: book.chapterCount }, (_, index) => index + 1);
}

export function buildBibleVerseId(
  bookOrder: number,
  chapter: number,
  verse: number,
) {
  return `${String(bookOrder).padStart(2, "0")}${String(chapter).padStart(3, "0")}${String(verse).padStart(3, "0")}`;
}

export function buildBibleReference(
  book: Pick<BibleBook, "name">,
  chapter: number,
  verse?: number | null,
) {
  if (verse == null) return `${book.name} ${chapter}`;
  return `${book.name} ${chapter}:${verse}`;
}
