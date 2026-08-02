import { describe, it, expect } from "vitest";
import { content } from "../src/content";
import { validateContent, type ContentError } from "../src/lib/validateContent";
import type { ContentBundle } from "../src/lib/schemas";

const clone = (): ContentBundle => structuredClone(content);

const codes = (errors: ContentError[]) => errors.map((e) => e.code);

describe("shipped content", () => {
  it("passes every pedagogy rule", () => {
    const errors = validateContent(content);
    if (errors.length > 0) {
      const report = errors.map((e) => `  [${e.code}] ${e.message}`).join("\n");
      expect.fail(`Content validation failed:\n${report}`);
    }
  });
});

describe("validator catches broken content", () => {
  it("flags a sentence word from a later module", () => {
    const b = clone();
    // invent a later module owning one of the words a sentence uses
    b.modules.push({
      id: "m99",
      title: "Later",
      order: 99,
      contentMd: "modules/module-1.md",
      wordIds: [],
      sentenceIds: [],
    });
    const mul = b.words.find((w) => w.id === "w_mul")!;
    mul.moduleId = "m99";
    b.modules.find((m) => m.id === "m1")!.wordIds = b.modules
      .find((m) => m.id === "m1")!
      .wordIds.filter((id) => id !== "w_mul");
    b.modules.find((m) => m.id === "m99")!.wordIds.push("w_mul");
    expect(codes(validateContent(b))).toContain("word-from-later-module");
  });

  it("flags a missing word reference", () => {
    const b = clone();
    b.sentences[0]!.wordIds.push("w_does_not_exist");
    expect(codes(validateContent(b))).toContain("missing-word");
  });

  it("flags a chunk id missing from one layer", () => {
    const b = clone();
    b.sentences[0]!.ko = b.sentences[0]!.ko.filter((c) => c.id !== "o");
    expect(codes(validateContent(b))).toContain("chunk-mismatch");
  });

  it("flags inconsistent roles for the same chunk id", () => {
    const b = clone();
    b.sentences[0]!.gloss[0]!.role = "place";
    expect(codes(validateContent(b))).toContain("chunk-role-mismatch");
  });

  it("flags duplicate ids", () => {
    const b = clone();
    b.words.push({ ...b.words[0]! });
    expect(codes(validateContent(b))).toContain("dup-id");
  });

  it("flags a word in no module checklist", () => {
    const b = clone();
    b.words.push({
      id: "w_ghost",
      ko: "유령",
      rom: "yuryeong",
      en: "ghost",
      pos: "noun",
      moduleId: "m1",
    });
    expect(codes(validateContent(b))).toContain("orphan-word");
  });

  it("flags a sentence in no module", () => {
    const b = clone();
    const m1 = b.modules.find((m) => m.id === "m1")!;
    m1.sentenceIds = m1.sentenceIds.filter((id) => id !== "s_water");
    expect(codes(validateContent(b))).toContain("orphan-sentence");
  });

  it("flags particles listed as gated sentence words", () => {
    const b = clone();
    b.sentences[0]!.wordIds.push("w_p_neun");
    expect(codes(validateContent(b))).toContain("particle-in-word-ids");
  });

  it("flags a confusable group too small to quiz", () => {
    const b = clone();
    b.confusables = b.confusables.filter(
      (c) => c.group !== "tense" || c.r === "kk" || c.r === "tt",
    );
    expect(codes(validateContent(b))).toContain("confusable-group-too-small");
  });

  it("flags non-Hangul word text", () => {
    const b = clone();
    b.words.find((w) => w.id === "w_mul")!.ko = "water!";
    expect(codes(validateContent(b))).toContain("word-not-typeable");
  });

  it("flags duplicate module orders", () => {
    const b = clone();
    b.modules[1]!.order = b.modules[0]!.order;
    expect(codes(validateContent(b))).toContain("dup-module-order");
  });
});
