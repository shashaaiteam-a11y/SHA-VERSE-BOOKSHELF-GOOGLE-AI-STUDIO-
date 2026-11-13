import { useState, useEffect, useCallback, useRef } from "react";
import {
  CURATED_AUDIO_VOICES,
  buildSpeechStyleInstruction,
  resolveSpeechLocale,
  type AudioVoice,
} from "@/lib/reader/audioVoices";
import { toast } from "sonner";

export type { AudioVoice };

export interface PlayAudioOptions {
  voice?: AudioVoice;
  targetLanguage?: string | null;
}

export const useAudioReader = () => {
  const [voices] = useState<AudioVoice[]>(CURATED_AUDIO_VOICES);
  const [currentVoice, setCurrentVoice] = useState<AudioVoice>(CURATED_AUDIO_VOICES[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [loadingExampleId, setLoadingExampleId] = useState<string | null>(null);
  const [playingExampleId, setPlayingExampleId] = useState<string | null>(null);
  const [rate, setRate] = useState(1);

  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const runIdRef = useRef(0);

  const cleanupAudio = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.onended = null;
      audioElRef.current.onerror = null;
      audioElRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const stop = useCallback(() => {
    runIdRef.current += 1;
    cleanupAudio();
    setIsPlaying(false);
    setIsPaused(false);
    setIsLoadingAudio(false);
    setLoadingExampleId(null);
    setPlayingExampleId(null);
  }, [cleanupAudio]);

  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, [cleanupAudio]);

  const speakWithWebSpeechFallback = useCallback(
    (
      text: string,
      voice: AudioVoice,
      targetLanguage: string | null | undefined,
      onFinish: () => void
    ) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        onFinish();
        return false;
      }
      const locale = resolveSpeechLocale(targetLanguage);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = locale;
      utterance.rate = Math.max(0.6, Math.min(1.6, voice.rate * rate));
      utterance.pitch = voice.pitch;

      const sysVoices = window.speechSynthesis.getVoices();
      const matched =
        sysVoices.find((v) => v.lang.toLowerCase().startsWith(locale.split("-")[0].toLowerCase())) ||
        sysVoices.find((v) => v.lang.startsWith("en")) ||
        sysVoices[0];
      if (matched) utterance.voice = matched;

      utterance.onend = onFinish;
      utterance.onerror = onFinish;
      window.speechSynthesis.speak(utterance);
      return true;
    },
    [rate]
  );

  const fetchAndPlayTts = useCallback(
    async (
      text: string,
      voice: AudioVoice,
      targetLanguage: string | null | undefined,
      isExample: boolean
    ) => {
      cleanupAudio();
      const controller = new AbortController();
      abortRef.current = controller;
      const runId = ++runIdRef.current;

      if (isExample) {
        setLoadingExampleId(voice.id);
        setPlayingExampleId(null);
        setIsPlaying(false);
      } else {
        setIsLoadingAudio(true);
        setIsPlaying(false);
        setIsPaused(false);
      }

      try {
        const res = await fetch("/api/ai/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            text,
            voice: voice.geminiVoice,
            style: buildSpeechStyleInstruction(voice, targetLanguage),
            language: targetLanguage || undefined,
          }),
        });

        if (!res.ok) {
          throw new Error(`TTS HTTP ${res.status}`);
        }

        const data = await res.json();
        if (controller.signal.aborted || runId !== runIdRef.current) return;

        if (!data?.audioData) {
          throw new Error("Missing audio data");
        }

        const binary = atob(data.audioData);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: data.mimeType || "audio/wav" });
        const url = URL.createObjectURL(blob);
        audioUrlRef.current = url;

        const audio = new Audio(url);
        audio.playbackRate = rate;
        audioElRef.current = audio;

        audio.onended = () => {
          if (runId !== runIdRef.current) return;
          setIsPlaying(false);
          setIsPaused(false);
          setPlayingExampleId(null);
        };
        audio.onerror = () => {
          if (runId !== runIdRef.current) return;
          setIsPlaying(false);
          setIsPaused(false);
          setPlayingExampleId(null);
        };

        try {
          await audio.play();
          if (runId !== runIdRef.current) return;

          if (isExample) {
            setLoadingExampleId(null);
            setPlayingExampleId(voice.id);
          } else {
            setIsLoadingAudio(false);
            setIsPlaying(true);
            setIsPaused(false);
          }
        } catch (playErr: any) {
          if (runId !== runIdRef.current) return;
          if (playErr?.name === "NotAllowedError") {
            setLoadingExampleId(null);
            setIsLoadingAudio(false);
            if (!isExample) {
              setIsPlaying(false);
              setIsPaused(true);
            }
            return;
          }
          throw playErr;
        }
      } catch (err: any) {
        if (err?.name === "AbortError" || controller.signal.aborted || runId !== runIdRef.current) {
          return;
        }
        console.warn("AI TTS unavailable, using browser speech fallback:", err);
        setLoadingExampleId(null);
        setIsLoadingAudio(false);

        const started = speakWithWebSpeechFallback(text, voice, targetLanguage, () => {
          if (runId !== runIdRef.current) return;
          setIsPlaying(false);
          setIsPaused(false);
          setPlayingExampleId(null);
        });

        if (started) {
          if (isExample) {
            setPlayingExampleId(voice.id);
          } else {
            setIsPlaying(true);
            setIsPaused(false);
          }
        } else {
          toast.error("Unable to start audio playback in this browser.");
        }
      }
    },
    [cleanupAudio, rate, speakWithWebSpeechFallback]
  );

  const play = useCallback(
    async (text: string, options: PlayAudioOptions = {}) => {
      const voiceToUse = options.voice || currentVoice;
      if (options.voice) {
        setCurrentVoice(options.voice);
      }
      if (!text || !text.trim()) {
        toast.info("No readable text found on this page.");
        return;
      }
      await fetchAndPlayTts(text, voiceToUse, options.targetLanguage, false);
    },
    [currentVoice, fetchAndPlayTts]
  );

  const togglePause = useCallback(() => {
    const audio = audioElRef.current;
    if (audio) {
      if (audio.paused) {
        void audio.play();
        setIsPaused(false);
        setIsPlaying(true);
      } else {
        audio.pause();
        setIsPaused(true);
        setIsPlaying(false);
      }
      return;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window && window.speechSynthesis.speaking) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
        setIsPlaying(true);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
        setIsPlaying(false);
      }
    }
  }, []);

  const playExample = useCallback(
    async (voice: AudioVoice, targetLanguage?: string | null) => {
      if (playingExampleId === voice.id) {
        stop();
        return;
      }
      const promptText = targetLanguage
        ? `Hello, I am ${voice.name.split("·")[0].trim()}. I will read this book in ${targetLanguage}.`
        : voice.exampleText;
      await fetchAndPlayTts(promptText, voice, targetLanguage, true);
    },
    [fetchAndPlayTts, playingExampleId, stop]
  );

  return {
    voices,
    currentVoice,
    setCurrentVoice,
    isPlaying,
    isPaused,
    isLoadingAudio,
    loadingExampleId,
    playingExampleId,
    play,
    stop,
    togglePause,
    playExample,
    rate,
    setRate,
  };
};
