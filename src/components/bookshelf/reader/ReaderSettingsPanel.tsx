import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  READER_FONT_STACKS,
  READER_THEMES,
  type ReaderFont,
  type ReaderSettings,
  type ReaderTheme,
  type ReadingMode,
} from "@/lib/reader/settings";
import { filterLanguages } from "@/lib/reader/languages";
import type { AudioVoice } from "@/hooks/useAudioReader";

interface Props {
  settings: ReaderSettings;
  onChange: <K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) => void;
  onReset: () => void;
  fileType?: "pdf" | "epub" | "unknown";
  viewMode?: "flow" | "original";
  onViewModeChange?: (mode: "flow" | "original") => void;

  // Translation
  isTranslating?: boolean;
  translationProgress?: number;
  targetLanguage?: string | null;
  onTranslate?: (lang: string) => void;
  onResetTranslation?: () => void;

  // Audio Reader
  voices?: AudioVoice[];
  currentVoice?: AudioVoice | null;
  onVoiceSelect?: (voice: AudioVoice) => void;
  isPlaying?: boolean;
  isPaused?: boolean;
  isLoadingAudio?: boolean;
  loadingExampleId?: string | null;
  playingExampleId?: string | null;
  onStopAudio?: () => void;
  onTogglePauseAudio?: () => void;
  onPlayExample?: (voice: AudioVoice) => void;
}

const THEME_ORDER: ReaderTheme[] = ["white", "warm", "cream", "sepia", "dark", "night", "black"];
const FONT_LABELS: Record<ReaderFont, string> = {
  literata: "Literata",
  merriweather: "Merri",
  serif: "Serif",
  sans: "Sans",
  mono: "Mono",
  dyslexic: "Easy",
};

const READING_MODES: { value: ReadingMode; label: string }[] = [
  { value: "paged", label: "Paged" },
  { value: "scroll", label: "Scrolling" },
];

