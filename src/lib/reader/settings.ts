/**
 * Reader typography + theme settings (Reader Mode only).
 * Persisted locally so the reading experience is identical across sessions.
 */
import { useCallback, useEffect, useState } from "react";

export type ReaderTheme = "white" | "warm" | "cream" | "sepia" | "dark" | "night" | "black";
export type ReaderFont = "serif" | "sans" | "mono" | "dyslexic" | "literata" | "merriweather";
/** "paged" = horizontal, one screen per page. "scroll" = continuous vertical. */
export type ReadingMode = "paged" | "scroll";

export interface ReaderSettings {
  theme: ReaderTheme;
  font: ReaderFont;
  fontSize: number;
  lineHeight: number;
  /** 0 = narrow, 3 = wide side margins. */
  margin: number;
  paragraphSpacing: number;
  justify: boolean;
  /** Extra letter/word spacing for accessibility. */
  looseSpacing: boolean;
  /** Horizontal paged reading vs continuous scrolling. */
  readingMode: ReadingMode;
  /** Animate the horizontal page turn (paged mode only). */
  pageAnimation: boolean;
  /** Display two pages side by side on large screens. */
  twoPageSpread: boolean;
}

export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  theme: "white",
  font: "literata",
  fontSize: 19,
  lineHeight: 1.65,
  margin: 1,
  paragraphSpacing: 0.9,
  justify: true,
  looseSpacing: false,
  readingMode: "paged",
  pageAnimation: true,
  twoPageSpread: true,
};


const STORAGE_KEY = "shaverse:reader-settings:v2";

export const READER_THEMES: Record<
  ReaderTheme,
  { bg: string; text: string; muted: string; accent: string; label: string }
> = {
  white: { bg: "#ffffff", text: "#121212", muted: "#757575", accent: "#1a73e8", label: "White" },
  warm: { bg: "#fdf6e3", text: "#433422", muted: "#a89984", accent: "#b57614", label: "Warm" },
  cream: { bg: "#fff9f0", text: "#1a1a1a", muted: "#968c83", accent: "#c18c5d", label: "Cream" },
  sepia: { bg: "#f4ecd8", text: "#3b2f1e", muted: "#7a6a51", accent: "#8a5a2b", label: "Sepia" },
  dark: { bg: "#202124", text: "#e8eaed", muted: "#9aa0a6", accent: "#8ab4f8", label: "Dark" },
  night: { bg: "#121212", text: "#b0b0b0", muted: "#666666", accent: "#bb86fc", label: "Night" },
  black: { bg: "#000000", text: "#ffffff", muted: "#888888", accent: "#ffffff", label: "Black" },
};

export const READER_FONT_STACKS: Record<ReaderFont, string> = {
  literata: '"Literata", Georgia, "Iowan Old Style", serif',
  merriweather: '"Merriweather", "Times New Roman", serif',
  serif: 'Georgia, "Times New Roman", serif',
  sans: '"Roboto", "Helvetica Neue", Arial, sans-serif',
  mono: '"Roboto Mono", "Courier New", monospace',
  dyslexic: '"OpenDyslexic", "Comic Sans MS", sans-serif',
};

function readStored(): ReaderSettings {
  if (typeof window === "undefined") return DEFAULT_READER_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_READER_SETTINGS;
    return { ...DEFAULT_READER_SETTINGS, ...(JSON.parse(raw) as Partial<ReaderSettings>) };
  } catch {
    return DEFAULT_READER_SETTINGS;
  }
}

export function useReaderSettings() {
  const [settings, setSettings] = useState<ReaderSettings>(readStored);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }, [settings]);

  const update = useCallback(<K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => setSettings(DEFAULT_READER_SETTINGS), []);

  return { settings, update, reset, setSettings };
}
