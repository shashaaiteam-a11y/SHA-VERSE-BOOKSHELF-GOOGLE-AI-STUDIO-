import { useState, useCallback, useRef } from "react";
import type { ReflowBook } from "@/lib/reader/types";
import {
  applyTranslationsToBook,
  extractTranslatableEntries,
  prioritizeChunks,
} from "@/lib/reader/translation";
import { toast } from "sonner";

const CHUNK_SIZE = 12;
const MAX_CHUNK_CHARS = 2200;

async function fetchTranslatedChunkWithRetry(
  texts: string[],
  targetLanguage: string,
  signal: AbortSignal,
  maxRetries = 2
): Promise<string[]> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (signal.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    const timeoutController = new AbortController();
    const onOuterAbort = () => timeoutController.abort();
    signal.addEventListener("abort", onOuterAbort, { once: true });
    const timeoutId = window.setTimeout(() => timeoutController.abort(), 25000);

    try {
      const response = await fetch("/api/ai/translate-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: timeoutController.signal,
        body: JSON.stringify({
          texts,
          targetLanguage,
        }),
      });

      if (!response.ok) {
        let serverMsg = `Translation failed (${response.status})`;
        try {
          const errBody = await response.json();
          if (errBody?.error) serverMsg = errBody.error;
        } catch {
          /* ignore non-JSON error body */
        }
        const retryableStatus =
          response.status === 429 ||
          response.status === 502 ||
          response.status === 503 ||
          response.status === 504;
        if (retryableStatus && attempt < maxRetries) {
          lastError = new Error(serverMsg);
          await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
          continue;
        }
        throw new Error(serverMsg);
      }

      const payload = await response.json();
      return Array.isArray(payload?.translatedTexts) ? payload.translatedTexts : [];
    } catch (err: any) {
      if (signal.aborted) {
        throw err;
      }
      lastError = err;
      const isNetworkOrTimeout =
        err instanceof TypeError ||
        err?.name === "AbortError" ||
        /failed to fetch|network|timeout/i.test(String(err?.message || ""));
      if (isNetworkOrTimeout && attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
        continue;
      }
      if (err instanceof TypeError || /failed to fetch/i.test(String(err?.message || ""))) {
        throw new Error("Connection interrupted during translation. Please try again.");
      }
      throw err;
    } finally {
      window.clearTimeout(timeoutId);
      signal.removeEventListener("abort", onOuterAbort);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Translation failed. Please try again.");
}

export const useBookTranslation = () => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);
  const [translatedBook, setTranslatedBook] = useState<ReflowBook | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const runIdRef = useRef(0);
  const cacheRef = useRef<Map<string, Map<string, string>>>(new Map());

  const resetTranslation = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    runIdRef.current += 1;
    setIsTranslating(false);
    setTranslationProgress(0);
    setTranslatedBook(null);
    setTargetLanguage(null);
  }, []);

  const translateBook = useCallback(
    async (book: ReflowBook, lang: string, priorityBlockIndex = 0) => {
      if (!book || !lang) return;

      // Cancel any in-flight translation run
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const runId = ++runIdRef.current;

      const cacheKey = `${book.bookId}:${lang}`;
      const existingMap = cacheRef.current.get(cacheKey);
      const entries = extractTranslatableEntries(book.blocks);

      if (entries.length === 0) {
        toast.info("No translatable text found in this book yet.");
        return;
      }

      // Instant restore if already cached completely
      if (existingMap && existingMap.size >= entries.length) {
        setTargetLanguage(lang);
        setTranslatedBook(applyTranslationsToBook(book, existingMap, lang));
        setTranslationProgress(100);
        setIsTranslating(false);
        return;
      }

      setIsTranslating(true);
      setTranslationProgress(0);
      setTargetLanguage(lang);

      const translationsById = new Map<string, string>(existingMap || []);
      const pendingEntries = entries.filter((e) => !translationsById.has(e.id));
      const chunks = prioritizeChunks(
        pendingEntries,
        CHUNK_SIZE,
        priorityBlockIndex,
        MAX_CHUNK_CHARS
      );

      try {
        for (let idx = 0; idx < chunks.length; idx++) {
          if (controller.signal.aborted || runId !== runIdRef.current) return;

          const chunk = chunks[idx];
          const textsToTranslate = chunk.map((item) => item.text);
          const translatedTexts = await fetchTranslatedChunkWithRetry(
            textsToTranslate,
            lang,
            controller.signal
          );

          chunk.forEach((entry, i) => {
            const out = translatedTexts[i];
            translationsById.set(
              entry.id,
              typeof out === "string" && out.trim().length > 0 ? out : entry.text
            );
          });

          cacheRef.current.set(cacheKey, new Map(translationsById));

          if (controller.signal.aborted || runId !== runIdRef.current) return;

          // Update reader immediately after EVERY chunk so current page updates right away
          setTranslatedBook(applyTranslationsToBook(book, translationsById, lang));
          setTranslationProgress(Math.round(((idx + 1) / chunks.length) * 100));
        }

        if (!controller.signal.aborted && runId === runIdRef.current) {
          toast.success(`Translated to ${lang}`);
        }
      } catch (error: any) {
        if (error?.name === "AbortError" || controller.signal.aborted) return;
        console.error("Translation error:", error);
        if (translationsById.size === 0) {
          setTargetLanguage(null);
          setTranslatedBook(null);
        }
        toast.error(error?.message || "Failed to translate book. Please try again.");
      } finally {
        if (runId === runIdRef.current) {
          setIsTranslating(false);
        }
      }
    },
    []
  );

  return {
    translateBook,
    resetTranslation,
    isTranslating,
    translationProgress,
    translatedBook,
    targetLanguage,
  };
};
