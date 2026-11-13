import { useState, useCallback, useRef } from "react";
import { AIService } from "@/services/AIService";
import { toast } from "sonner";

export interface AIState {
  isTranslating: boolean;
  isGeneratingAudio: boolean;
  targetLanguage: string;
  translationMap: Record<string, string>; // blockId -> translatedText
  isPlaying: boolean;
  currentAudioBlockId: string | null;
}

export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "ur", name: "Urdu" },
  { code: "ar", name: "Arabic" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
];

export const TTS_VOICES = [
  { id: "Kore", name: "Kore (Female - Professional)", gender: "female" },
  { id: "Charon", name: "Charon (Male - Deep)", gender: "male" },
  { id: "Puck", name: "Puck (Cheerful)", gender: "neutral" },
  { id: "Zephyr", name: "Zephyr (Soft)", gender: "neutral" },
];

export const useReaderAI = (bookId: string | undefined) => {
  const [state, setState] = useState<AIState>({
    isTranslating: false,
    isGeneratingAudio: false,
    targetLanguage: "original",
    translationMap: {},
    isPlaying: false,
    currentAudioBlockId: null,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const translateBlock = useCallback(async (blockId: string, text: string, lang: string) => {
    if (lang === "original") return;
    
    setState(s => ({ ...s, isTranslating: true }));
    try {
      const translated = await AIService.translate(text, lang);
      setState(s => ({
        ...s,
        isTranslating: false,
        translationMap: { ...s.translationMap, [blockId]: translated }
      }));
      return translated;
    } catch (error) {
      console.error("Translation failed:", error);
      toast.error("Translation failed. Please try again.");
      setState(s => ({ ...s, isTranslating: false }));
    }
  }, []);

  const playBlock = useCallback(async (blockId: string, text: string, voice: string = "Kore") => {
    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setState(s => ({ ...s, isGeneratingAudio: true, currentAudioBlockId: blockId, isPlaying: true }));
    
    try {
      const audioData = await AIService.textToSpeech(text, voice);
      const audioUrl = `data:audio/wav;base64,${audioData}`;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setState(s => ({ ...s, isPlaying: false, currentAudioBlockId: null }));
      };

      await audio.play();
      setState(s => ({ ...s, isGeneratingAudio: false }));
    } catch (error) {
      console.error("TTS failed:", error);
      toast.error("Audio generation failed.");
      setState(s => ({ ...s, isGeneratingAudio: false, isPlaying: false }));
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setState(s => ({ ...s, isPlaying: false, currentAudioBlockId: null }));
  }, []);

  const setTargetLanguage = useCallback((lang: string) => {
    setState(s => ({ ...s, targetLanguage: lang }));
  }, []);

  return {
    ...state,
    translateBlock,
    playBlock,
    stopAudio,
    setTargetLanguage,
  };
};
