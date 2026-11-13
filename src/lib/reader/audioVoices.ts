import { findLanguage } from "./languages";
import type { Block, ReflowBook } from "./types";

export type GeminiVoiceName = "Kore" | "Puck" | "Charon" | "Fenrir" | "Zephyr";

export interface AudioVoice {
  id: string;
  name: string;
  gender: "Female" | "Male" | "Neutral";
  tone: string;
  style: string;
  geminiVoice: GeminiVoiceName;
  exampleText: string;
  pitch: number;
  rate: number;
  lang: string;
  native?: SpeechSynthesisVoice;
}

/**
 * 18 distinct curated narrator & storyteller voices with realistic example prompts
 * backed by Gemini TTS (with Web Speech API fallback).
 */
export const CURATED_AUDIO_VOICES: AudioVoice[] = [
  {
    id: "voice-kore-storyteller",
    name: "Aanya · Warm Storyteller",
    gender: "Female",
    tone: "Warm & Expressive",
    style: "Warm, expressive literary audiobook narrator with gentle pacing",
    geminiVoice: "Kore",
    exampleText: "Every chapter opens a quiet doorway into another world.",
    pitch: 1.0,
    rate: 0.98,
    lang: "Multi-language",
  },
  {
    id: "voice-puck-energetic",
    name: "Aarav · Crisp Narrator",
    gender: "Male",
    tone: "Bright & Engaging",
    style: "Crisp, lively, engaging storyteller with clear diction",
    geminiVoice: "Puck",
    exampleText: "Turn the page and follow the journey from the very first word.",
    pitch: 1.04,
    rate: 1.02,
    lang: "Multi-language",
  },
  {
    id: "voice-charon-deep",
    name: "Kabir · Deep Classic",
    gender: "Male",
    tone: "Deep & Grounded",
    style: "Deep, resonant, authoritative classic literature voice",
    geminiVoice: "Charon",
    exampleText: "In stillness and shadow, the oldest truths wait to be heard.",
    pitch: 0.88,
    rate: 0.94,
    lang: "Multi-language",
  },
  {
    id: "voice-zephyr-calm",
    name: "Meera · Calm Companion",
    gender: "Female",
    tone: "Soft & Soothing",
    style: "Soft, soothing, calm voice ideal for long evening reading",
    geminiVoice: "Zephyr",
    exampleText: "Breathe easy and listen along at your own unhurried pace.",
    pitch: 1.02,
    rate: 0.92,
    lang: "Multi-language",
  },
  {
    id: "voice-fenrir-dramatic",
    name: "Vikram · Epic Drama",
    gender: "Male",
    tone: "Bold & Cinematic",
    style: "Dramatic, cinematic voice suited for thrillers, epics, and history",
    geminiVoice: "Fenrir",
    exampleText: "The storm broke across the ridge as the final horn sounded.",
    pitch: 0.92,
    rate: 0.98,
    lang: "Multi-language",
  },
  {
    id: "voice-kore-scholar",
    name: "Dr. Nisha · Scholarly",
    gender: "Female",
    tone: "Clear & Academic",
    style: "Articulate, measured, clear academic and non-fiction lecturer",
    geminiVoice: "Kore",
    exampleText: "Let us examine the core principles shaping this discovery.",
    pitch: 0.98,
    rate: 1.0,
    lang: "Multi-language",
  },
  {
    id: "voice-puck-youthful",
    name: "Rohan · Modern Conversational",
    gender: "Male",
    tone: "Natural & Friendly",
    style: "Natural, friendly, modern conversational reader",
    geminiVoice: "Puck",
    exampleText: "Here is a fresh perspective that makes complex ideas feel effortless.",
    pitch: 1.0,
    rate: 1.04,
    lang: "Multi-language",
  },
  {
    id: "voice-zephyr-poetic",
    name: "Ira · Poetic Lyric",
    gender: "Female",
    tone: "Lyrical & Gentle",
    style: "Poetic, lyrical, unhurried voice with gentle emotional cadence",
    geminiVoice: "Zephyr",
    exampleText: "Morning light spilled softly over the pages like liquid gold.",
    pitch: 1.05,
    rate: 0.9,
    lang: "Multi-language",
  },
  {
    id: "voice-charon-documentary",
    name: "Dev · Documentary",
    gender: "Male",
    tone: "Steady & Informative",
    style: "Steady, poised, documentary-style narrator with crisp phrasing",
    geminiVoice: "Charon",
    exampleText: "Across centuries, human curiosity has rewritten the map of knowledge.",
    pitch: 0.94,
    rate: 0.98,
    lang: "Multi-language",
  },
  {
    id: "voice-kore-studio",
    name: "Zoya · Studio Crisp",
    gender: "Female",
    tone: "Studio & Balanced",
    style: "Balanced, broadcast-quality studio narrator with clean articulation",
    geminiVoice: "Kore",
    exampleText: "Every sentence is delivered with studio clarity and natural rhythm.",
    pitch: 1.0,
    rate: 1.0,
    lang: "Multi-language",
  },
  {
    id: "voice-fenrir-mystery",
    name: "Arjun · Mystery Noir",
    gender: "Male",
    tone: "Low & Suspenseful",
    style: "Intimate, low, suspenseful voice for mystery and detective fiction",
    geminiVoice: "Fenrir",
    exampleText: "The envelope on the desk had been opened before midnight.",
    pitch: 0.86,
    rate: 0.93,
    lang: "Multi-language",
  },
  {
    id: "voice-zephyr-bedtime",
    name: "Tara · Bedtime Whisper",
    gender: "Female",
    tone: "Relaxed & Peaceful",
    style: "Gentle, peaceful, slow-paced voice perfect for night reading",
    geminiVoice: "Zephyr",
    exampleText: "Let the noise of the day fade as the story softly unfolds.",
    pitch: 0.96,
    rate: 0.86,
    lang: "Multi-language",
  },
  {
    id: "voice-puck-comedy",
    name: "Sam · Witty & Light",
    gender: "Neutral",
    tone: "Playful & Upbeat",
    style: "Witty, upbeat, playful voice with nimble comedic timing",
    geminiVoice: "Puck",
    exampleText: "Nobody expected the plan to succeed, least of all the captain.",
    pitch: 1.08,
    rate: 1.05,
    lang: "Multi-language",
  },
  {
    id: "voice-charon-mentor",
    name: "Prof. Sen · Wise Mentor",
    gender: "Male",
    tone: "Thoughtful & Steady",
    style: "Thoughtful, wise, reassuring mentor voice for philosophy and self-help",
    geminiVoice: "Charon",
    exampleText: "Patience is not waiting; it is the quiet strength to keep building.",
    pitch: 0.9,
    rate: 0.92,
    lang: "Multi-language",
  },
  {
    id: "voice-kore-news",
    name: "Kavya · Rapid Brief",
    gender: "Female",
    tone: "Focused & Brisk",
    style: "Focused, brisk, crystal-clear speed-reading narrator",
    geminiVoice: "Kore",
    exampleText: "Key insights delivered clearly so you absorb every detail quickly.",
    pitch: 1.02,
    rate: 1.12,
    lang: "Multi-language",
  },
  {
    id: "voice-fenrir-adventure",
    name: "Rehan · Adventure Hero",
    gender: "Male",
    tone: "Spirited & Heroic",
    style: "Spirited, adventurous, dynamic voice for action and fantasy",
    geminiVoice: "Fenrir",
    exampleText: "Beyond the northern pass lay peaks no traveler had ever charted.",
    pitch: 0.96,
    rate: 1.02,
    lang: "Multi-language",
  },
  {
    id: "voice-zephyr-mindful",
    name: "Sana · Mindful Guide",
    gender: "Female",
    tone: "Centered & Serene",
    style: "Centered, serene, mindful voice for wellness and spiritual texts",
    geminiVoice: "Zephyr",
    exampleText: "Notice the quiet space between each breath and each spoken line.",
    pitch: 0.98,
    rate: 0.89,
    lang: "Multi-language",
  },
  {
    id: "voice-puck-biographer",
    name: "Neil · Biographer",
    gender: "Male",
    tone: "Reflective & Clear",
    style: "Reflective, journalistic, clear voice for memoirs and biographies",
    geminiVoice: "Puck",
    exampleText: "Long before the world knew her name, she kept a small notebook.",
    pitch: 0.98,
    rate: 0.97,
    lang: "Multi-language",
  },
];

