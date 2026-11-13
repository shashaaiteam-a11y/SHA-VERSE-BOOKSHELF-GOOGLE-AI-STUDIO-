import { useEffect, useRef, useState, useCallback } from "react";
import ePub, { Book, Rendition } from "epubjs";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { READER_THEMES, READER_FONT_STACKS, type ReaderTheme, type ReaderSettings } from "@/lib/reader/settings";

interface EPUBViewerProps {
  url: string;
  initialCfi?: string;
  onLocationChange?: (cfi: string, page: number, totalPages: number) => void;
  onTocExtracted?: (toc: TocItem[]) => void;
  theme?: ReaderTheme;
  settings: ReaderSettings;
  className?: string;
}

export interface TocItem {
  label: string;
  href: string;
  subitems?: TocItem[];
}

// Strong CSS isolation rules + Google Play Books-style typography baseline.
const ISOLATION_RULES: Record<string, string> = {
  "html, body": "margin: 0 !important; padding: 0 !important; max-width: 100% !important; overflow-x: hidden !important;",
  "*": "box-sizing: border-box !important;",
  "[style*='position: fixed'], [style*='position:fixed']": "position: static !important;",
  "img, svg, video": "max-width: 100% !important; height: auto !important;",
  // GPB-style readable paragraphs
  "p": "line-height: 1.65 !important; margin: 0 0 1em 0 !important; text-align: justify !important; text-justify: inter-word !important; hyphens: auto !important; -webkit-hyphens: auto !important;",
  "p + p": "text-indent: 1.5em !important;",
  "h1, h2, h3, h4, h5, h6": "font-family: Georgia, 'Times New Roman', serif !important; line-height: 1.3 !important; margin: 1.2em 0 0.6em !important;",
};

const GPB_BODY = "font-family: 'Literata', Georgia, 'Times New Roman', serif !important; padding: 0 24px !important; -webkit-font-smoothing: antialiased !important; -moz-osx-font-smoothing: grayscale !important; text-rendering: optimizeLegibility !important;";

const THEME_STYLES: Record<string, Record<string, string>> = {
  white: {
    ...ISOLATION_RULES,
    body: `background-color: #ffffff !important; color: #121212 !important; ${GPB_BODY}`,
  },
  warm: {
    ...ISOLATION_RULES,
    body: `background-color: #fdf6e3 !important; color: #433422 !important; ${GPB_BODY}`,
  },
  cream: {
    ...ISOLATION_RULES,
    body: `background-color: #fff9f0 !important; color: #1a1a1a !important; ${GPB_BODY}`,
  },
  sepia: {
    ...ISOLATION_RULES,
    body: `background-color: #f4ecd8 !important; color: #3b2f1e !important; ${GPB_BODY}`,
  },
  dark: {
    ...ISOLATION_RULES,
    body: `background-color: #202124 !important; color: #e8eaed !important; ${GPB_BODY}`,
  },
  night: {
    ...ISOLATION_RULES,
    body: `background-color: #121212 !important; color: #b0b0b0 !important; ${GPB_BODY}`,
  },
  black: {
    ...ISOLATION_RULES,
    body: `background-color: #000000 !important; color: #ffffff !important; ${GPB_BODY}`,
  },
};

