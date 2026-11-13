export interface TranslationResponse {
  translatedText: string;
}

export interface TTSResponse {
  audioData: string; // Base64 encoded WAV
}

export const AIService = {
  async translate(text: string, targetLanguage: string, sourceLanguage: string = "auto"): Promise<string> {
    try {
      const response = await fetch("/api/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLanguage, sourceLanguage }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Translation failed");
      }

      const data: TranslationResponse = await response.json();
      return data.translatedText;
    } catch (error) {
      console.error("AIService.translate error:", error);
      throw error;
    }
  },

  async textToSpeech(text: string, voice: string = "Kore", style: string = "Clear, professional reading"): Promise<string> {
    try {
      const response = await fetch("/api/ai/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice, style }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "TTS failed");
      }

      const data: TTSResponse = await response.json();
      return data.audioData;
    } catch (error) {
      console.error("AIService.textToSpeech error:", error);
      throw error;
    }
  }
};
