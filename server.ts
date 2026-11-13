import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const ttsAi = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    apiVersion: "v1beta",
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const VALID_GEMINI_VOICES = new Set(["Puck", "Charon", "Kore", "Fenrir", "Zephyr"]);

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.code;
      const retryable = status === 429 || status === 503 || /unavailable|timeout/i.test(String(err?.message || ""));
      if (!retryable || attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  throw lastError;
}

function parseJsonStringArray(raw: string): string[] {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) {
    throw new Error("Expected JSON array from translation model");
  }
  return parsed.map((item) => (typeof item === "string" ? item : String(item ?? "")));
}

// AI Bulk Translation Endpoint (for book blocks)
app.post("/api/ai/translate-blocks", async (req, res) => {
  try {
    const { texts, targetLanguage } = req.body;

    if (!Array.isArray(texts) || !targetLanguage || typeof targetLanguage !== "string") {
      return res.status(400).json({ error: "Texts (array) and targetLanguage are required." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Server Gemini API key is not configured." });
    }

    const sanitizedTexts = texts.map((t) => (typeof t === "string" ? t : ""));
    if (sanitizedTexts.length === 0) {
      return res.json({ translatedTexts: [] });
    }

    const response = await withRetry(() =>
      ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: `Translate each string in the JSON array below into ${targetLanguage}. Keep the EXACT same array length (${sanitizedTexts.length} items) and order. Preserve meaning, literary tone, and punctuation. Do not merge or split items.\n\n${JSON.stringify(sanitizedTexts)}`,
        config: {
          systemInstruction:
            "You are a professional literary translator. Return ONLY a JSON array of translated strings matching the input array length and order.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        },
      })
    );

    const rawText = (response.text ?? "[]").trim();
    const translatedTexts = parseJsonStringArray(rawText);
    const normalized = sanitizedTexts.map((orig, idx) =>
      typeof translatedTexts[idx] === "string" && translatedTexts[idx].trim().length > 0
        ? translatedTexts[idx]
        : orig
    );

    res.json({ translatedTexts: normalized });
  } catch (error: any) {
    console.error("Bulk Translation error:", error);
    const status = typeof error?.status === "number" && error.status >= 400 ? error.status : 500;
    res.status(status).json({ error: error?.message || "Bulk Translation failed" });
  }
});

// AI Text-to-Speech Endpoint
app.post("/api/ai/tts", async (req, res) => {
  try {
    const {
      text,
      voice = "Kore",
      style = "Clear, expressive audiobook narrator",
      language,
    } = req.body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Text is required." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Server Gemini API key is not configured." });
    }

    const selectedVoice = VALID_GEMINI_VOICES.has(voice) ? voice : "Kore";
    const clippedText = text.trim().slice(0, 1800);
    const fullStyle =
      language && typeof language === "string" && language.trim()
        ? `${style}. Read naturally in ${language.trim()}.`
        : style;

    const response = await withRetry(() =>
      ttsAi.models.generateContent({
        model: "gemini-3.8-flash-lite-tts",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: clippedText,
                speechMetadata: {
                  style: fullStyle,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice as any },
            },
          },
        },
      })
    );

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error("No audio generated");
    }

    res.json({ audioData: base64Audio, mimeType: "audio/wav" });
  } catch (error: any) {
    console.error("TTS error:", error);
    const status = typeof error?.status === "number" && error.status >= 400 ? error.status : 500;
    res.status(status).json({ error: error?.message || "TTS failed" });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// Serve static files and handle routing
if (process.env.NODE_ENV === "development") {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(__dirname, "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
