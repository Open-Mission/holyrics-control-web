/* eslint-disable react-refresh/only-export-components */
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpenIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ImageIcon,
  LoaderIcon,
  MonitorOffIcon,
  MonitorPlayIcon,
  PanelRightOpenIcon,
  RefreshCwIcon,
  SearchIcon,
  SparklesIcon,
  TypeIcon,
  XCircleIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  type HolyricsCurrentPresentation,
  useBibleSettingsQuery,
  useBibleVersionsQuery,
  useCurrentPresentationQuery,
  useSelectVerseMutation,
  useShowBibleVerseMutation,
} from "@/api/holyrics";
import {
  AppPage,
  EmptyStateSection,
  PageHeader,
  SearchToolbar,
  SplitPanelSection,
  StatusChip,
  SurfaceCard,
  ToolbarRow,
} from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useBiblePreferences, buildBiblePreferencesDefaults } from "@/hooks/use-bible-preferences";
import { useIsMobile } from "@/hooks/use-mobile";
import { closePresentation, usePresentationStore } from "@/hooks/use-presentation-store";
import {
  BIBLE_BOOKS,
  buildBibleReference,
  buildBibleVerseId,
  findExactBibleBook,
  getBibleBookById,
  matchesBibleBookQuery,
  normalizeBibleText,
} from "@/lib/bible";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/bible")({
  component: BiblePage,
});

type PresentationSlide =
  NonNullable<NonNullable<HolyricsCurrentPresentation>["slides"]>[number];

