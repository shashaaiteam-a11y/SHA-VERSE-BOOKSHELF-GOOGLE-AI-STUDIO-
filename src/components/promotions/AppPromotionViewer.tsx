import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Eye,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
} from 'lucide-react';
import {
  AppPromotion,
  useRecordPromotionView,
  usePromotionLiveViews,
  useDeletePromotion,
  useIsAppOwner,
  markPromotionViewedLocal,
} from '@/hooks/useAppPromotions';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotions: AppPromotion[];
  initialIndex?: number;
}

const DEFAULT_IMAGE_DURATION = 5000; // 5 seconds for photos

export const AppPromotionViewer: React.FC<Props> = ({
  open,
  onOpenChange,
  promotions,
  initialIndex = 0,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [videoDuration, setVideoDuration] = useState<number>(DEFAULT_IMAGE_DURATION);
  const [isHolding, setIsHolding] = useState(false);

  // Swipe-down to close gesture state (mobile/tablet)
  const [dragY, setDragY] = useState(0);
  const dragStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isDraggingRef = useRef(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const progressAnimRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const recordView = useRecordPromotionView();
  const deletePromo = useDeletePromotion();
  const { data: isOwner } = useIsAppOwner();

  const currentPromo = promotions[currentIndex];
  const liveViews = usePromotionLiveViews(currentPromo?.id || null, currentPromo?.views_count || 0);

  // Record view on item change
  useEffect(() => {
    if (open && currentPromo?.id) {
      recordView.mutate(currentPromo.id);
      markPromotionViewedLocal(currentPromo.id);
    }
  }, [open, currentIndex, currentPromo?.id, recordView]);

  // Reset index & progress when viewer opens
  useEffect(() => {
    if (open) {
      setCurrentIndex(Math.min(Math.max(0, initialIndex), Math.max(0, promotions.length - 1)));
      setProgress(0);
      setIsPaused(false);
      setDragY(0);
    }
  }, [open, initialIndex, promotions.length]);

  // Lock body scroll when open on all devices
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
    };
  }, [open]);

  // Track browser native fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleToggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const handlePrev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setProgress(0);
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  const handleNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setProgress(0);
    if (currentIndex < promotions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      onOpenChange(false);
    }
  }, [currentIndex, promotions.length, onOpenChange]);

  // Smooth progress ticker
  const activeDuration = currentPromo?.media_type === 'video' ? videoDuration : DEFAULT_IMAGE_DURATION;

  useEffect(() => {
    if (!open || isPaused || isHolding || !currentPromo) {
      if (progressAnimRef.current) {
        cancelAnimationFrame(progressAnimRef.current);
        progressAnimRef.current = null;
      }
      return;
    }

    lastTimeRef.current = performance.now();

    const tick = (now: number) => {
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      // In video mode, sync with video currentTime if available
      if (currentPromo.media_type === 'video' && videoRef.current && videoRef.current.duration) {
        const vPct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
        setProgress(Math.min(100, vPct));
        if (vPct >= 99.5) {
          handleNext();
          return;
        }
      } else {
        setProgress((prev) => {
          const next = prev + (delta / activeDuration) * 100;
          if (next >= 100) {
            handleNext();
            return 0;
          }
          return next;
        });
      }

      progressAnimRef.current = requestAnimationFrame(tick);
    };

    progressAnimRef.current = requestAnimationFrame(tick);

    return () => {
      if (progressAnimRef.current) {
        cancelAnimationFrame(progressAnimRef.current);
        progressAnimRef.current = null;
      }
    };
  }, [open, isPaused, isHolding, currentPromo, activeDuration, handleNext]);

  // Video duration discovery and play/pause management
  const handleVideoLoadedMetadata = () => {
    if (videoRef.current && Number.isFinite(videoRef.current.duration) && videoRef.current.duration > 0) {
      setVideoDuration(videoRef.current.duration * 1000);
    }
  };

  useEffect(() => {
    if (!videoRef.current) return;
    if (isPaused || isHolding) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  }, [isPaused, isHolding, currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handlePrev, handleNext, onOpenChange]);

  // Swipe-down to close gestures (touch)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    dragStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
    isDraggingRef.current = false;
    setIsHolding(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragStartRef.current || e.touches.length !== 1) return;
    const t = e.touches[0];
    const dy = t.clientY - dragStartRef.current.y;
    const dx = Math.abs(t.clientX - dragStartRef.current.x);

    if (!isDraggingRef.current) {
      if (dy > 12 && dy > dx) {
        isDraggingRef.current = true;
      } else {
        return;
      }
    }
    if (dy > 0) {
      setDragY(dy);
    }
  };

  const handleTouchEnd = () => {
    setIsHolding(false);
    if (!dragStartRef.current) return;

    const elapsed = Date.now() - dragStartRef.current.time;
    const velocity = dragY / Math.max(elapsed, 1);
    dragStartRef.current = null;
    isDraggingRef.current = false;

    if (dragY > 90 || velocity > 0.45) {
      setDragY(window.innerHeight);
      setTimeout(() => onOpenChange(false), 160);
    } else {
      setDragY(0);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentPromo) return;
    try {
      await deletePromo.mutateAsync(currentPromo.id);
      toast.success('Status update deleted');
      if (promotions.length <= 1) {
        onOpenChange(false);
      } else if (currentIndex >= promotions.length - 1) {
        setCurrentIndex((i) => Math.max(0, i - 1));
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete status');
    }
  };

  if (!open || !currentPromo) return null;

  const content = (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] w-screen h-screen bg-black text-white flex flex-col justify-between overflow-hidden select-none"
      style={{
        transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
        transition: isDraggingRef.current ? 'none' : 'transform 0.2s ease-out',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Ambient Blurred Background (fills ultra-wide desktop & tablet viewports gorgeously) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35 filter blur-3xl scale-125 z-0">
        {currentPromo.media_type === 'video' ? (
          <video
            src={currentPromo.media_url}
            muted
            loop
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={currentPromo.media_url}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Top Header Section: Safe Area, Progress Bars & Navigation Bar */}
      <header className="relative z-30 w-full pt-3 pb-4 px-3 sm:px-6 md:px-8 bg-gradient-to-b from-black/90 via-black/60 to-transparent flex flex-col gap-2.5">
        {/* Progress Bars */}
        <div className="w-full max-w-5xl mx-auto flex items-center gap-1.5 px-0.5">
          {promotions.map((p, idx) => {
            const isFinished = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const currentPct = isFinished ? 100 : isCurrent ? progress : 0;

            return (
              <div
                key={p.id}
                className="h-1 sm:h-1.5 flex-1 bg-white/25 rounded-full overflow-hidden backdrop-blur-xs cursor-pointer hover:bg-white/40 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                  setProgress(0);
                }}
              >
                <div
                  className="h-full bg-white rounded-full transition-[width] ease-linear"
                  style={{
                    width: `${currentPct}%`,
                    transitionDuration: isCurrent ? '60ms' : '0ms',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Top Controls Bar */}
        <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-3">
          {/* User/Channel Brand Pill */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-primary/80 shrink-0 bg-zinc-900 shadow-md">
              <img
                src="/sha-verse-logo.jpeg"
                alt="Sha-Verse"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col min-w-0 leading-tight">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-xs sm:text-sm text-white truncate drop-shadow-sm">
                  Sha-Verse Status
                </span>
                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-primary/90 text-white font-medium shrink-0">
                  {currentIndex + 1} / {promotions.length}
                </span>
              </div>
              <span className="text-[10px] sm:text-xs text-white/75 truncate">
                {formatDistanceToNow(new Date(currentPromo.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Action Buttons Group */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Live Views Counter */}
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white/90 text-xs sm:text-sm font-medium transition-colors"
              title="Total Live Views"
            >
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              <span>{liveViews}</span>
            </div>

            {/* Video Mute / Unmute Button */}
            {currentPromo.media_type === 'video' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted((m) => !m);
                }}
                className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 text-white backdrop-blur-md transition-all cursor-pointer"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-400" />
                ) : (
                  <Volume2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                )}
              </button>
            )}

            {/* Play / Pause Toggle Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsPaused((p) => !p);
              }}
              className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 text-white backdrop-blur-md transition-all cursor-pointer"
              title={isPaused ? 'Resume Playback' : 'Pause Playback'}
            >
              {isPaused ? (
                <Play className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-current" />
              ) : (
                <Pause className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              )}
            </button>

            {/* Browser Native Fullscreen Toggle Button */}
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="hidden sm:flex p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 text-white backdrop-blur-md transition-all cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              ) : (
                <Maximize className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              )}
            </button>

            {/* Owner Delete Button */}
            {isOwner && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-2 sm:p-2.5 rounded-full bg-rose-600/80 hover:bg-rose-600 active:scale-95 text-white backdrop-blur-md transition-all cursor-pointer shadow-sm"
                title="Delete this status update"
              >
                <Trash2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenChange(false);
              }}
              className="p-2 sm:p-2.5 rounded-full bg-white/15 hover:bg-white/30 active:scale-95 text-white backdrop-blur-md transition-all cursor-pointer shadow-sm ml-1"
              title="Close Full Screen Status (Esc)"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Full-Screen Media Stage */}
      <main
        className="relative z-10 flex-1 w-full h-full flex items-center justify-center overflow-hidden cursor-pointer"
        onMouseDown={() => setIsHolding(true)}
        onMouseUp={() => setIsHolding(false)}
      >
        {/* Desktop & Tablet Side Navigation Arrow Buttons */}
        {currentIndex > 0 && (
          <button
            type="button"
            onClick={handlePrev}
            className="hidden md:flex absolute left-4 lg:left-8 z-30 p-3 rounded-full bg-black/60 hover:bg-black/85 text-white border border-white/20 hover:scale-110 active:scale-95 transition-all shadow-xl backdrop-blur-sm cursor-pointer"
            title="Previous Status (Left Arrow)"
          >
            <ChevronLeft className="w-7 h-7 stroke-[2.5]" />
          </button>
        )}

        {currentIndex < promotions.length - 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="hidden md:flex absolute right-4 lg:right-8 z-30 p-3 rounded-full bg-black/60 hover:bg-black/85 text-white border border-white/20 hover:scale-110 active:scale-95 transition-all shadow-xl backdrop-blur-sm cursor-pointer"
            title="Next Status (Right Arrow)"
          >
            <ChevronRight className="w-7 h-7 stroke-[2.5]" />
          </button>
        )}

        {/* Media Frame (Scaled cleanly to fill screen without distortion) */}
        <div className="relative w-full h-full max-w-6xl max-h-full flex items-center justify-center p-0 md:p-2">
          {currentPromo.media_type === 'video' ? (
            <video
              ref={videoRef}
              src={currentPromo.media_url}
              autoPlay
              playsInline
              muted={isMuted}
              onLoadedMetadata={handleVideoLoadedMetadata}
              className="w-full h-full object-contain pointer-events-none drop-shadow-2xl"
            />
          ) : (
            <img
              src={currentPromo.media_url}
              alt={currentPromo.caption || 'Status Update'}
              className="w-full h-full object-contain pointer-events-none drop-shadow-2xl"
            />
          )}
        </div>

        {/* Transparent Left/Right Tap/Click Areas (Mobile & touch/mouse click navigation) */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1/3 z-20"
          onClick={handlePrev}
          title="Tap for previous"
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-1/3 z-20"
          onClick={handleNext}
          title="Tap for next"
        />

        {/* Center Pause Indicator overlay when holding or paused */}
        {(isPaused || isHolding) && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <div className="p-4 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white animate-fade-in shadow-2xl">
              <Pause className="w-8 h-8" />
            </div>
          </div>
        )}
      </main>

      {/* Bottom Footer Section: Caption & Action Button */}
      <footer className="relative z-30 w-full pb-6 sm:pb-8 pt-4 px-4 sm:px-6 md:px-8 bg-gradient-to-t from-black/95 via-black/75 to-transparent flex flex-col items-center justify-center gap-3">
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-2.5 text-center">
          {/* Caption text */}
          {currentPromo.caption && (
            <p className="text-sm sm:text-base md:text-lg font-medium text-white/95 leading-relaxed drop-shadow-md break-words max-w-xl">
              {currentPromo.caption}
            </p>
          )}

          {/* Action Link Button */}
          {currentPromo.link_url && (
            <a
              href={currentPromo.link_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-white text-xs sm:text-sm font-semibold shadow-xl active:scale-95 transition-transform cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 stroke-[2.5]" />
              <span>Visit Link</span>
            </a>
          )}
        </div>
      </footer>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : null;
};

export default AppPromotionViewer;
