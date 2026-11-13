import test from "node:test";
import assert from "node:assert/strict";
import {
  CURATED_AUDIO_VOICES,
  resolveSpeechLocale,
  buildSpeechStyleInstruction,
  getReadableTextForLocation,
} from "./audioVoices";
import type { ReflowBook } from "./types";

const sampleBook: ReflowBook = {
  version: 6,
  bookId: "b1",
  meta: { title: "Demo", author: "Author", totalPages: 1, scanned: false, dir: "ltr" },
  blocks: [
    { id: "b_title", page: 1, type: "heading", level: 1, text: "My Book", dir: "ltr" },
    { id: "b_p1", page: 1, type: "paragraph", text: "First paragraph content.", dir: "ltr" },
    { id: "b_p2", page: 1, type: "paragraph", text: "Second paragraph content.", dir: "ltr" },
  ],
  chapters: [],
};

test("CURATED_AUDIO_VOICES has between 15 and 20 voices with example text", () => {
  assert.ok(CURATED_AUDIO_VOICES.length >= 15 && CURATED_AUDIO_VOICES.length <= 20);
  for (const voice of CURATED_AUDIO_VOICES) {
    assert.ok(voice.id);
    assert.ok(voice.name);
    assert.ok(voice.exampleText.length > 10);
    assert.ok(["Kore", "Puck", "Charon", "Fenrir", "Zephyr"].includes(voice.geminiVoice));
  }
});

test("resolveSpeechLocale & buildSpeechStyleInstruction sync with translation language", () => {
  assert.equal(resolveSpeechLocale("Hindi"), "hi-IN");
  assert.equal(resolveSpeechLocale("Urdu"), "ur-PK");
  assert.equal(resolveSpeechLocale(null), "en-US");
  const style = buildSpeechStyleInstruction(CURATED_AUDIO_VOICES[0], "Hindi");
  assert.match(style, /Hindi/);
});

test("getReadableTextForLocation falls back cleanly even when viewport page exceeds source page", () => {
  const text = getReadableTextForLocation(sampleBook, 2, 3, null);
  assert.ok(text.includes("Second paragraph content."));
  const anchored = getReadableTextForLocation(sampleBook, 1, 3, "b_p1");
  assert.ok(anchored.startsWith("First paragraph content."));
});