function BiblePage() {
  const [search, setSearch] = useState("");
  const [selectedBookId, setSelectedBookId] = useState(BIBLE_BOOKS[42]?.id ?? "joao");
  const [selectedChapter, setSelectedChapter] = useState(3);
  const [selectedVerseInput, setSelectedVerseInput] = useState("16");
  const [selectedVersion, setSelectedVersion] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [activeChapterKey, setActiveChapterKey] = useState<string | null>(null);

  const deferredSearch = useDeferredValue(search);
  const isMobile = useIsMobile();

  const bibleVersionsQuery = useBibleVersionsQuery();
  const bibleSettingsQuery = useBibleSettingsQuery();
  const currentPresentationQuery = useCurrentPresentationQuery({
    refetchInterval: 1500,
  });
  const showBibleVerseMutation = useShowBibleVerseMutation();
  const selectVerseMutation = useSelectVerseMutation();
  const {
    toggleWallpaper,
    toggleNoLyrics,
    toggleBlackScreen,
    f8,
    f9,
    f10,
  } = usePresentationStore();

  const selectedBook = getBibleBookById(selectedBookId) ?? BIBLE_BOOKS[0];
  const normalizedQuery = normalizeBibleText(deferredSearch);
  const defaultPreferences = useMemo(
    () =>
      buildBiblePreferencesDefaults({
        tab_version_1:
          bibleSettingsQuery.data?.tab_version_1 ??
          bibleVersionsQuery.data?.[0]?.version,
        tab_version_2: bibleSettingsQuery.data?.tab_version_2,
        tab_version_3: bibleSettingsQuery.data?.tab_version_3,
        show_x_verses: bibleSettingsQuery.data?.show_x_verses,
        show_only_reference: bibleSettingsQuery.data?.show_only_reference,
      }),
    [
      bibleSettingsQuery.data?.show_only_reference,
      bibleSettingsQuery.data?.show_x_verses,
      bibleSettingsQuery.data?.tab_version_1,
      bibleSettingsQuery.data?.tab_version_2,
      bibleSettingsQuery.data?.tab_version_3,
      bibleVersionsQuery.data,
    ],
  );
  const {
    preferences,
    isLoading: isLoadingPreferences,
    updatePreferences,
    resetPreferences,
  } = useBiblePreferences(defaultPreferences);
  const effectiveVersion = selectedVersion || preferences.versionPrimary;

  const filteredBooks = useMemo(() => {
    if (!normalizedQuery) return BIBLE_BOOKS;
    return BIBLE_BOOKS.filter((book) => matchesBibleBookQuery(book, normalizedQuery));
  }, [normalizedQuery]);

  const oldTestamentBooks = useMemo(
    () => filteredBooks.filter((book) => book.testament === "old"),
    [filteredBooks],
  );
  const newTestamentBooks = useMemo(
    () => filteredBooks.filter((book) => book.testament === "new"),
    [filteredBooks],
  );

  const chapterNumbers = useMemo(
    () => Array.from({ length: selectedBook.chapterCount }, (_, index) => index + 1),
    [selectedBook.chapterCount],
  );

  const currentPresentation =
    currentPresentationQuery.data?.type === "verse"
      ? currentPresentationQuery.data
      : null;
  const slides = currentPresentation?.slides ?? [];
  const activeIndex = useMemo(() => {
    const candidate =
      typeof currentPresentation?.slide_number === "number"
        ? currentPresentation.slide_number - 1
        : typeof (currentPresentation as { index?: number } | undefined)?.index === "number"
          ? ((currentPresentation as { index?: number }).index ?? 0)
          : 0;
    return Math.max(0, candidate);
  }, [currentPresentation]);

  const verseNumbers = useMemo(
    () => Array.from({ length: slides.length }, (_, index) => index + 1),
    [slides.length],
  );

  const selectedVerseNumber = useMemo(() => {
    const parsed = Number(selectedVerseInput);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
  }, [selectedVerseInput]);

  const effectiveChapter = Math.min(selectedChapter, selectedBook.chapterCount);
  const chapterReference = buildBibleReference(selectedBook, effectiveChapter);
  const currentBookLabel = `${selectedBook.name} ${effectiveChapter}`;
  const selectedChapterKey = `${selectedBook.id}:${effectiveChapter}`;
  const isActiveSelection = activeChapterKey === selectedChapterKey;

  useEffect(() => {
    if (!normalizedQuery) return;

    const exactMatch = findExactBibleBook(normalizedQuery);
    if (!exactMatch || exactMatch.id === selectedBookId) return;

    startTransition(() => {
      setSelectedBookId(exactMatch.id);
      setSelectedChapter(1);
      setSelectedVerseInput("1");
    });
  }, [normalizedQuery, selectedBookId]);

  const handleArrowNavigation = useEffectEvent((delta: number) => {
    void navigateToSlide(activeIndex + delta);
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!slides.length || !isActiveSelection) return;
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (
        target?.closest(
          'input, textarea, select, [contenteditable="true"], [role="combobox"]',
        )
      ) {
        return;
      }

      event.preventDefault();
      const delta =
        event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
      handleArrowNavigation(delta);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActiveSelection, slides.length]);

  async function navigateToSlide(index: number) {
    if (!slides.length || !isActiveSelection || isNavigating) return;
    const boundedIndex = Math.min(Math.max(index, 0), slides.length - 1);
    if (boundedIndex === activeIndex) return;

    setIsNavigating(true);
    try {
      const targetVerse = boundedIndex + 1;
      await selectVerseMutation.mutateAsync({
        id: buildBibleVerseId(selectedBook.order, effectiveChapter, targetVerse),
      });
      setSelectedVerseInput(String(targetVerse));
    } catch {
      toast.error("Não foi possível navegar para esse versículo.");
    } finally {
      setIsNavigating(false);
    }
  }

  async function startChapter(targetVerse?: number) {
    try {
      await showBibleVerseMutation.mutateAsync({
        references: chapterReference,
        version: effectiveVersion || undefined,
        showXVerses: preferences.showXVerses,
        defaultAction: preferences.defaultAction,
      });

      if (targetVerse && targetVerse > 1) {
        await selectVerseMutation.mutateAsync({
          id: buildBibleVerseId(selectedBook.order, effectiveChapter, targetVerse),
        });
      }

      setActiveChapterKey(selectedChapterKey);
      setPanelOpen(true);
      toast.success(`${currentBookLabel} pronto para projeção.`);
    } catch {
      toast.error("Erro ao iniciar a apresentação da Bíblia.");
    }
  }

  async function goToVerse(verseNumber: number) {
    setSelectedVerseInput(String(verseNumber));

    if (isActiveSelection && slides.length > 0 && verseNumber <= slides.length) {
      await navigateToSlide(verseNumber - 1);
      return;
    }

    await startChapter(verseNumber);
  }

  const previewProps = {
    title: isActiveSelection ? currentBookLabel : "Capítulo ativo",
    slides: isActiveSelection ? slides : [],
    activeIndex,
    isLoading:
      isActiveSelection &&
      currentPresentationQuery.isFetching &&
      slides.length === 0,
    isNavigating,
    onSlideSelect: (index: number) => void navigateToSlide(index),
    onPrevious: () => void navigateToSlide(activeIndex - 1),
    onNext: () => void navigateToSlide(activeIndex + 1),
  };

  return (
    <AppPage>
      <PageHeader
        eyebrow="Apresentação"
        title="Bíblia"
        description="Selecione livro, capítulo e versículo com foco em velocidade. O capítulo é iniciado no Holyrics e, a partir dele, você controla os versículos por clique ou pelas setas do teclado."
        meta={
          <>
            <StatusChip tone="primary">
              {effectiveVersion || "versão padrão do Holyrics"}
            </StatusChip>
            <StatusChip tone="neutral">{currentBookLabel}</StatusChip>
          </>
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPanelOpen(true)}
              disabled={!isActiveSelection || !slides.length}
            >
              <PanelRightOpenIcon data-icon="inline-start" />
              Abrir painel
            </Button>
            <Button size="sm" onClick={() => void startChapter(selectedVerseNumber)}>
              <MonitorPlayIcon data-icon="inline-start" />
              Iniciar capítulo
            </Button>
          </>
        }
      />

      <ToolbarRow>
        <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
          <div className="min-w-0 flex-1">
            <SearchToolbar
              value={search}
              onValueChange={setSearch}
              onClear={() => setSearch("")}
              placeholder="Digite a sigla ou nome do livro. Ex.: Jo, Rm, Sl…"
              resultLabel={
                <span className="text-sm text-muted-foreground">
                  Seleção instantânea por nome ou abreviação.
                </span>
              }
            />
          </div>

          <Select value={effectiveVersion} onValueChange={setSelectedVersion}>
            <SelectTrigger className="w-full md:w-72">
              <SelectValue placeholder="Escolha a versão" />
            </SelectTrigger>
            <SelectContent>
              {(bibleVersionsQuery.data ?? []).map((version) => (
                <SelectItem key={version.key} value={version.version}>
                  {version.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="number"
            min={1}
            value={selectedVerseInput}
            onChange={(event) => setSelectedVerseInput(event.target.value)}
            className="w-24"
            aria-label="Versículo"
          />
          <Button
            variant="outline"
            onClick={() => void goToVerse(selectedVerseNumber)}
            disabled={showBibleVerseMutation.isPending || selectVerseMutation.isPending}
          >
            {(showBibleVerseMutation.isPending || selectVerseMutation.isPending) ? (
              <LoaderIcon data-icon="inline-start" className="animate-spin" />
            ) : (
              <SparklesIcon data-icon="inline-start" />
            )}
            Ir para o versículo
          </Button>
        </div>
      </ToolbarRow>

      <SplitPanelSection
        primary={
          <div className="flex flex-col gap-6">
            <SurfaceCard>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Livros</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <BookGroup
                  title="Antigo Testamento"
                  books={oldTestamentBooks}
                  selectedBookId={selectedBookId}
                  onSelect={(bookId) => {
                    setSelectedBookId(bookId);
                    setSelectedChapter(1);
                    setSelectedVerseInput("1");
                  }}
                />
                <BookGroup
                  title="Novo Testamento"
                  books={newTestamentBooks}
                  selectedBookId={selectedBookId}
                  onSelect={(bookId) => {
                    setSelectedBookId(bookId);
                    setSelectedChapter(1);
                    setSelectedVerseInput("1");
                  }}
                />
              </CardContent>
            </SurfaceCard>

            <SurfaceCard>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Capítulos</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-4 gap-2 sm:grid-cols-6 xl:grid-cols-8">
                {chapterNumbers.map((chapterNumber) => (
                  <button
                    key={chapterNumber}
                    type="button"
                    onClick={() => {
                      setSelectedChapter(chapterNumber);
                      setSelectedVerseInput("1");
                    }}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                      effectiveChapter === chapterNumber
                        ? "border-primary/25 bg-primary/10 text-primary"
                        : "border-border bg-background hover:bg-muted/60",
                    )}
                  >
                    {chapterNumber}
                  </button>
                ))}
              </CardContent>
            </SurfaceCard>

            <SurfaceCard>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Versículos rápidos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isActiveSelection && verseNumbers.length > 0 ? (
                  <div className="grid grid-cols-5 gap-2 sm:grid-cols-7 xl:grid-cols-9">
                    {verseNumbers.map((verseNumber) => (
                      <button
                        key={verseNumber}
                        type="button"
                        onClick={() => void goToVerse(verseNumber)}
                        className={cn(
                          "rounded-xl border px-2.5 py-2 text-sm font-medium transition-colors",
                          activeIndex === verseNumber - 1
                            ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : "border-border bg-background hover:bg-muted/60",
                        )}
                      >
                        {verseNumber}
                      </button>
                    ))}
                  </div>
                ) : (
                  <EmptyStateSection
                    icon={SearchIcon}
                    title="Capítulo ainda não iniciado"
                    description="Assim que você iniciar o capítulo no Holyrics, os versículos aparecem aqui para navegação imediata."
                    action={
                      <Button onClick={() => void startChapter(selectedVerseNumber)}>
                        <BookOpenIcon data-icon="inline-start" />
                        Iniciar {currentBookLabel}
                      </Button>
                    }
                    className="py-10"
                  />
                )}
              </CardContent>
            </SurfaceCard>
          </div>
        }
        secondary={<BibleChapterPreview {...previewProps} />}
      />

      <BiblePresentationPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={currentBookLabel}
        content={<BibleChapterPreview {...previewProps} />}
        isMobile={isMobile}
        versions={bibleVersionsQuery.data ?? []}
        activeVersion={effectiveVersion}
        secondaryVersion={preferences.versionSecondary}
        tertiaryVersion={preferences.versionTertiary}
        showXVerses={preferences.showXVerses}
        defaultAction={preferences.defaultAction}
        isLoadingPreferences={isLoadingPreferences}
        isSavingPreferences={
          showBibleVerseMutation.isPending || selectVerseMutation.isPending
        }
        isPresentingVerse={currentPresentation?.type === "verse" && isActiveSelection}
        f8={f8}
        f9={f9}
        f10={f10}
        onPrimaryVersionChange={(value) => {
          setSelectedVersion(value);
          void updatePreferences({ versionPrimary: value });
        }}
        onSecondaryVersionChange={(value) => {
          void updatePreferences({ versionSecondary: value });
        }}
        onTertiaryVersionChange={(value) => {
          void updatePreferences({ versionTertiary: value });
        }}
        onShowXVersesChange={(value) => {
          void updatePreferences({ showXVerses: Number(value) });
        }}
        onDefaultActionChange={(value) => {
          void updatePreferences({
            defaultAction: value as "default" | "responsive_reading" | "only_reference",
          });
        }}
        onRefreshDefaults={async () => {
          await bibleSettingsQuery.refetch();
          await resetPreferences();
          setSelectedVersion("");
          toast.success("Preferências da Bíblia recarregadas do padrão.");
        }}
        onToggleWallpaper={toggleWallpaper}
        onToggleNoLyrics={toggleNoLyrics}
        onToggleBlackScreen={toggleBlackScreen}
        onClosePresentation={() => void closePresentation()}
      />
    </AppPage>
  );
}

