import { describe, expect, it } from "vitest";
import {
  dedupeMisses,
  missedWordIds,
  missViews,
  withoutMiss,
} from "./testMisses";
import type { Sentence, TestMiss, Word } from "../types";

const word = (id: string, ko: string, en: string): Word => ({
  id,
  ko,
  rom: "x",
  en,
  pos: "noun",
  moduleId: "m1",
});

const sentence = (id: string): Sentence => ({
  id,
  ko: [
    { id: "c1", t: "저는", role: "subject" },
    { id: "c2", t: "", role: "other" },
    { id: "c3", t: "마셔요", role: "verb" },
  ],
  en: [
    { id: "e1", t: "I", role: "subject" },
    { id: "e2", t: "drink", role: "verb" },
  ],
  gloss: [
    { id: "c1", t: "I-TOPIC", role: "subject" },
    { id: "c3", t: "drink", role: "verb" },
  ],
  rom: "jeoneun masyeoyo",
  wordIds: ["w_jeo"],
  note: "n",
});

const wordById = new Map([
  ["w_mul", word("w_mul", "물", "water")],
  ["w_jeo", word("w_jeo", "저", "I")],
]);
const sentenceById = new Map([["s_1", sentence("s_1")]]);

describe("dedupeMisses", () => {
  it("keeps one entry per card, in first-seen order", () => {
    const misses: TestMiss[] = [
      { kind: "word", itemId: "w_mul" },
      { kind: "typing", itemId: "w_mul" },
      { kind: "word", itemId: "w_mul" },
    ];
    expect(dedupeMisses(misses)).toEqual([
      { kind: "word", itemId: "w_mul" },
      { kind: "typing", itemId: "w_mul" },
    ]);
  });
});

describe("withoutMiss", () => {
  const misses: TestMiss[] = [
    { kind: "word", itemId: "w_mul" },
    { kind: "typing", itemId: "w_mul" },
    { kind: "anatomy", itemId: "s_1" },
  ];

  it("drops only the matching kind+item", () => {
    expect(withoutMiss(misses, "word", "w_mul")).toEqual([
      { kind: "typing", itemId: "w_mul" },
      { kind: "anatomy", itemId: "s_1" },
    ]);
  });

  it("leaves the list alone when nothing matches", () => {
    expect(withoutMiss(misses, "word", "w_jeo")).toHaveLength(3);
  });
});

describe("missedWordIds", () => {
  it("covers both word-card kinds and ignores sentence kinds", () => {
    const ids = missedWordIds([
      { kind: "word", itemId: "w_mul" },
      { kind: "typing", itemId: "w_jeo" },
      { kind: "anatomy", itemId: "s_1" },
      { kind: "role", itemId: "s_1" },
    ]);
    expect([...ids].sort()).toEqual(["w_jeo", "w_mul"]);
  });

  it("handles a row written before misses were tracked", () => {
    expect(missedWordIds().size).toBe(0);
  });
});

describe("missViews", () => {
  it("renders words and sentences, and skips items that left the content", () => {
    const views = missViews(
      [
        { kind: "word", itemId: "w_mul" },
        { kind: "anatomy", itemId: "s_1" },
        { kind: "word", itemId: "w_gone" },
      ],
      wordById,
      sentenceById,
    );
    expect(views).toEqual([
      { id: "word:w_mul", big: "물", small: "water" },
      { id: "anatomy:s_1", big: "저는 마셔요", small: "I drink" },
    ]);
  });
});
