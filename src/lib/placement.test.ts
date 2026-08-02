import { describe, expect, it } from "vitest";
import { content, moduleById } from "../content";
import { mulberry32 } from "./rng";
import {
  buildPlacementQuiz,
  nextStage,
  placementOutcome,
  PLACEMENT_COUNT,
  PLACEMENT_PASS,
} from "./placement";

const m1 = moduleById.get("m1")!;
const m1Words = content.words.filter((w) => m1.wordIds.includes(w.id));
const m1Sentences = content.sentences.filter((s) =>
  m1.sentenceIds.includes(s.id),
);

const quiz = buildPlacementQuiz({
  confusables: content.confusables,
  words: m1Words,
  sentences: m1Sentences,
  rng: mulberry32(7),
});

describe("placement quiz construction", () => {
  it("builds the advertised number of questions per stage", () => {
    expect(quiz.hangul).toHaveLength(PLACEMENT_COUNT.hangul);
    expect(quiz.vocab).toHaveLength(PLACEMENT_COUNT.vocab);
    expect(quiz.glue).toHaveLength(PLACEMENT_COUNT.glue);
  });

  it("hangul questions span all four confusable groups", () => {
    const groups = new Set(
      quiz.hangul.map((q) => (q.stage === "hangul" ? q.item.group : "")),
    );
    expect(groups).toEqual(
      new Set(["vowel", "consonant", "compound", "tense"]),
    );
  });

  it("every question's options include its answer among 4 distinct labels", () => {
    for (const q of [...quiz.hangul, ...quiz.vocab, ...quiz.glue]) {
      if (q.stage === "hangul") {
        expect(q.options.some((o) => o.id === q.item.id)).toBe(true);
        expect(new Set(q.options.map((o) => o.r)).size).toBe(4);
      } else if (q.stage === "vocab") {
        expect(q.options.some((o) => o.id === q.word.id)).toBe(true);
        expect(new Set(q.options.map((o) => o.en)).size).toBe(4);
      } else {
        expect(q.options.some((o) => o.id === q.sentence.id)).toBe(true);
        expect(q.options).toHaveLength(4);
      }
    }
  });

  it("vocab questions never quiz particles", () => {
    for (const q of quiz.vocab) {
      if (q.stage === "vocab") expect(q.word.pos).not.toBe("particle");
    }
  });

  it("is deterministic under a seeded rng", () => {
    const again = buildPlacementQuiz({
      confusables: content.confusables,
      words: m1Words,
      sentences: m1Sentences,
      rng: mulberry32(7),
    });
    expect(again).toEqual(quiz);
  });
});

describe("adaptive flow", () => {
  it("stops after a failed stage, continues after a passed one", () => {
    expect(nextStage("hangul", PLACEMENT_PASS.hangul - 1)).toBeNull();
    expect(nextStage("hangul", PLACEMENT_PASS.hangul)).toBe("vocab");
    expect(nextStage("vocab", PLACEMENT_PASS.vocab - 1)).toBeNull();
    expect(nextStage("vocab", PLACEMENT_PASS.vocab)).toBe("glue");
    expect(nextStage("glue", PLACEMENT_COUNT.glue)).toBeNull();
  });
});

describe("placement outcomes", () => {
  const ids = m1.wordIds;

  it("failing hangul → start at the alphabet, nothing pre-marked", () => {
    const o = placementOutcome({ hangul: 2 }, ids);
    expect(o.level).toBe("alphabet");
    expect(o.hangulDone).toBe(false);
    expect(o.romanizationVisible).toBe(true);
    expect(o.preMarkWordIds).toEqual([]);
  });

  it("passing only hangul → alphabet collapsed, words still ahead", () => {
    const o = placementOutcome({ hangul: 5, vocab: 3 }, ids);
    expect(o.level).toBe("words");
    expect(o.hangulDone).toBe(true);
    expect(o.romanizationVisible).toBe(true);
    expect(o.preMarkWordIds).toEqual([]);
  });

  it("passing vocab but not glue → M1 words pre-marked, start at the glue", () => {
    const o = placementOutcome({ hangul: 4, vocab: 6, glue: 1 }, ids);
    expect(o.level).toBe("glue");
    expect(o.hangulDone).toBe(true);
    expect(o.romanizationVisible).toBe(false);
    expect(o.preMarkWordIds).toEqual(ids);
  });

  it("passing everything → start at Module 2 with M1 complete", () => {
    const o = placementOutcome({ hangul: 5, vocab: 5, glue: 4 }, ids);
    expect(o.level).toBe("module2");
    expect(o.preMarkWordIds).toEqual(ids);
  });

  it("an absent stage counts as not passed (adaptive stop happened)", () => {
    expect(placementOutcome({ hangul: 5 }, ids).level).toBe("words");
    expect(placementOutcome({ hangul: 5, vocab: 6 }, ids).level).toBe("glue");
  });
});
