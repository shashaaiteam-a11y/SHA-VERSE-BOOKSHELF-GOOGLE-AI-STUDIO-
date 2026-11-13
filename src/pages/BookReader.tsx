import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBookInteractions } from "@/hooks/useBookInteractions";
import PDFViewer, { PDFOutlineItem } from "@/components/bookshelf/PDFViewer";
import EPUBViewer, { type TocItem } from "@/components/bookshelf/EPUBViewer";
import PaginatedReader, {
  type PaginationInfo,
  type ReaderLocation,
} from "@/components/bookshelf/reader/PaginatedReader";
import ReaderSettingsPanel from "@/components/bookshelf/reader/ReaderSettingsPanel";
import ReaderSearchPanel, { type SearchMatch } from "@/components/bookshelf/reader/ReaderSearchPanel";
import { useBookTranslation } from "@/hooks/useBookTranslation";
import { useAudioReader, type AudioVoice } from "@/hooks/useAudioReader";
import { getReadableTextForLocation } from "@/lib/reader/audioVoices";
import { useReflowBook } from "@/hooks/useReflowBook";
import { useReaderSettings, READER_THEMES, type ReaderTheme } from "@/lib/reader/settings";
import { useReaderBookmarks } from "@/hooks/useReaderBookmarks";
import { useReaderHighlights } from "@/hooks/useReaderHighlights";
import type { Block, ReflowBook } from "@/lib/reader/types";
import { REFLOW_MODEL_VERSION } from "@/lib/reader/types";
import { recordBookView } from "@/hooks/useBookshelfAnalytics";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Settings,
  Book,
  List,
  FileText,
  Search,
  Loader2,
  ZoomIn,
  ZoomOut,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

// Helper to detect file type from URL
const getFileType = (url: string | null): "pdf" | "epub" | "unknown" => {
  if (!url) return "unknown";
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.endsWith(".pdf") || lowerUrl.includes(".pdf?")) return "pdf";
  if (lowerUrl.endsWith(".epub") || lowerUrl.includes(".epub?")) return "epub";
  if (lowerUrl.includes("/files/") && !lowerUrl.includes(".epub")) return "pdf";
  return "unknown";
};

