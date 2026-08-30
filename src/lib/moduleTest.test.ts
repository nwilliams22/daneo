import { describe, expect, it } from "vitest";
import {
  allSentences,
  allWords,
  moduleById,
  modulesOrdered,
  sentenceById,
  wordById,
} from "../content";
import { mulberry32 } from "./rng";
import {
  buildModuleTest,
  drillKindFor,
  scorePct,
  testableWords,
  TEST_SHAPE,
} from "./moduleTest";

const build = (moduleId: string, seed = 42) =>
  buildModuleTest(
    moduleById.get(moduleId)!,
    wordById,
    sentenceById,
    allWords,
    allSentences,
    mulberry32(seed),
  );

describe("buildModuleTest", () => {
  it("assembles the full shape for a standard module", () => {
    const qs = build("m24");
    expect(qs.filter((q) => q.kind === "wordMeaning")).toHaveLength(
      TEST_SHAPE.wordMeaning,
    );
    expect(qs.filter((q) => q.kind === "wordPick")).toHaveLength(
      TEST_SHAPE.wordPick,
    );
    expect(qs.filter((q) => q.kind === "typing")).toHaveLength(
      TEST_SHAPE.typing,
    );
    expect(qs.filter((q) => q.kind === "sentence")).toHaveLength(
      TEST_SHAPE.sentence,
    );
    expect(qs.filter((q) => q.kind === "role")).toHaveLength(TEST_SHAPE.role);
    // sentence work closes the test: translation MCQs, then labelling
    expect(qs[qs.length - 1].kind).toBe("role");
  });

  it("labels sentences the translation MCQs did not use when it can", () => {
    const qs = build("m24");
    const mcq = new Set(
      qs.filter((q) => q.kind === "sentence").map((q) => q.item.id),
    );
    for (const q of qs)
      if (q.kind === "role") expect(mcq.has(q.item.id)).toBe(false);
  });

  it("samples only the module's own content", () => {
    const m = moduleById.get("m25")!;
    const wordSet = new Set(m.wordIds);
    const sentenceSet = new Set(m.sentenceIds);
    for (const q of build("m25")) {
      if (q.kind === "sentence" || q.kind === "role")
        expect(sentenceSet.has(q.item.id)).toBe(true);
      else expect(wordSet.has(q.item.id)).toBe(true);
    }
  });

  it("never repeats a word across word questions", () => {
    const qs = build("m3");
    const wordIds = qs
      .filter((q) => q.kind !== "sentence" && q.kind !== "role")
      .map((q) => q.item.id);
    expect(new Set(wordIds).size).toBe(wordIds.length);
  });

  it("keeps MCQ options 4-wide, answer included, labels distinct", () => {
    for (const q of build("m19")) {
      if (q.kind === "typing" || q.kind === "role") continue;
      expect(q.options).toHaveLength(4);
      expect(q.options.some((o) => o.id === q.item.id)).toBe(true);
      if (q.kind === "sentence") continue;
      const ens = q.options.map((o) => (o as { en: string }).en);
      expect(new Set(ens).size).toBe(4);
    }
  });

  it("excludes particles from testable words", () => {
    // m17's checklist carries the particle-class 것 (w_p_geot)
    const m = moduleById.get("m17")!;
    for (const w of testableWords(m, wordById))
      expect(w.pos).not.toBe("particle");
  });

  it("returns an empty test for interludes", () => {
    const interlude = modulesOrdered.find((m) => m.wordIds.length === 0)!;
    expect(
      buildModuleTest(interlude, wordById, sentenceById, allWords, allSentences),
    ).toEqual([]);
  });

  it("is deterministic under a seeded rng", () => {
    const a = build("m22", 7).map((q) => q.key);
    const b = build("m22", 7).map((q) => q.key);
    expect(a).toEqual(b);
  });

  it("builds a full-shape test for every vocab module", () => {
    const total =
      TEST_SHAPE.wordMeaning +
      TEST_SHAPE.wordPick +
      TEST_SHAPE.typing +
      TEST_SHAPE.sentence +
      TEST_SHAPE.role;
    for (const m of modulesOrdered) {
      if (m.wordIds.length === 0) continue;
      expect(build(m.id)).toHaveLength(total);
    }
  });
});

describe("drillKindFor", () => {
  it("maps question kinds onto the drill funnel", () => {
    const qs = build("m24");
    for (const q of qs) {
      const kind = drillKindFor(q);
      if (q.kind === "sentence") expect(kind).toBe("anatomy");
      else if (q.kind === "role") expect(kind).toBe("role");
      else if (q.kind === "typing") expect(kind).toBe("typing");
      else expect(kind).toBe("word");
    }
  });
});

describe("scorePct", () => {
  it("rounds to whole percent and survives empty tests", () => {
    expect(scorePct(12, 15)).toBe(80);
    expect(scorePct(0, 15)).toBe(0);
    expect(scorePct(15, 15)).toBe(100);
    expect(scorePct(0, 0)).toBe(0);
  });
});
