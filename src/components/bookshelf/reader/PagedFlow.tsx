/**
 * PagedFlow — horizontal, page-by-page reading shell for the Bookshelf reader.
 *
 * The same continuous document that Scroll mode renders is laid out into CSS
 * multi-columns whose width equals the viewport width, so one column === one
 * page. Turning a page is a GPU `translate3d` on the column host: no scrolling,
 * no zoom, no content duplication. A line is never cut in half — the browser's
 * fragmentation moves it wholly to the next column.
 *
 * For scanned / image-only books the column engine is skipped entirely and each
 * existing page image simply becomes one page (same interaction shell).
 */
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { cn } from "@/lib/utils";
import type { ReaderSettings } from "@/lib/reader/settings";

/** Gutter between two pages, in px. */
export const DEFAULT_PAGE_GAP = 32;

export interface PagedFlowHandle {
  /** Move by whole pages. */
  flip: (delta: number) => void;
  /** Land on the page that contains a block. Returns false if not mounted. */
  goToBlock: (blockId: string, animate?: boolean) => boolean;
  /** Recompute geometry after a re-layout. */
  measure: () => void;
  page: () => number;
  totalPages: () => number;
  /** Absolute x (content coordinates) of the current page's left edge. */
  pageOffset: () => number;
  step: () => number;
}

interface Props {
  settings: ReaderSettings;
  /** Scanned / full-page-image book: skip the column engine. */
  imageMode: boolean;
  dir?: string;
  viewportRef: RefObject<HTMLDivElement>;
  contentRef: RefObject<HTMLDivElement>;
  /** Total horizontal gutter between two pages (side margin × 2). */
  gap?: number;
  /** Top/bottom breathing room inside each page. */
  verticalPadding?: number;
  contentStyle?: CSSProperties;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  onTap?: () => void;
  onChange?: (info: { page: number; totalPages: number; percent: number }) => void;
}


const PAGED_CSS = `
.pf-content[data-mode="columns"] { 
  column-fill: auto;
  position: relative;
}
.pf-content[data-mode="columns"][data-spread="true"] {
  column-count: 2;
}
.pf-content[data-mode="columns"] img,
.pf-content[data-mode="columns"] figure,
.pf-content[data-mode="columns"] table,
.pf-content[data-mode="columns"] h1,
.pf-content[data-mode="columns"] h2,
.pf-content[data-mode="columns"] h3,
.pf-content[data-mode="columns"] h4 {
  break-inside: avoid;
  -webkit-column-break-inside: avoid;
  page-break-inside: avoid;
}
.pf-content[data-mode="columns"] p { orphans: 2; widows: 2; }
.pf-content[data-mode="columns"] h1,
.pf-content[data-mode="columns"] h2,
.pf-content[data-mode="columns"] h3,
.pf-content[data-mode="columns"] h4 {
  break-after: avoid;
  -webkit-column-break-after: avoid;
  page-break-after: avoid;
}

/* Realistic middle shadow for two-page spread */
.pf-spread-shadow {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  transform: translateX(-50%);
  background: linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0) 100%);
  pointer-events: none;
  z-index: 10;
}

/* Page curl/edge shadows */
.pf-edge-shadow-left {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 10px;
  background: linear-gradient(to right, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0) 100%);
  pointer-events: none;
  z-index: 10;
}
.pf-edge-shadow-right {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  width: 10px;
  background: linear-gradient(to left, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0) 100%);
  pointer-events: none;
  z-index: 10;
}

.pf-content[data-mode="images"] { display: flex; align-items: center; }
.pf-content[data-mode="images"] > * {
  flex: 0 0 var(--pf-page-w);
  width: var(--pf-page-w);
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
`;

