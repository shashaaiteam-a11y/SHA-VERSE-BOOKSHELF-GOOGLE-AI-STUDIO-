import test from "node:test";
import assert from "node:assert/strict";
import {
  extractTranslatableEntries,
  prioritizeChunks,
  applyTranslationsToBook,
} from "./translation";
import { SUPPORTED_LANGUAGES, filterLanguages, isRtlLanguage } from "./languages";
import type { ReflowBook } from "./types";

const sampleBook: ReflowBook = {
  version: 6,
  bookId: "b1",
  meta: {
    title: "Test Book",
    author: "Test Author",
    totalPages: 2,
    scanned: false,
    dir: "ltr",
  },
  blocks: [
    { id: "b0", page: 1, type: "heading", level: 1, text: "Chapter 1", dir: "ltr" },
    { id: "b1", page: 1, type: "paragraph", text: "Hello world.", dir: "ltr" },
    { id: "b2", page: 1, type: "pagebreak" },
    { id: "b3", page: 2, type: "table", rows: [["A", "B"]] },
    { id: "b4", page: 2, type: "paragraph", text: "Second page text.", dir: "ltr" },
  ],
  chapters: [{ id: "c1", title: "Chapter 1", blockIndex: 0, page: 1, level: 1 }],
};

test("SUPPORTED_LANGUAGES is A-Z sorted and searchable", () => {
  assert.ok(SUPPORTED_LANGUAGES.length >= 80);
  for (let i = 1; i < SUPPORTED_LANGUAGES.length; i++) {
    assert.ok(
      SUPPORTED_LANGUAGES[i - 1].name.localeCompare(SUPPORTED_LANGUAGES[i].name) <= 0
    );
  }
  const hindi = filterLanguages("हिन्दी");
  assert.equal(hindi[0]?.name, "Hindi");
  assert.equal(isRtlLanguage("Urdu"), true);
  assert.equal(isRtlLanguage("Hindi"), false);
});

test("extractTranslatableEntries skips non-text blocks cleanly", () => {
  const entries = extractTranslatableEntries(sampleBook.blocks);
  assert.deepEqual(
    entries.map((e) => e.id),
    ["b0", "b1", "b4"]
  );
});

test("prioritizeChunks puts priority block chunk first", () => {
  const entries = extractTranslatableEntries(sampleBook.blocks);
  const chunks = prioritizeChunks(entries, 1, 4);
  assert.equal(chunks[0][0].id, "b4");
  assert.equal(chunks.length, 3);
});

test("prioritizeChunks splits chunks when maxChars is exceeded", () => {
  const longEntries = [
    { blockIndex: 0, id: "a", text: "x".repeat(1200) },
    { blockIndex: 1, id: "b", text: "y".repeat(1200) },
    { blockIndex: 2, id: "c", text: "z".repeat(400) },
  ];
  const chunks = prioritizeChunks(longEntries, 12, 0, 2200);
  assert.equal(chunks.length, 2);
  assert.deepEqual(chunks[0].map((e) => e.id), ["a"]);
  assert.deepEqual(chunks[1].map((e) => e.id), ["b", "c"]);
});

test("applyTranslationsToBook translates text blocks, chapters, and sets RTL when needed", () => {
  const map = new Map<string, string>([
    ["b0", "باب 1"],
    ["b1", "ہیلو دنیا۔"],
    ["b4", "دوسرے صفحے کا متن۔"],
  ]);
  const translated = applyTranslationsToBook(sampleBook, map, "Urdu");
  assert.equal(translated.meta.language, "Urdu");
  assert.equal(translated.meta.dir, "rtl");
  assert.equal((translated.blocks[0] as any).text, "باب 1");
  assert.equal((translated.blocks[1] as any).dir, "rtl");
  assert.equal(translated.blocks[2].type, "pagebreak");
  assert.equal(translated.blocks[3].type, "table");
  assert.equal(translated.chapters[0].title, "باب 1");
});
