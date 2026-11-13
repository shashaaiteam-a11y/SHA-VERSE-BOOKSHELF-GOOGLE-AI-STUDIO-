import type { Block, ReflowBook } from "./types";
import { isRtlLanguage } from "./languages";

export interface TranslatableEntry {
  blockIndex: number;
  id: string;
  text: string;
}

export function extractTranslatableEntries(blocks: Block[]): TranslatableEntry[] {
  const entries: TranslatableEntry[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (
      (block.type === "heading" || block.type === "paragraph") &&
      typeof block.text === "string" &&
      block.text.trim().length > 0
    ) {
      entries.push({
        blockIndex: i,
        id: block.id,
        text: block.text,
      });
    }
  }
  return entries;
}

export function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  if (chunkSize <= 0) return [items];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

export function chunkEntriesBySize(
  entries: TranslatableEntry[],
  maxBlocks = 12,
  maxChars = 2200
): TranslatableEntry[][] {
  if (entries.length === 0) return [];
  const chunks: TranslatableEntry[][] = [];
  let current: TranslatableEntry[] = [];
  let currentChars = 0;

  for (const entry of entries) {
    const len = entry.text.length;
    if (
      current.length > 0 &&
      (current.length >= maxBlocks || currentChars + len > maxChars)
    ) {
      chunks.push(current);
      current = [];
      currentChars = 0;
    }
    current.push(entry);
    currentChars += len;
  }

  if (current.length > 0) {
    chunks.push(current);
  }
  return chunks;
}

/**
 * Reorders chunks so the batch around `priorityBlockIndex` translates first,
 * allowing the reader to display the user's current page almost immediately.
 */
export function prioritizeChunks(
  entries: TranslatableEntry[],
  chunkSize: number,
  priorityBlockIndex = 0,
  maxChars = 2200
): TranslatableEntry[][] {
  const chunks = chunkEntriesBySize(entries, chunkSize, maxChars);
  if (chunks.length <= 1 || priorityBlockIndex <= 0) return chunks;

  const targetChunkIdx = chunks.findIndex((chunk) =>
    chunk.some((entry) => entry.blockIndex >= priorityBlockIndex)
  );
  if (targetChunkIdx <= 0) return chunks;

  return [
    chunks[targetChunkIdx],
    ...chunks.slice(0, targetChunkIdx),
    ...chunks.slice(targetChunkIdx + 1),
  ];
}

export function applyTranslationsToBook(
  book: ReflowBook,
  translationsById: ReadonlyMap<string, string>,
  targetLanguage: string
): ReflowBook {
  const rtl = isRtlLanguage(targetLanguage);
  const dir = rtl ? "rtl" : "ltr";

  const translatedBlocks: Block[] = book.blocks.map((block) => {
    if (block.type === "heading" || block.type === "paragraph") {
      const translated = translationsById.get(block.id);
      if (translated && translated.trim().length > 0) {
        return {
          ...block,
          text: translated,
          dir,
        };
      }
      return {
        ...block,
        dir,
      };
    }
    return block;
  });

  const translatedChapters = book.chapters.map((chapter) => {
    const block = book.blocks[chapter.blockIndex];
    if (block && (block.type === "heading" || block.type === "paragraph")) {
      const translated = translationsById.get(block.id);
      if (translated && translated.trim().length > 0) {
        return {
          ...chapter,
          title: translated,
        };
      }
    }
    return chapter;
  });

  return {
    ...book,
    meta: {
      ...book.meta,
      language: targetLanguage,
      dir,
    },
    blocks: translatedBlocks,
    chapters: translatedChapters,
  };
}