const PagedFlow = forwardRef<PagedFlowHandle, Props>(
  (
    {
      settings,
      imageMode,
      dir,
      viewportRef,
      contentRef,
      gap = DEFAULT_PAGE_GAP,
      verticalPadding = 20,
      contentStyle,
      className,
      style,
      children,
      onTap,
      onChange,
    },
    ref
  ) => {
    const pageRef = useRef(0);
    const totalRef = useRef(1);
    const stepRef = useRef(1);
    const changeRef = useRef(onChange);
    changeRef.current = onChange;
    /** Last emitted geometry — prevents feedback loops with parent state. */
    const emittedRef = useRef<string>("");

    const emit = useCallback((force = false) => {
      const viewport = viewportRef.current;
      const isLarge = (viewport?.clientWidth ?? 0) >= 1024;
      const spread = settings.twoPageSpread && isLarge && !imageMode;
      const multiplier = spread ? 2 : 1;
      
      const total = totalRef.current;
      const page = pageRef.current * multiplier;
      const key = `${page}/${total}`;
      if (!force && key === emittedRef.current) return;
      emittedRef.current = key;
      changeRef.current?.({
        page: page + 1,
        totalPages: total,
        percent: total > 1 ? Math.round((page / (total - 1)) * 100) : 0,
      });
    }, [imageMode, settings.twoPageSpread, viewportRef]);

    const applyTransform = useCallback(
      (animate: boolean) => {
        const content = contentRef.current;
        if (!content) return;
        content.style.transition =
          animate && settings.pageAnimation
            ? "transform 350ms cubic-bezier(0.2, 0, 0.2, 1)"
            : "none";
        content.style.transform = `translate3d(${-pageRef.current * stepRef.current}px, 0, 0)`;
      },
      [contentRef, settings.pageAnimation]
    );

    const measure = useCallback(() => {
      const viewport = viewportRef.current;
      const content = contentRef.current;
      if (!viewport || !content) return;

      const viewportWidth = Math.max(viewport.clientWidth, 1);
      const isLarge = viewportWidth >= 1024;
      const spread = settings.twoPageSpread && isLarge && !imageMode;
      
      // If spread is active, we display 2 columns, so the column width is half (minus gaps)
      const columnWidth = spread 
        ? Math.max((viewportWidth - gap * 2) / 2, 1)
        : Math.max(viewportWidth - gap, 1);
        
      const available = Math.max(viewport.clientHeight - verticalPadding * 2, 1);
      const lineBox = Math.max(settings.fontSize * settings.lineHeight, 1);
      const height = imageMode
        ? available
        : Math.max(Math.floor(available / lineBox) * lineBox, lineBox);
      
      // The "step" is how much we move when flipping. 
      const step = viewportWidth;
      stepRef.current = step;

      content.style.setProperty("--pf-page-w", `${columnWidth}px`);
      content.style.width = spread ? `${viewportWidth - gap}px` : `${columnWidth}px`;
      content.style.height = `${height}px`;
      content.style.marginInline = `${gap / 2}px`;
      content.style.marginBlock = `${verticalPadding}px`;

      if (imageMode) {
        content.style.columnWidth = "";
        content.style.columnGap = "";
        content.style.gap = `${gap}px`;
        content.setAttribute("data-spread", "false");
      } else {
        content.style.gap = "";
        if (spread) {
          content.style.columnWidth = `${columnWidth}px`;
          content.style.columnGap = `${gap}px`;
          content.setAttribute("data-spread", "true");
        } else {
          content.style.columnWidth = `${columnWidth}px`;
          content.style.columnGap = `${gap}px`;
          content.setAttribute("data-spread", "false");
        }
      }

      let extent = content.scrollWidth;
      const last = content.lastElementChild as HTMLElement | null;
      if (last) {
        const rects = last.getClientRects();
        const rect = rects.length ? rects[rects.length - 1] : last.getBoundingClientRect();
        const contentLeft = content.getBoundingClientRect().left + pageRef.current * step;
        extent = Math.max(extent, rect.right - contentLeft);
      }

      const multiplier = spread ? 2 : 1;
      const calculatedTotal = Math.max(1, Math.round((extent + gap) / step) * multiplier);
      totalRef.current = calculatedTotal;
      
      pageRef.current = Math.min(Math.max(pageRef.current, 0), Math.max(0, Math.floor(calculatedTotal / multiplier) - 1));
      applyTransform(false);
      emit();
    }, [
      applyTransform,
      contentRef,
      emit,
      gap,
      imageMode,
      settings.fontSize,
      settings.lineHeight,
      settings.twoPageSpread,
      verticalPadding,
      viewportRef,
    ]);

    const goToPage = useCallback(
      (index: number, animate = true) => {
        const viewport = viewportRef.current;
        const isLarge = (viewport?.clientWidth ?? 0) >= 1024;
        const spread = settings.twoPageSpread && isLarge && !imageMode;
        const multiplier = spread ? 2 : 1;
        
        const maxSteps = Math.max(0, Math.floor(totalRef.current / multiplier) - 1);
        const next = Math.min(Math.max(index, 0), maxSteps);
        if (next === pageRef.current) return;
        pageRef.current = next;
        applyTransform(animate);
        emit();
      },
      [applyTransform, emit, imageMode, settings.twoPageSpread, viewportRef]
    );

    const goToBlock = useCallback(
      (blockId: string, animate = false) => {
        const viewport = viewportRef.current;
        const content = contentRef.current;
        if (!viewport || !content) return false;
        const node = content.querySelector<HTMLElement>(
          `[data-block-id="${CSS.escape(blockId)}"]`
        );
        if (!node) return false;

        const rects = node.getClientRects();
        const rect = rects.length ? rects[0] : node.getBoundingClientRect();
        if (!rect.width && !rect.height) return false;

        const viewportLeft = viewport.getBoundingClientRect().left;
        const absX = rect.left - viewportLeft + pageRef.current * stepRef.current;
        
        const isLarge = viewport.clientWidth >= 1024;
        const spread = settings.twoPageSpread && isLarge && !imageMode;
        const multiplier = spread ? 2 : 1;

        const target = Math.min(
          Math.max(Math.floor((absX + 2) / stepRef.current), 0),
          Math.max(0, Math.floor(totalRef.current / multiplier) - 1)
        );
        if (target !== pageRef.current) {
          pageRef.current = target;
          applyTransform(animate);
          emit();
        }
        return true;
      },
      [applyTransform, contentRef, emit, imageMode, settings.twoPageSpread, viewportRef]
    );

    useImperativeHandle(
      ref,
      () => ({
        flip: (delta: number) => goToPage(pageRef.current + delta, true),
        goToBlock,
        measure,
        page: () => {
          const viewport = viewportRef.current;
          const isLarge = (viewport?.clientWidth ?? 0) >= 1024;
          const spread = settings.twoPageSpread && isLarge && !imageMode;
          return pageRef.current * (spread ? 2 : 1) + 1;
        },
        totalPages: () => totalRef.current,
        pageOffset: () => pageRef.current * stepRef.current,
        step: () => stepRef.current,
      }),
      [goToBlock, goToPage, imageMode, measure, settings.twoPageSpread, viewportRef]
    );

    /* Geometry recomputes ... */
    useLayoutEffect(() => {
      measure();
      const raf = requestAnimationFrame(measure);
      return () => cancelAnimationFrame(raf);
    }, [
      measure,
      settings.fontSize,
      settings.lineHeight,
      settings.font,
      settings.margin,
      settings.paragraphSpacing,
      settings.justify,
      settings.looseSpacing,
      settings.twoPageSpread,
      children,
    ]);

    useEffect(() => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const observer = new ResizeObserver(() => measure());
      observer.observe(viewport);
      return () => observer.disconnect();
    }, [measure, viewportRef]);

    /* Swipe + tap zones ... */
    const touchRef = useRef<{ x: number; y: number; time: number } | null>(null);
    const lastTouchRef = useRef(0);

    const hasSelection = () => (window.getSelection()?.toString().trim().length ?? 0) > 0;

    const handleTap = (clientX: number, host: HTMLElement) => {
      if (hasSelection()) return;
      const rect = host.getBoundingClientRect();
      const ratio = (clientX - rect.left) / Math.max(rect.width, 1);
      if (ratio < 0.25) goToPage(pageRef.current - 1);
      else if (ratio > 0.75) goToPage(pageRef.current + 1);
      else onTap?.();
    };

    const viewport = viewportRef.current;
    const isLarge = (viewport?.clientWidth ?? 0) >= 1024;
    const spread = settings.twoPageSpread && isLarge && !imageMode;

    return (
      <div
        ref={viewportRef}
        className={cn("relative h-full w-full select-text overflow-hidden", className)}
        style={{ touchAction: "pan-y", ...style }}
        onTouchStart={(event) => {
          const touch = event.touches[0];
          touchRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
        }}
        onTouchEnd={(event) => {
          const start = touchRef.current;
          touchRef.current = null;
          lastTouchRef.current = Date.now();
          if (!start) return;
          const touch = event.changedTouches[0];
          const dx = touch.clientX - start.x;
          const dy = touch.clientY - start.y;
          if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
            if (hasSelection()) return;
            goToPage(pageRef.current + (dx < 0 ? 1 : -1));
            return;
          }
          if (Math.abs(dx) < 12 && Math.abs(dy) < 12 && Date.now() - start.time < 400) {
            handleTap(touch.clientX, event.currentTarget as HTMLElement);
          }
        }}
        onClick={(event) => {
          event.stopPropagation();
          const target = event.target as HTMLElement;
          if (target.closest("[data-reader-toolbar]")) return;
          if (target.closest('[data-page-image="zoomed"]')) return;
          if (Date.now() - lastTouchRef.current < 700) return;
          handleTap(event.clientX, event.currentTarget);
        }}
      >
        <style>{PAGED_CSS}</style>
        <div
          ref={contentRef}
          dir={dir}
          className="pf-content"
          data-mode={imageMode ? "images" : "columns"}
          style={{ willChange: "transform", ...contentStyle }}
        >
          {children}
        </div>

        {/* GPB Realistic Shadows */}
        {spread && <div className="pf-spread-shadow" aria-hidden="true" />}
        <div className="pf-edge-shadow-left" aria-hidden="true" />
        <div className="pf-edge-shadow-right" aria-hidden="true" />
      </div>
    );
  }
);

PagedFlow.displayName = "PagedFlow";

export default PagedFlow;