const EPUBViewer = ({
  url,
  initialCfi,
  onLocationChange,
  onTocExtracted,
  theme = "white",
  settings,
  className,
}: EPUBViewerProps) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<Book | null>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getCustomStyles = useCallback(() => {
    const fontStack = READER_FONT_STACKS[settings.font] || READER_FONT_STACKS.literata;
    const lineHeight = settings.lineHeight || 1.65;
    const textAlign = settings.justify ? "justify" : "left";
    
    return {
      body: `font-family: ${fontStack} !important; line-height: ${lineHeight} !important; text-align: ${textAlign} !important;`,
      p: `line-height: ${lineHeight} !important; text-align: ${textAlign} !important;`,
    };
  }, [settings.font, settings.lineHeight, settings.justify]);

  // Initialize book
  useEffect(() => {
    if (!viewerRef.current) return;

    let isMounted = true;
    const container = viewerRef.current;

    const initBook = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Clean up previous
        if (bookRef.current) {
          bookRef.current.destroy();
        }

        const book = ePub(url);
        bookRef.current = book;

        const rendition = book.renderTo(container, {
          width: "100%",
          height: "100%",
          spread: "none",
          flow: "paginated",
        });

        renditionRef.current = rendition;

        // Apply initial theme
        Object.entries(THEME_STYLES).forEach(([name, styles]) => {
          rendition.themes.register(name, styles);
        });
        rendition.themes.select(theme);
        rendition.themes.fontSize(`${settings.fontSize}px`);
        rendition.themes.default(getCustomStyles());

        // Display from saved position or start
        if (initialCfi) {
          await rendition.display(initialCfi);
        } else {
          await rendition.display();
        }

        // Generate locations for progress tracking
        await book.locations.generate(1024);

        // Extract TOC
        const navigation = await book.loaded.navigation;
        if (navigation?.toc && onTocExtracted) {
          const toc: TocItem[] = navigation.toc.map((item: any) => ({
            label: item.label?.trim() || "Untitled",
            href: item.href,
            subitems: item.subitems?.map((sub: any) => ({
              label: sub.label?.trim() || "Untitled",
              href: sub.href,
            })),
          }));
          onTocExtracted(toc);
        }

        // Track location changes
        rendition.on("relocated", (location: any) => {
          if (!isMounted) return;
          const cfi = location.start.cfi;
          const loc = book.locations.locationFromCfi(cfi);
          const currentPage = typeof loc === 'number' ? loc : 0;
          const totalPages = (book.locations as any).total || (book.locations as any)._locations?.length || 1;
          onLocationChange?.(cfi, currentPage + 1, totalPages);
        });

        if (isMounted) setIsLoading(false);
      } catch (err) {
        console.error("[EPUBViewer] Error:", err);
        if (isMounted) {
          setError("Failed to load EPUB. The file may be corrupted.");
          setIsLoading(false);
        }
      }
    };

    initBook();

    return () => {
      isMounted = false;
      if (bookRef.current) {
        bookRef.current.destroy();
        bookRef.current = null;
        renditionRef.current = null;
      }
    };
    // Only re-init on URL change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  // Update theme
  useEffect(() => {
    if (renditionRef.current) {
      renditionRef.current.themes.select(theme);
    }
  }, [theme]);

  // Update font size and other styles
  useEffect(() => {
    if (renditionRef.current) {
      renditionRef.current.themes.fontSize(`${settings.fontSize}px`);
      renditionRef.current.themes.default(getCustomStyles());
    }
  }, [settings.fontSize, getCustomStyles]);

  // Navigation methods exposed via ref
  const nextPage = useCallback(() => {
    renditionRef.current?.next();
  }, []);

  const prevPage = useCallback(() => {
    renditionRef.current?.prev();
  }, []);

  const goToHref = useCallback((href: string) => {
    renditionRef.current?.display(href);
  }, []);

  const goToCfi = useCallback((cfi: string) => {
    renditionRef.current?.display(cfi);
  }, []);

  // Expose methods on the DOM element for parent access
  useEffect(() => {
    if (viewerRef.current) {
      (viewerRef.current as any).__epubMethods = {
        nextPage,
        prevPage,
        goToHref,
        goToCfi,
      };
    }
  }, [nextPage, prevPage, goToHref, goToCfi]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full", className)} style={{ minHeight: "70vh", height: "70vh" }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading EPUB...</p>
          </div>
        </div>
      )}
      <div
        ref={viewerRef}
        className="w-full h-full"
        style={{
          minHeight: "70vh",
          backgroundColor: READER_THEMES[theme as keyof typeof READER_THEMES]?.bg || "#ffffff",
        }}
      />
    </div>
  );
};

export default EPUBViewer;