const BookReader = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();

  // Reader Settings (Google Play Books style: theme, font, size, readingMode, etc.)
  const { settings, update: updateSetting, reset: resetSettings } = useReaderSettings();

  // Mode: "flow" (Google Play Books adaptive reflow) vs "original" (Fixed-page PDF)
  const [viewMode, setViewMode] = useState<"flow" | "original">("flow");

  // Page / Progress tracking
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [percent, setPercent] = useState(0);
  const [currentChapter, setCurrentChapter] = useState("");
  const [currentBlockId, setCurrentBlockId] = useState<string | null>(null);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);

  // Navigation flip request for PaginatedReader
  const [navRequest, setNavRequest] = useState<{ delta: number; token: number } | null>(null);
  const [jumpTo, setJumpTo] = useState<{ blockIndex: number; token: number } | null>(null);

  // Search in book
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Controls visibility (tap center to toggle, auto-hides for immersive reading)
  const [showControls, setShowControls] = useState(true);
  const [showToc, setShowToc] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // PDF original outline and scale
  const [pdfOutline, setPdfOutline] = useState<PDFOutlineItem[]>([]);
  const [epubToc, setEpubToc] = useState<TocItem[]>([]);
  const [pdfScale, setPdfScale] = useState(1.0);

  const epubViewerRef = useRef<HTMLDivElement>(null);

  // Book data from Supabase
  const { data: book, isLoading } = useQuery({
    queryKey: ["book", bookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select(
          "id, channel_id, title, author, description, cover_url, book_url, pages, views_count, likes_count, comments_count, created_at, category, language, tags, visibility, age_restriction, comments_enabled, ratings_enabled, downloads_count, rating_avg, rating_count"
        )
        .eq("id", bookId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!bookId,
  });

  const { readingProgress, updateProgress } = useBookInteractions(bookId);
  const { bookmarks, addBookmark } = useReaderBookmarks(bookId);
  const { highlights, addHighlight } = useReaderHighlights(bookId);

  const fileType = getFileType(book?.book_url);

  // Google Play Books Reflow Engine for PDF / Text (paused when viewing Original PDF)
  const {
    book: reflowBook,
    status: reflowStatus,
    progress: reflowProgress,
  } = useReflowBook({
    bookId: book?.id,
    url: book?.book_url || undefined,
    title: book?.title,
    author: book?.author,
    enabled: !!book?.book_url && fileType === "pdf" && viewMode === "flow",
  });

  // Translation Hook
  const {
    translateBook,
    resetTranslation,
    isTranslating,
    translationProgress,
    translatedBook,
    targetLanguage,
  } = useBookTranslation();

  // Audio Reader Hook
  const {
    voices,
    currentVoice,
    setCurrentVoice,
    isPlaying,
    isPaused,
    isLoadingAudio,
    loadingExampleId,
    playingExampleId,
    play,
    stop,
    togglePause,
    playExample,
  } = useAudioReader();

  // Fallback Reflow Book for description/preview if no readable PDF extracted yet
  const fallbackReflowBook: ReflowBook = useMemo(() => {
    const blocks: Block[] = [
      {
        id: "b_title",
        page: 1,
        type: "heading",
        level: 1,
        text: book?.title || "Untitled Book",
        dir: "ltr",
      },
      {
        id: "b_author",
        page: 1,
        type: "heading",
        level: 3,
        text: book?.author ? `By ${book.author}` : "",
        dir: "ltr",
      },
      ...(book?.description
        ? book.description.split("\n\n").map((para, i) => ({
            id: `b_desc_${i}`,
            page: 1,
            type: "paragraph" as const,
            text: para.trim(),
            dir: "ltr" as const,
          }))
        : [
            {
              id: "b_sample",
              page: 1,
              type: "paragraph" as const,
              text: "Welcome to Sha-Verse Digital Reader. This book is configured with Google Play Books adaptive text reflow for optimal reading on mobile, tablet, and desktop screens.",
              dir: "ltr" as const,
            },
          ]),
    ];

    return {
      version: REFLOW_MODEL_VERSION,
      bookId: book?.id || "temp",
      meta: {
        title: book?.title,
        author: book?.author,
        totalPages: 1,
        scanned: false,
        dir: "ltr",
      },
      blocks,
      chapters: [{ id: "c1", title: "Overview", blockIndex: 0, page: 1, level: 1 }],
    };
  }, [book]);

  // Source Reflow Book (untranslated)
  const sourceReflowBook = reflowBook || fallbackReflowBook;

  // Active Reflow Book (Priority: Translated -> Original -> Fallback)
  const activeReflowBook = translatedBook || sourceReflowBook;

  // Active Theme colors
  const activeTheme = READER_THEMES[settings.theme] || READER_THEMES.white;

  // If PDF extraction finishes with more blocks while a translation is active, translate remaining blocks seamlessly
  useEffect(() => {
    if (
      targetLanguage &&
      !isTranslating &&
      reflowStatus === "ready" &&
      reflowBook &&
      translatedBook &&
      translatedBook.blocks.length < reflowBook.blocks.length
    ) {
      void translateBook(reflowBook, targetLanguage, currentBlockIndex);
    }
  }, [
    targetLanguage,
    isTranslating,
    reflowStatus,
    reflowBook,
    translatedBook,
    translateBook,
    currentBlockIndex,
  ]);

  // Handle Audio Start with explicit voice support (no stale closure)
  const handleStartAudio = useCallback(
    (voiceOverride?: AudioVoice) => {
      if (!activeReflowBook) return;
      const textToRead = getReadableTextForLocation(
        activeReflowBook,
        currentPage,
        totalPages,
        currentBlockId
      );
      void play(textToRead, {
        voice: voiceOverride || currentVoice,
        targetLanguage,
      });
    },
    [activeReflowBook, currentPage, totalPages, currentBlockId, play, currentVoice, targetLanguage]
  );

  // Sync saved progress on initial load
  useEffect(() => {
    if (readingProgress?.current_page) {
      setCurrentPage(readingProgress.current_page);
    }
  }, [readingProgress]);

  // Periodic progress saving
  useEffect(() => {
    if (bookId && totalPages > 0) {
      const timer = setTimeout(() => {
        updateProgress.mutate({ currentPage, totalPages });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentPage, totalPages, bookId, updateProgress]);

  // Atomic view recording with session deduplication
  useEffect(() => {
    if (bookId) {
      recordBookView(bookId);
    }
  }, [bookId]);

  // Navigation handlers
  const handlePrevPage = useCallback(() => {
    if (fileType === "epub") {
      const methods = (epubViewerRef.current as any)?.__epubMethods;
      if (methods?.prevPage) methods.prevPage();
      setCurrentPage((p) => Math.max(1, p - 1));
    } else if (viewMode === "flow") {
      setNavRequest({ delta: -1, token: Date.now() });
    } else {
      setCurrentPage((p) => Math.max(1, p - 1));
    }
  }, [fileType, viewMode]);

  const handleNextPage = useCallback(() => {
    if (fileType === "epub") {
      const methods = (epubViewerRef.current as any)?.__epubMethods;
      if (methods?.nextPage) methods.nextPage();
      setCurrentPage((p) => Math.min(totalPages, p + 1));
    } else if (viewMode === "flow") {
      setNavRequest({ delta: 1, token: Date.now() });
    } else {
      setCurrentPage((p) => Math.min(totalPages, p + 1));
    }
  }, [fileType, viewMode, totalPages]);

  // Keyboard navigation (Google Play Books style)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        handlePrevPage();
      } else if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        handleNextPage();
      } else if (e.key === "Escape") {
        setShowControls((c) => !c);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrevPage, handleNextPage]);

  // PaginatedReader callbacks
  const handlePaginationChange = useCallback((info: PaginationInfo) => {
    setCurrentPage(info.page);
    setTotalPages(Math.max(1, info.totalPages));
    setPercent(info.percent);
    if (info.chapterTitle) setCurrentChapter(info.chapterTitle);
  }, []);

  const handleLocationChange = useCallback((loc: ReaderLocation) => {
    setCurrentBlockId(loc.blockId);
    setCurrentBlockIndex(loc.blockIndex);
  }, []);

  const handlePdfTotalPagesChange = useCallback((t: number) => {
    setTotalPages(Math.max(1, t));
  }, []);

  // Jump to specific search match
  const handleSelectSearchMatch = (match: SearchMatch) => {
    setJumpTo({ blockIndex: match.blockIndex, token: Date.now() });
    setShowSearch(false);
  };

  // Bookmark current page
  const handleAddBookmark = () => {
    addBookmark.mutate({
      location: { page: currentPage },
      label: currentChapter ? `${currentChapter} · Page ${currentPage}` : `Page ${currentPage}`,
    });
  };

  // Render Table of Contents Items
  const renderOutlineItems = (items: PDFOutlineItem[], depth = 0) => {
    return items.map((item, index) => (
      <div key={`${item.title}-${index}`}>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-left text-xs sm:text-sm py-2 h-auto whitespace-normal",
            depth > 0 && "pl-6 font-normal text-muted-foreground"
          )}
          onClick={() => {
            setCurrentPage(item.pageNumber);
            setShowToc(false);
          }}
        >
          <span className="truncate flex-1">{item.title}</span>
          <span className="ml-2 text-[11px] text-muted-foreground shrink-0">p. {item.pageNumber}</span>
        </Button>
        {item.items && item.items.length > 0 && renderOutlineItems(item.items, depth + 1)}
      </div>
    ));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Opening Book in Reader Mode...</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <Book className="w-14 h-14 text-muted-foreground mb-4" />
        <h1 className="text-xl font-bold">Book not found</h1>
        <Button variant="link" onClick={() => navigate("/bookshelf")} className="mt-2">
          Back to Bookshelf
        </Button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full relative select-none overflow-x-hidden flex flex-col transition-colors duration-200"
      style={{
        backgroundColor: activeTheme.bg,
        color: activeTheme.text,
      }}
    >
      {/* Top Header Bar (Google Play Books Style, toggleable) */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-md border-b",
          showControls ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        )}
        style={{
          backgroundColor: `${activeTheme.bg}f2`,
          borderColor: `${activeTheme.muted}30`,
          color: activeTheme.text,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-4 h-14 flex items-center relative">
          {/* Left: Back button */}
          <div className="flex items-center z-10">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full w-10 h-10 hover:bg-primary/10 transition-colors"
              onClick={() => navigate(-1)}
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>

          {/* Center: Title and Author (Native Style) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-16">
            <h1 className="font-bold text-[13px] sm:text-[15px] truncate max-w-full leading-tight text-center" title={book.title}>
              {book.title}
            </h1>
            <p className="text-[10px] sm:text-[11px] opacity-70 truncate max-w-[80%] text-center font-medium" title={book.author}>
              {book.author}
            </p>
            
            {/* Subtle Reflow / Translation Progress integrated into header center-bottom */}
            {((reflowStatus === "extracting" && viewMode === "flow") || isTranslating) && (
              <div className="absolute bottom-1 flex items-center gap-1.5 animate-pulse">
                <div className="w-1 h-1 rounded-full bg-primary" />
                <span className="text-[8px] font-bold uppercase tracking-widest opacity-70">
                  {isTranslating
                    ? `Translating ${targetLanguage} ${translationProgress}%`
                    : `Reflowing ${reflowProgress}%`}
                </span>
              </div>
            )}
          </div>

          {/* Right: Action Tools */}
          <div className="ml-auto flex items-center gap-0.5 sm:gap-1 z-10">
            {/* Original PDF Zoom Buttons */}
            {fileType === "pdf" && viewMode === "original" && (
              <div className="hidden md:flex items-center gap-0.5 mr-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-full"
                  onClick={() => setPdfScale((s) => Math.max(0.75, s - 0.25))}
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-full"
                  onClick={() => setPdfScale((s) => Math.min(2.5, s + 0.25))}
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Search in Book */}
            {viewMode === "flow" && (
              <Button
                variant="ghost"
                size="icon"
                className="w-9 h-9 rounded-full"
                onClick={() => setShowSearch(true)}
                title="Search Book"
              >
                <Search className="w-[18px] h-[18px]" />
              </Button>
            )}

            {/* Quick Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9 rounded-full"
              onClick={() => {
                const order: Array<ReaderTheme> = ["white", "warm", "cream", "sepia", "dark", "night", "black"];
                const next = order[(order.indexOf(settings.theme) + 1) % order.length];
                updateSetting("theme", next);
              }}
              title={`Theme: ${settings.theme}`}
            >
              {settings.theme === "dark" || settings.theme === "black" ? (
                <Moon className="w-[18px] h-[18px]" />
              ) : (
                <Sun className="w-[18px] h-[18px]" />
              )}
            </Button>

            {/* Reader Settings Drawer */}
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9 rounded-full"
              onClick={() => setShowSettings(true)}
              title="Reader Typography & Theme"
            >
              <Settings className="w-[18px] h-[18px]" />
            </Button>

            {/* Table of Contents */}
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9 rounded-full"
              onClick={() => setShowToc(true)}
              title="Table of Contents"
            >
              <List className="w-[18px] h-[18px]" />
            </Button>

            {/* Bookmark */}
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9 rounded-full"
              onClick={handleAddBookmark}
              title="Bookmark Page"
            >
              <Bookmark className="w-[18px] h-[18px]" />
            </Button>
          </div>
        </div>

      </header>

      {/* Main Reading Viewport */}
      <main className="flex-1 w-full relative flex items-center justify-center overflow-hidden">
        {/* EPUB Google Play Books Engine */}
        {fileType === "epub" && book.book_url ? (
          <div className="w-full h-screen pt-14 pb-16" onClick={() => setShowControls((c) => !c)}>
            <div ref={epubViewerRef} className="w-full h-full">
              <EPUBViewer
                url={book.book_url}
                theme={settings.theme}
                settings={settings}
                onTocExtracted={setEpubToc}
                onLocationChange={(_cfi, page, total) => {
                  setCurrentPage(page);
                  setTotalPages(Math.max(1, total));
                  setPercent(Math.round((page / Math.max(1, total)) * 100));
                }}
                className="w-full h-full"
              />
            </div>
          </div>
        ) : viewMode === "flow" ? (
          /* Google Play Books Adaptive Reflow Reader for PDF / Digital Text */
          <div className="w-full h-screen pt-14 pb-16 flex flex-col justify-center">

            <PaginatedReader
              book={activeReflowBook}
              settings={settings}
              highlights={highlights}
              searchQuery={searchQuery}
              jumpTo={jumpTo}
              navRequest={navRequest}
              coverUrl={book.cover_url}
              title={book.title}
              author={book.author}
              onPaginationChange={handlePaginationChange}
              onLocationChange={handleLocationChange}
              onCreateHighlight={(payload) => addHighlight(payload)}
              onTap={() => setShowControls((c) => !c)}
              className="w-full h-full"
            />
          </div>
        ) : (
          /* Original PDF Canvas View (immediate PDF conversion mode) */
          <div
            className="w-full h-screen pt-14 pb-16 px-2 sm:px-4 flex items-center justify-center overflow-hidden"
            onClick={() => setShowControls((c) => !c)}
          >
            {book.book_url ? (
              <PDFViewer
                url={book.book_url}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onTotalPagesChange={handlePdfTotalPagesChange}
                onOutlineExtracted={setPdfOutline}
                isDarkMode={settings.theme === "dark" || settings.theme === "black" || settings.theme === "night"}
                scale={pdfScale}
                className="w-full h-full"
              />
            ) : (
              <div className="text-center p-6 text-sm text-muted-foreground">
                No original PDF file is attached to this book.
              </div>
            )}
          </div>
        )}

        {/* Invisible Tap Zones for Fast Page Flip (Google Play Books Style) */}
        {viewMode === "flow" && settings.readingMode === "paged" && (
          <>
            {/* Left 15% Screen Tap -> Previous Page */}
            <div
              className="absolute left-0 top-16 bottom-16 w-[15%] z-20 cursor-w-resize"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevPage();
              }}
              title="Previous Page"
            />
            {/* Right 15% Screen Tap -> Next Page */}
            <div
              className="absolute right-0 top-16 bottom-16 w-[15%] z-20 cursor-e-resize"
              onClick={(e) => {
                e.stopPropagation();
                handleNextPage();
              }}
              title="Next Page"
            />
          </>
        )}
      </main>

      {/* Floating Audio Playback Bar */}
      {(isPlaying || isPaused || isLoadingAudio) && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-full border px-4 py-2 shadow-xl backdrop-blur-md"
          style={{
            backgroundColor: `${activeTheme.bg}f5`,
            borderColor: `${activeTheme.muted}40`,
            color: activeTheme.text,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-xs leading-tight max-w-[160px] truncate">
            <p className="font-bold truncate">{currentVoice.name}</p>
            <p className="text-[10px] opacity-70 truncate">
              {isLoadingAudio
                ? "Preparing audio..."
                : targetLanguage
                ? `Speaking in ${targetLanguage}`
                : "Audio Reader"}
            </p>
          </div>
          {!isLoadingAudio && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-7 px-3 rounded-full text-xs font-semibold"
              onClick={togglePause}
            >
              {isPaused ? "Resume" : "Pause"}
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="destructive"
            className="h-7 px-3 rounded-full text-xs font-semibold"
            onClick={stop}
          >
            Stop
          </Button>
        </div>
      )}

      {/* Bottom Reading Progress Bar (Google Play Books Style, toggleable) */}
      <footer
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-md border-t select-none",
          showControls ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        )}
        style={{
          backgroundColor: `${activeTheme.bg}f2`,
          borderColor: `${activeTheme.muted}30`,
          color: activeTheme.text,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-3xl mx-auto px-4 py-2.5 space-y-2">
          {/* Progress Slider */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full shrink-0"
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="flex-1">
              <Slider
                value={[currentPage]}
                min={1}
                max={Math.max(1, totalPages)}
                step={1}
                onValueChange={(v) => {
                  const targetPage = v[0];
                  setCurrentPage(targetPage);
                  if (viewMode === "flow" && activeReflowBook.blocks.length > 0) {
                    const targetBlockIndex = Math.floor(
                      ((targetPage - 1) / Math.max(1, totalPages)) * activeReflowBook.blocks.length
                    );
                    setJumpTo({ blockIndex: targetBlockIndex, token: Date.now() });
                  }
                }}
                className="cursor-pointer"
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full shrink-0"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Reading Meta Row */}
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1 font-medium">
            <span className="truncate max-w-[200px]">
              {currentChapter || book.title}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-bold">
                {percent > 0 ? `${percent}%` : `${Math.round((currentPage / Math.max(1, totalPages)) * 100)}%`}
              </Badge>
              <span>
                Page {currentPage} of {totalPages}
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Reader Settings Sheet (Typography, Line Height, Theme) */}
      <Sheet open={showSettings} onOpenChange={setShowSettings}>
        <SheetContent side="right" className="w-[92vw] max-w-[380px] p-0 z-50">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="text-base font-bold flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" />
              Reader Settings
            </SheetTitle>
          </SheetHeader>
          <div className="h-[calc(100vh-65px)] overflow-y-auto overflow-x-hidden px-4">
            <ReaderSettingsPanel
              settings={settings}
              onChange={updateSetting}
              onReset={resetSettings}
              fileType={fileType}
              viewMode={viewMode}
              onViewModeChange={(mode) => {
                if (mode === "original" && sourceReflowBook?.meta?.totalPages) {
                  setCurrentPage((p) =>
                    Math.max(1, Math.min(p, sourceReflowBook.meta.totalPages))
                  );
                }
                setViewMode(mode);
                setShowSettings(false);
              }}
              // Translation props
              isTranslating={isTranslating}
              translationProgress={translationProgress}
              targetLanguage={targetLanguage}
              onTranslate={(lang) => {
                if (viewMode === "original") {
                  setViewMode("flow");
                }
                void translateBook(sourceReflowBook, lang, currentBlockIndex);
                setShowSettings(false);
              }}
              onResetTranslation={resetTranslation}
              // Audio Reader props
              voices={voices}
              currentVoice={currentVoice}
              onVoiceSelect={(voice) => {
                setCurrentVoice(voice);
                if (viewMode === "original") {
                  setViewMode("flow");
                }
                handleStartAudio(voice);
              }}
              isPlaying={isPlaying}
              isPaused={isPaused}
              isLoadingAudio={isLoadingAudio}
              loadingExampleId={loadingExampleId}
              playingExampleId={playingExampleId}
              onStopAudio={stop}
              onTogglePauseAudio={togglePause}
              onPlayExample={(voice) => {
                void playExample(voice, targetLanguage);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Table of Contents Sheet */}
      <Sheet open={showToc} onOpenChange={setShowToc}>
        <SheetContent side="left" className="w-[300px] sm:w-[360px] p-0 z-50">
          <SheetHeader className="p-4 border-b flex flex-row items-center justify-between">
            <SheetTitle className="text-base font-bold flex items-center gap-2">
              <List className="w-4 h-4 text-primary" />
              Table of Contents
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-65px)] p-2">
            {/* Chapters / Outlines */}
            {activeReflowBook.chapters.length > 0 ? (
              <div className="space-y-1">
                {activeReflowBook.chapters.map((ch) => (
                  <Button
                    key={ch.id}
                    variant="ghost"
                    className="w-full justify-between text-left text-xs sm:text-sm py-2 h-auto"
                    onClick={() => {
                      setJumpTo({ blockIndex: ch.blockIndex, token: Date.now() });
                      setShowToc(false);
                    }}
                  >
                    <span className="truncate flex-1 font-medium">{ch.title}</span>
                    <span className="text-xs text-muted-foreground ml-2">p. {ch.page}</span>
                  </Button>
                ))}
              </div>
            ) : pdfOutline.length > 0 ? (
              renderOutlineItems(pdfOutline)
            ) : epubToc.length > 0 ? (
              <div className="space-y-1">
                {epubToc.map((item, idx) => (
                  <Button
                    key={idx}
                    variant="ghost"
                    className="w-full justify-start text-left text-xs sm:text-sm py-2 h-auto"
                    onClick={() => {
                      const methods = (epubViewerRef.current as any)?.__epubMethods;
                      if (methods?.goToHref) methods.goToHref(item.href);
                      setShowToc(false);
                    }}
                  >
                    <span className="truncate">{item.label}</span>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No table of contents available for this book.
              </div>
            )}

            {/* Saved Bookmarks Section */}
            {bookmarks.length > 0 && (
              <div className="mt-6 pt-4 border-t border-border">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-3 mb-2 flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-primary" />
                  Your Bookmarks ({bookmarks.length})
                </h4>
                <div className="space-y-1">
                  {bookmarks.map((bm) => (
                    <Button
                      key={bm.id}
                      variant="ghost"
                      className="w-full justify-between text-xs py-2 h-auto text-left"
                      onClick={() => {
                        if (bm.location.page) {
                          setCurrentPage(bm.location.page);
                        }
                        setShowToc(false);
                      }}
                    >
                      <span className="truncate font-medium">{bm.label || `Page ${bm.location.page}`}</span>
                      <span className="text-[11px] text-muted-foreground ml-2">p. {bm.location.page}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* In-Book Search Drawer */}
      <Sheet open={showSearch} onOpenChange={setShowSearch}>
        <SheetContent side="right" className="w-[320px] sm:w-[400px] p-0 z-50">
          <ReaderSearchPanel
            book={activeReflowBook}
            query={searchQuery}
            onQueryChange={setSearchQuery}
            onSelect={handleSelectSearchMatch}
            onClose={() => setShowSearch(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default BookReader;
