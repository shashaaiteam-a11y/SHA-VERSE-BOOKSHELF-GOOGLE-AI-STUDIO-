import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectDuration: (expiresAt: string, label: string) => void;
}

const HOURS_OPTIONS = Array.from({ length: 24 }, (_, i) => i + 1);

// Get days in current month (28, 29, 30, or 31)
const getDaysInCurrentMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
};

export const PromotionDurationSheet: React.FC<Props> = ({
  open,
  onOpenChange,
  onSelectDuration,
}) => {
  const [tab, setTab] = useState<'hours' | 'days'>('hours');
  const [selectedHour, setSelectedHour] = useState<number>(24);
  const [selectedDay, setSelectedDay] = useState<number>(1);

  const daysInMonth = getDaysInCurrentMonth();
  const daysOptions = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleContinue = () => {
    let ms = 0;
    let label = '';

    if (tab === 'hours') {
      ms = selectedHour * 60 * 60 * 1000;
      label = `${selectedHour} ${selectedHour === 1 ? 'hour' : 'hours'}`;
    } else {
      ms = selectedDay * 24 * 60 * 60 * 1000;
      label = `${selectedDay} ${selectedDay === 1 ? 'day' : 'days'}`;
    }

    const expiresAt = new Date(Date.now() + ms).toISOString();
    onSelectDuration(expiresAt, label);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="fixed inset-0 z-[100] w-full h-full max-w-none max-h-none p-0 bg-background text-foreground border-none rounded-none flex flex-col overflow-hidden !translate-x-0 !translate-y-0 !left-0 !top-0 opacity-100 shadow-none"
      >
        {/* Full Screen Header Bar */}
        <div className="shrink-0 px-4 sm:px-6 py-4 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 bg-background/95 backdrop-blur z-30">
          <DialogTitle className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100">
            Story Kitni Der Tak Chalegi?
          </DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full scrollbar-hide">
          {/* Tabs Selector Row (Hours vs Days) */}
          <div className="grid grid-cols-2 gap-2 bg-slate-200/70 dark:bg-slate-900/90 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => setTab('hours')}
              className={`py-3.5 rounded-xl font-bold text-sm sm:text-base transition-all cursor-pointer ${
                tab === 'hours'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-semibold'
              }`}
            >
              Hours
            </button>
            <button
              type="button"
              onClick={() => setTab('days')}
              className={`py-3.5 rounded-xl font-bold text-sm sm:text-base transition-all cursor-pointer ${
                tab === 'days'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-semibold'
              }`}
            >
              Days ({daysInMonth} Days)
            </button>
          </div>

          {/* Grid of Duration Cards */}
          <div className="py-2">
            {tab === 'hours' ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 sm:gap-3">
                {HOURS_OPTIONS.map((hr) => {
                  const isSelected = selectedHour === hr;
                  return (
                    <button
                      key={hr}
                      type="button"
                      onClick={() => setSelectedHour(hr)}
                      className={`py-4 rounded-2xl font-bold text-base sm:text-lg transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/40 scale-105'
                          : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      {hr}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 sm:gap-3">
                {daysOptions.map((day) => {
                  const isSelected = selectedDay === day;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedDay(day)}
                      className={`py-4 rounded-2xl font-bold text-base sm:text-lg transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/40 scale-105'
                          : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons Row (Sticky Footer) */}
        <div className="shrink-0 p-4 sm:p-6 border-t border-slate-200/80 dark:border-slate-800/80 bg-background/95 backdrop-blur z-30">
          <div className="max-w-4xl mx-auto grid grid-cols-2 gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="py-3.5 sm:py-4 rounded-2xl bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm sm:text-base transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleContinue}
              className="py-3.5 sm:py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base shadow-lg transition-colors cursor-pointer"
            >
              {tab === 'hours' ? `Continue · ${selectedHour} h` : `Continue · ${selectedDay} d`}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PromotionDurationSheet;
