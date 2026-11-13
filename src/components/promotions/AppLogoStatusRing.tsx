import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  useActiveAppPromotions,
  useIsAppOwner,
  useViewedPromotionIds,
} from '@/hooks/useAppPromotions';
import AppPromotionViewer from './AppPromotionViewer';
import CreatePromotionDialog from './CreatePromotionDialog';
import PromotionDurationSheet from './PromotionDurationSheet';
import PromoteModal from './PromoteModal';

interface Props {
  className?: string;
}

export const AppLogoStatusRing: React.FC<Props> = ({ className = '' }) => {
  const { data: activePromotions = [] } = useActiveAppPromotions();
  const { data: isOwner } = useIsAppOwner();
  const viewedIds = useViewedPromotionIds();

  const [viewerOpen, setViewerOpen] = useState(false);
  const [durationSheetOpen, setDurationSheetOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [promoteModalOpen, setPromoteModalOpen] = useState(false);
  const [selectedExpiresAt, setSelectedExpiresAt] = useState<string | undefined>(undefined);
  const [durationLabel, setDurationLabel] = useState<string | undefined>(undefined);

  const totalCount = activePromotions.length;
  const unseenPromotions = activePromotions.filter((p) => !viewedIds.has(p.id));
  const unseenCount = unseenPromotions.length;
  const hasActiveStatus = totalCount > 0;
  const hasUnseen = unseenCount > 0;

  // Find index of first unseen promotion (or 0 if all viewed)
  const firstUnseenIndex = activePromotions.findIndex((p) => !viewedIds.has(p.id));
  const initialViewerIndex = firstUnseenIndex >= 0 ? firstUnseenIndex : 0;

  const handleLogoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasActiveStatus) {
      setViewerOpen(true);
    } else if (isOwner) {
      setDurationSheetOpen(true);
    } else {
      setPromoteModalOpen(true);
    }
  };

  const handlePlusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOwner) {
      setDurationSheetOpen(true);
    } else {
      setPromoteModalOpen(true);
    }
  };

  const handleSelectDuration = (expiresAt: string, label: string) => {
    setSelectedExpiresAt(expiresAt);
    setDurationLabel(label);
    setUploadDialogOpen(true);
  };

  // SVG Segment Ring Generator for WhatsApp-style stories ring around app icon
  const R = 19.5;
  const C = 2 * Math.PI * R;
  const gap = totalCount > 1 ? Math.min(7, 18 / totalCount) : 0;
  const segmentLength = totalCount > 0 ? (C - totalCount * gap) / totalCount : C;

  return (
    <>
      <div className={`relative inline-flex items-center justify-center ${className}`}>
        {/* Outer Logo Container */}
        <div
          onClick={handleLogoClick}
          className="relative w-11 h-11 flex items-center justify-center cursor-pointer select-none transition-transform active:scale-95 group"
          title={
            hasActiveStatus
              ? `${unseenCount} unseen / ${totalCount} active story update(s)`
              : isOwner
              ? 'Add Story / Status Update (Owner)'
              : 'Promote on Sha-Verse'
          }
        >
          {/* Active Story Ring (Animated Gradient if unseen, Gray if all seen) */}
          {hasActiveStatus && (
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Spinning background glow/halo when there are unseen stories */}
              {hasUnseen && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 via-purple-600 to-blue-500 animate-[spin_4s_linear_infinite] opacity-80 blur-[1px] p-[2px]" />
              )}

              {/* Segmented Ring SVG */}
              <svg
                className={`absolute inset-0 w-full h-full -rotate-90 pointer-events-none transition-transform duration-500 ${
                  hasUnseen ? 'animate-[spin_6s_linear_infinite]' : ''
                }`}
                viewBox="0 0 44 44"
              >
                <defs>
                  <linearGradient id="unseenStoryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="40%" stopColor="#f43f5e" />
                    <stop offset="75%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>

                {activePromotions.map((promo, idx) => {
                  const isSeen = viewedIds.has(promo.id);
                  const dashArray = `${segmentLength} ${C - segmentLength}`;
                  const offset = -idx * (segmentLength + gap);

                  return (
                    <circle
                      key={promo.id}
                      cx="22"
                      cy="22"
                      r={R}
                      fill="none"
                      stroke={isSeen ? '#9ca3af' : 'url(#unseenStoryGrad)'}
                      strokeOpacity={isSeen ? 0.45 : 1}
                      strokeWidth={isSeen ? 2 : 2.5}
                      strokeDasharray={dashArray}
                      strokeDashoffset={offset}
                      strokeLinecap="round"
                      className="transition-all duration-300"
                    />
                  );
                })}
              </svg>
            </div>
          )}

          {/* Core App Logo */}
          <div className="relative z-10 w-8 h-8 rounded-full overflow-hidden border border-background shadow-xs bg-card flex items-center justify-center">
            <img
              src="/sha-verse-logo.jpeg"
              alt="Sha-Verse Bookshelf"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Plus Badge (+ icon) on logo - shown to everyone! */}
          <button
            type="button"
            onClick={handlePlusClick}
            className="absolute -bottom-0.5 -right-0.5 z-20 w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center border-2 border-background shadow-md hover:scale-110 active:scale-95 transition-transform cursor-pointer"
            title={isOwner ? "Add Status Update (Owner)" : "Promote on Sha-Verse (Pricing & Info)"}
          >
            <Plus className="w-2.5 h-2.5 stroke-[3]" />
          </button>
        </div>
      </div>

      {/* Story / Status Viewer Overlay */}
      <AppPromotionViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        promotions={activePromotions}
        initialIndex={initialViewerIndex}
      />

      {/* Expiry Duration Selector Sheet (Owner status update flow) */}
      <PromotionDurationSheet
        open={durationSheetOpen}
        onOpenChange={setDurationSheetOpen}
        onSelectDuration={handleSelectDuration}
      />

      {/* Upload Media / Status Content Dialog (Owner status update flow) */}
      <CreatePromotionDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        expiresAt={selectedExpiresAt}
        durationLabel={durationLabel}
      />

      {/* Public Pricing & Promotion Modal for Regular Users */}
      <PromoteModal
        open={promoteModalOpen}
        onOpenChange={setPromoteModalOpen}
      />
    </>
  );
};

export default AppLogoStatusRing;