export function resolveSpeechLocale(targetLanguage?: string | null): string {
  if (!targetLanguage) return "en-US";
  return findLanguage(targetLanguage)?.bcp47 || "en-US";
}

export function buildSpeechStyleInstruction(
  voice: AudioVoice,
  targetLanguage?: string | null
): string {
  if (targetLanguage && targetLanguage.trim()) {
    return `${voice.style}. Speak fluently and naturally in ${targetLanguage.trim()} with authentic pronunciation.`;
  }
  return voice.style;
}

function getBlockText(block: Block): string {
  if (block.type === "heading" || block.type === "paragraph") {
    return block.text.trim();
  }
  return "";
}

/**
 * Extracts readable text starting from the user's current reading position
 * (using visibleBlockId first, then source page match, then proportional offset
 * so fallback / multi-viewport-page books never return empty text).
 */
export function getReadableTextForLocation(
  book: ReflowBook,
  currentPage: number,
  totalPages: number,
  visibleBlockId?: string | null,
  maxChars = 1400
): string {
  const textBlocks = book.blocks.filter(
    (b) => (b.type === "heading" || b.type === "paragraph") && b.text.trim().length > 0
  );
  if (textBlocks.length === 0) return "";

  let startIndex = -1;

  if (visibleBlockId) {
    startIndex = textBlocks.findIndex((b) => b.id === visibleBlockId);
  }

  if (startIndex < 0) {
    // Try matching source page if book has multi-page blocks
    const maxSourcePage = textBlocks.reduce((m, b) => Math.max(m, b.page || 1), 1);
    if (maxSourcePage > 1) {
      const approxSourcePage = Math.max(
        1,
        Math.round((currentPage / Math.max(1, totalPages)) * maxSourcePage)
      );
      startIndex = textBlocks.findIndex((b) => b.page >= approxSourcePage);
    }
  }

  if (startIndex < 0) {
    // Proportional fallback across total text blocks
    const ratio = Math.max(0, Math.min(1, (currentPage - 1) / Math.max(1, totalPages)));
    startIndex = Math.min(textBlocks.length - 1, Math.floor(ratio * textBlocks.length));
  }

  const collected: string[] = [];
  let charCount = 0;
  for (let i = startIndex; i < textBlocks.length; i++) {
    const t = getBlockText(textBlocks[i]);
    if (!t) continue;
    if (charCount > 0 && charCount + t.length > maxChars) break;
    collected.push(t);
    charCount += t.length + 1;
  }

  // If the starting block itself was slightly long, always include at least one block
  if (collected.length === 0 && textBlocks[startIndex]) {
    collected.push(getBlockText(textBlocks[startIndex]).slice(0, maxChars));
  }

  return collected.join(" ");
}