const ReaderSettingsPanel = ({
  settings,
  onChange,
  onReset,
  fileType,
  viewMode,
  onViewModeChange,
  isTranslating = false,
  translationProgress = 0,
  targetLanguage,
  onTranslate,
  onResetTranslation,
  voices = [],
  currentVoice,
  onVoiceSelect,
  isPlaying = false,
  isPaused = false,
  isLoadingAudio = false,
  loadingExampleId = null,
  playingExampleId = null,
  onStopAudio,
  onTogglePauseAudio,
  onPlayExample,
}: Props) => {
  const [activePanel, setActivePanel] = useState<"main" | "translation" | "audio">("main");
  const [langSearch, setLangSearch] = useState("");

  const filteredLanguages = useMemo(() => filterLanguages(langSearch), [langSearch]);

  if (activePanel === "translation") {
    return (
      <div className="space-y-4 py-4 w-full max-w-full overflow-x-hidden">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActivePanel("main")}
            className="px-2 h-8 text-xs font-semibold shrink-0"
          >
            Back
          </Button>
          <h3 className="font-bold text-sm truncate">Translate Book (A–Z)</h3>
          <span className="text-[11px] text-muted-foreground shrink-0">
            {filteredLanguages.length} langs
          </span>
        </div>

        <Input
          placeholder="Search any language A–Z..."
          className="h-10 rounded-xl"
          value={langSearch}
          onChange={(e) => setLangSearch(e.target.value)}
          aria-label="Search language"
          autoFocus
        />

        {targetLanguage && (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">
                {isTranslating
                  ? `Translating to ${targetLanguage} (${translationProgress}%)`
                  : `Active: ${targetLanguage}`}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs shrink-0"
              onClick={() => {
                onResetTranslation?.();
                setActivePanel("main");
              }}
            >
              Original
            </Button>
          </div>
        )}

        <div className="space-y-1 max-h-[62vh] overflow-y-auto pr-1">
          {filteredLanguages.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">
              No matching language found for "{langSearch}".
            </p>
          ) : (
            filteredLanguages.map((lang) => {
              const isSelected = targetLanguage === lang.name;
              return (
                <button
                  key={lang.code}
                  type="button"
                  className={cn(
                    "w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition-colors cursor-pointer",
                    isSelected
                      ? "bg-primary/10 text-primary font-semibold"
                      : "hover:bg-muted/70"
                  )}
                  onClick={() => {
                    onTranslate?.(lang.name);
                    setActivePanel("main");
                  }}
                >
                  <div className="flex flex-col items-start leading-tight min-w-0">
                    <span className="text-sm font-semibold truncate">{lang.name}</span>
                    <span className="text-[11px] opacity-65 truncate">{lang.nativeName}</span>
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wide shrink-0 ml-2">
                    {isSelected
                      ? isTranslating
                        ? `${translationProgress}%`
                        : "Active"
                      : lang.code}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  }

  if (activePanel === "audio") {
    return (
      <div className="space-y-4 py-4 w-full max-w-full overflow-x-hidden">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActivePanel("main")}
            className="px-2 h-8 text-xs font-semibold shrink-0"
          >
            Back
          </Button>
          <h3 className="font-bold text-sm truncate">Audio Voices ({voices.length})</h3>
          {(isPlaying || isPaused || isLoadingAudio) ? (
            <Button
              variant="destructive"
              size="sm"
              className="h-7 px-2.5 text-xs shrink-0"
              onClick={() => onStopAudio?.()}
            >
              Stop
            </Button>
          ) : (
            <span className="w-10 shrink-0" />
          )}
        </div>

        <div className="rounded-xl border bg-muted/40 px-3 py-2 flex items-center justify-between gap-2 min-w-0">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">
              Language: {targetLanguage || "Original Book Language"}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              Tap a voice to auto-start reading immediately
            </p>
          </div>
          {(isPlaying || isPaused) && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs shrink-0"
              onClick={() => onTogglePauseAudio?.()}
            >
              {isPaused ? "Resume" : "Pause"}
            </Button>
          )}
        </div>

        <div className="space-y-2 max-h-[64vh] overflow-y-auto overflow-x-hidden pr-0.5">
          {voices.map((voice) => {
            const isSelected = currentVoice?.id === voice.id;
            const isExampleLoading = loadingExampleId === voice.id;
            const isExamplePlaying = playingExampleId === voice.id;

            return (
              <div
                key={voice.id}
                role="button"
                tabIndex={0}
                onClick={() => onVoiceSelect?.(voice)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onVoiceSelect?.(voice);
                  }
                }}
                className={cn(
                  "p-3 rounded-xl border transition-colors cursor-pointer space-y-1.5 w-full overflow-hidden",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border/70 bg-card hover:bg-muted/50"
                )}
              >
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm font-bold truncate">{voice.name}</span>
                      {isSelected && (isPlaying || isLoadingAudio) && (
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary text-primary-foreground shrink-0">
                          {isLoadingAudio ? "Loading" : "Playing"}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground font-medium truncate">
                      {voice.gender} · {voice.tone}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant={isExamplePlaying ? "default" : "outline"}
                    size="sm"
                    className="h-7 px-2.5 text-[11px] font-semibold shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayExample?.(voice);
                    }}
                  >
                    {isExampleLoading
                      ? "Loading..."
                      : isExamplePlaying
                      ? "Stop"
                      : "Example"}
                  </Button>
                </div>

                <p className="text-[11px] text-muted-foreground italic line-clamp-2 break-words">
                  "{voice.exampleText}"
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <div>
        <p className="mb-3 text-sm font-medium">Reading mode</p>
        <div className="grid grid-cols-2 gap-2">
          {READING_MODES.map((mode) => (
            <Button
              key={mode.value}
              variant={settings.readingMode === mode.value ? "default" : "outline"}
              onClick={() => onChange("readingMode", mode.value)}
              aria-pressed={settings.readingMode === mode.value}
              className="rounded-xl h-10"
            >
              {mode.label}
            </Button>
          ))}
        </div>
      </div>

      {settings.readingMode === "paged" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="reader-page-animation" className="text-sm font-medium">
              Page turn animation
            </label>
            <Switch
              id="reader-page-animation"
              checked={settings.pageAnimation}
              onCheckedChange={(checked) => onChange("pageAnimation", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="reader-two-page" className="text-sm font-medium">
              Two-page spread (Desktop)
            </label>
            <Switch
              id="reader-two-page"
              checked={settings.twoPageSpread}
              onCheckedChange={(checked) => onChange("twoPageSpread", checked)}
            />
          </div>
        </div>
      )}

      <div>
        <p className="mb-3 text-sm font-medium">Theme</p>
        <div className="grid grid-cols-4 gap-2">
          {THEME_ORDER.map((theme) => {
            const preset = READER_THEMES[theme];
            const active = settings.theme === theme;
            return (
              <button
                key={theme}
                type="button"
                onClick={() => onChange("theme", theme)}
                className={cn(
                  "flex h-14 flex-col items-center justify-center rounded-xl border-2 text-xs font-medium transition-colors cursor-pointer",
                  active ? "border-primary" : "border-border"
                )}
                style={{ backgroundColor: preset.bg, color: preset.text }}
                aria-pressed={active}
              >
                <span style={{ fontSize: 15, fontWeight: 700 }}>Aa</span>
                <span className="mt-0.5 text-[10px] opacity-80">{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium">Typeface</p>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(FONT_LABELS) as ReaderFont[]).map((font) => (
            <Button
              key={font}
              variant={settings.font === font ? "default" : "outline"}
              onClick={() => onChange("font", font)}
              style={{ fontFamily: READER_FONT_STACKS[font] }}
              className="justify-start px-3 h-10 rounded-xl"
            >
              {FONT_LABELS[font]}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium">
          Text size · {settings.fontSize}px
        </p>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            aria-label="Decrease text size"
            onClick={() => onChange("fontSize", Math.max(settings.fontSize - 1, 14))}
            className="rounded-full w-9 h-9 font-bold"
          >
            A-
          </Button>
          <Slider
            value={[settings.fontSize]}
            onValueChange={([value]) => onChange("fontSize", value)}
            min={14}
            max={32}
            step={1}
            className="flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            aria-label="Increase text size"
            onClick={() => onChange("fontSize", Math.min(settings.fontSize + 1, 32))}
            className="rounded-full w-9 h-9 font-bold"
          >
            A+
          </Button>
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium">Line spacing · {settings.lineHeight.toFixed(2)}</p>
        <Slider
          value={[settings.lineHeight * 100]}
          onValueChange={([value]) => onChange("lineHeight", value / 100)}
          min={130}
          max={215}
          step={5}
        />
      </div>

      <Separator />

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          More Tools
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant={targetLanguage ? "secondary" : "outline"}
            className="h-16 flex-col gap-1 rounded-xl border"
            onClick={() => setActivePanel("translation")}
          >
            <span className="text-xs font-bold">Translation</span>
            <span className="text-[10px] text-muted-foreground truncate max-w-full px-2">
              {isTranslating
                ? `Translating ${translationProgress}%`
                : targetLanguage || "A–Z Languages"}
            </span>
          </Button>

          <Button
            type="button"
            variant={isPlaying ? "secondary" : "outline"}
            className="h-16 flex-col gap-1 rounded-xl border"
            onClick={() => setActivePanel("audio")}
          >
            <span className="text-xs font-bold">Audio Reader</span>
            <span className="text-[10px] text-muted-foreground truncate max-w-full px-2">
              {isPlaying
                ? `Playing · ${currentVoice?.name.split("·")[0].trim()}`
                : `${voices.length} Voices`}
            </span>
          </Button>
        </div>
      </div>

      <Button
        variant="ghost"
        className="w-full text-muted-foreground hover:text-foreground h-10"
        onClick={onReset}
      >
        Reset to defaults
      </Button>

      {onViewModeChange && fileType !== "epub" && (
        <>
          <Separator />
          <div className="pb-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Display Mode
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={viewMode === "flow" ? "default" : "outline"}
                onClick={() => onViewModeChange("flow")}
                className="h-11 rounded-xl font-bold"
              >
                Flow
              </Button>
              <Button
                type="button"
                variant={viewMode === "original" ? "default" : "outline"}
                onClick={() => onViewModeChange("original")}
                className="h-11 rounded-xl font-bold"
              >
                Original
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReaderSettingsPanel;