function BookGroup({
  title,
  books,
  selectedBookId,
  onSelect,
}: {
  title: string;
  books: typeof BIBLE_BOOKS;
  selectedBookId: string;
  onSelect: (bookId: string) => void;
}) {
  if (!books.length) return null;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold tracking-tight">{title}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
        {books.map((book) => (
          <button
            key={book.id}
            type="button"
            onClick={() => onSelect(book.id)}
            className={cn(
              "flex items-center justify-between rounded-xl border px-3 py-2 text-left transition-colors",
              selectedBookId === book.id
                ? "border-primary/25 bg-primary/10 text-primary"
                : "border-border bg-background hover:bg-muted/60",
            )}
          >
            <span className="truncate text-sm font-medium">{book.name}</span>
            <span className="ml-2 shrink-0 text-xs uppercase text-muted-foreground">
              {book.shortName}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function BibleChapterPreview({
  title,
  slides,
  activeIndex,
  isLoading,
  isNavigating,
  onSlideSelect,
  onPrevious,
  onNext,
}: {
  title: string;
  slides: PresentationSlide[];
  activeIndex: number;
  isLoading: boolean;
  isNavigating: boolean;
  onSlideSelect: (index: number) => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <SurfaceCard className="h-full min-h-[32rem]">
      <CardHeader className="gap-4 border-b pb-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Use as setas do teclado ou clique em um bloco para trocar o versículo.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={onPrevious}
              disabled={activeIndex <= 0 || isNavigating || !slides.length}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onNext}
              disabled={activeIndex >= slides.length - 1 || isNavigating || !slides.length}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex h-full flex-col pt-5">
        {isLoading ? (
          <div className="flex min-h-72 items-center justify-center text-sm text-muted-foreground">
            <LoaderIcon className="mr-2 size-4 animate-spin" />
            Carregando capítulo ao vivo…
          </div>
        ) : slides.length > 0 ? (
          <div className="grid gap-3 overflow-y-auto pr-1">
            {slides.map((slide, index) => (
              <button
                key={`${index}-${slide.text ?? ""}`}
                type="button"
                onClick={() => onSlideSelect(index)}
                className={cn(
                  "rounded-2xl border px-4 py-4 text-left transition-colors",
                  activeIndex === index
                    ? "border-emerald-500/25 bg-emerald-500/10"
                    : "border-border bg-background hover:bg-muted/60",
                )}
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Versículo {index + 1}
                  </span>
                  {activeIndex === index ? (
                    <StatusChip tone="success">ativo</StatusChip>
                  ) : null}
                </div>
                <p className="text-sm leading-6 whitespace-pre-wrap">
                  {slide.text?.trim() || "Sem texto retornado pelo Holyrics."}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <EmptyStateSection
            icon={BookOpenIcon}
            title="Nenhum capítulo carregado"
            description="Inicie um capítulo na coluna ao lado para transformar esta área em um mapa navegável de versículos."
            className="my-auto py-14"
          />
        )}
      </CardContent>
    </SurfaceCard>
  );
}

function BiblePresentationPanel({
  open,
  onClose,
  title,
  content,
  isMobile,
  versions,
  activeVersion,
  secondaryVersion,
  tertiaryVersion,
  showXVerses,
  defaultAction,
  isLoadingPreferences,
  isSavingPreferences,
  isPresentingVerse,
  f8,
  f9,
  f10,
  onPrimaryVersionChange,
  onSecondaryVersionChange,
  onTertiaryVersionChange,
  onShowXVersesChange,
  onDefaultActionChange,
  onRefreshDefaults,
  onToggleWallpaper,
  onToggleNoLyrics,
  onToggleBlackScreen,
  onClosePresentation,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  content: React.ReactNode;
  isMobile: boolean;
  versions: {
    key: string;
    version: string;
    title: string;
  }[];
  activeVersion: string;
  secondaryVersion: string;
  tertiaryVersion: string;
  showXVerses: number;
  defaultAction: "default" | "responsive_reading" | "only_reference";
  isLoadingPreferences: boolean;
  isSavingPreferences: boolean;
  isPresentingVerse: boolean;
  f8: boolean;
  f9: boolean;
  f10: boolean;
  onPrimaryVersionChange: (value: string) => void;
  onSecondaryVersionChange: (value: string) => void;
  onTertiaryVersionChange: (value: string) => void;
  onShowXVersesChange: (value: string) => void;
  onDefaultActionChange: (value: string) => void;
  onRefreshDefaults: () => void;
  onToggleWallpaper: () => void;
  onToggleNoLyrics: () => void;
  onToggleBlackScreen: () => void;
  onClosePresentation: () => void;
}) {
  const shell = (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b px-4 py-4 backdrop-blur-sm shrink-0">
        <div className="shrink-0 size-9 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center">
          <BookOpenIcon className="size-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate leading-tight">{title}</p>
          <p className="text-xs text-muted-foreground truncate">
            Controle da apresentação de Bíblia
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-8 text-xs"
            onClick={onRefreshDefaults}
            disabled={isLoadingPreferences}
          >
            <RefreshCwIcon
              className={cn("size-3.5", isLoadingPreferences && "animate-spin")}
            />
            <span className="hidden sm:inline">Recarregar padrão</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground"
            onClick={onClose}
          >
            <XIcon className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 px-4 py-2 bg-muted/30 border-b overflow-x-auto no-scrollbar shrink-0">
        <div className="flex items-center gap-1.5 pr-3 border-r">
          <Button
            size="sm"
            variant={f8 ? "default" : "ghost"}
            className={cn(
              "h-8 px-2 gap-1.5 text-xs font-semibold transition-colors",
              !f8 && "hover:bg-primary/10 hover:text-primary",
            )}
            onClick={onToggleWallpaper}
          >
            <ImageIcon className="size-3.5" />
            <span className="hidden sm:inline">Wallpaper</span>
          </Button>
          <Button
            size="sm"
            variant={f9 ? "default" : "ghost"}
            className={cn(
              "h-8 px-2 gap-1.5 text-xs font-semibold transition-colors",
              !f9 && "hover:bg-primary/10 hover:text-primary",
            )}
            onClick={onToggleNoLyrics}
          >
            <TypeIcon className="size-3.5" />
            <span className="hidden sm:inline">Sem Letra</span>
          </Button>
          <Button
            size="sm"
            variant={f10 ? "default" : "ghost"}
            className={cn(
              "h-8 px-2 gap-1.5 text-xs font-semibold transition-colors",
              !f10 && "hover:bg-primary/10 hover:text-primary",
            )}
            onClick={onToggleBlackScreen}
          >
            <MonitorOffIcon className="size-3.5" />
            <span className="hidden sm:inline">Black</span>
          </Button>
        </div>
        <div className="flex-1" />
        {isPresentingVerse ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 gap-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onClosePresentation}
          >
            <XCircleIcon className="size-3.5" />
            <span>Encerrar</span>
          </Button>
        ) : null}
      </div>

      <div className="border-b px-4 py-3 shrink-0">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <BiblePanelSelect
            label="Versão 1"
            value={activeVersion}
            onChange={onPrimaryVersionChange}
            versions={versions}
            disabled={isLoadingPreferences}
          />
          <BiblePanelSelect
            label="Versão 2"
            value={secondaryVersion}
            onChange={onSecondaryVersionChange}
            versions={versions}
            disabled={isLoadingPreferences}
            allowEmpty
          />
          <BiblePanelSelect
            label="Versão 3"
            value={tertiaryVersion}
            onChange={onTertiaryVersionChange}
            versions={versions}
            disabled={isLoadingPreferences}
            allowEmpty
          />
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Exibir
            </p>
            <Select
              value={String(showXVerses)}
              onValueChange={onShowXVersesChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Quantidade de versos" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6].map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    {value} versículo{value > 1 ? "s" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Modo padrão
            </p>
            <Select value={defaultAction} onValueChange={onDefaultActionChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Escolha o modo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="responsive_reading">Leitura responsiva</SelectItem>
                <SelectItem value="default">Padrão</SelectItem>
                <SelectItem value="only_reference">Só referência</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <div className="inline-flex items-center gap-2 rounded-xl border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              {isSavingPreferences ? (
                <LoaderIcon className="size-3.5 animate-spin" />
              ) : (
                <CheckCircle2Icon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              )}
              Preferências salvas por servidor no cache local
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-4">{content}</div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
        <DrawerContent className="h-dvh flex flex-col rounded-none">
          <DrawerTitle className="sr-only">{title}</DrawerTitle>
          {shell}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full p-0 sm:min-w-[42rem] sm:max-w-[52vw]"
      >
        <SheetTitle className="sr-only">{title}</SheetTitle>
        {shell}
      </SheetContent>
    </Sheet>
  );
}

function BiblePanelSelect({
  label,
  value,
  onChange,
  versions,
  disabled,
  allowEmpty = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  versions: { key: string; version: string; title: string }[];
  disabled?: boolean;
  allowEmpty?: boolean;
}) {
  const selectValue = value || (allowEmpty ? "__none__" : "");

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <Select
        value={selectValue}
        onValueChange={(nextValue) =>
          onChange(nextValue === "__none__" ? "" : nextValue)
        }
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione uma versão" />
        </SelectTrigger>
        <SelectContent>
          {allowEmpty ? <SelectItem value="__none__">Não usar</SelectItem> : null}
          {versions.map((version) => (
            <SelectItem key={`${label}-${version.key}`} value={version.version}>
              {version.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
