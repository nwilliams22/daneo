import { describe, it, expect } from "vitest";
import {
  knownSet,
  moduleProgress,
  isModuleComplete,
  unlockedSentences,
  unlockedWords,
} from "./gating";
import { content, moduleById } from "../content";

const m1 = moduleById.get("m1")!;
const history = moduleById.get("m_hangul_history")!;

describe("word-first gating", () => {
  it("locks every sentence when nothing is known", () => {
    expect(unlockedSentences(content.sentences, new Set())).toEqual([]);
  });

  it("unlocks exactly the sentences whose every word is known", () => {
    const known = new Set(["w_jeo", "w_mul", "w_masida"]);
    const unlocked = unlockedSentences(content.sentences, known);
    expect(unlocked.map((s) => s.id)).toEqual(["s_water"]);
  });

  it("keeps a sentence locked when one word is unlearned", () => {
    const known = new Set(["w_jeo", "w_mul"]); // missing the verb
    expect(unlockedSentences(content.sentences, known)).toEqual([]);
  });

  it("re-locks when a word is un-checked", () => {
    const known = new Set(["w_jeo", "w_mul", "w_masida"]);
    expect(unlockedSentences(content.sentences, known)).toHaveLength(1);
    known.delete("w_mul");
    expect(unlockedSentences(content.sentences, known)).toHaveLength(0);
  });

  it("module completes only with every checklist word known", () => {
    const known = new Set(m1.wordIds.slice(0, -1));
    expect(isModuleComplete(m1, known)).toBe(false);
    expect(isModuleComplete(m1, new Set(m1.wordIds))).toBe(true);
  });

  it("a vocab-less module is trivially complete", () => {
    expect(isModuleComplete(history, new Set())).toBe(true);
  });

  it("full m1 checklist unlocks all m1 sentences", () => {
    const known = new Set(m1.wordIds);
    expect(unlockedSentences(content.sentences, known)).toHaveLength(
      m1.sentenceIds.length,
    );
  });

  it("progress counts known checklist words", () => {
    const known = new Set([m1.wordIds[0]!, m1.wordIds[1]!, "w_not_in_module"]);
    expect(moduleProgress(m1, known)).toEqual({
      done: 2,
      total: m1.wordIds.length,
    });
  });

  it("knownSet and unlockedWords round-trip", () => {
    const known = knownSet([
      { wordId: "w_mul", learnedAt: 1 },
      { wordId: "w_jeo", learnedAt: 2 },
    ]);
    expect(unlockedWords(content.words, known).map((w) => w.id).sort()).toEqual(
      ["w_jeo", "w_mul"],
    );
  });
});
