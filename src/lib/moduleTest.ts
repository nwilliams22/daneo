import type { Module, Sentence, Word } from "../types";
import { shuffle, type Rng } from "./rng";
import { generateWordOptions, generateSentenceOptions } from "./distractors";

// Module-end test builder (Nick, 2026-08-10 — in the spirit of
// howtostudykorean's unit tests). Pure: content in, question list out, so the
// composition rules are testable. Every answer is graded through
// logDrillResult by the component, so a test doubles as scheduled practice —
// wrong answers come back in the review queue.

export const PASS_PCT = 80;

/** Question mix per attempt (each retake re-samples, so tests vary). */
export const TEST_SHAPE = {
  wordMeaning: 4, // ko → pick the English
  wordPick: 4, // English → pick the Korean
  sentence: 4, // ko sentence → pick the translation
  typing: 3, // English → type the Korean
} as const;

export type TestQuestion =
  | { key: string; kind: "wordMeaning"; item: Word; options: Word[] }
  | { key: string; kind: "wordPick"; item: Word; options: Word[] }
  | { key: string; kind: "sentence"; item: Sentence; options: Sentence[] }
  | { key: string; kind: "typing"; item: Word };

/** Words a module can test: its own checklist, particles excluded (they are
 *  glue, drilled through sentences, and their `en` glosses collide). */
export function testableWords(module: Module, wordById: Map<string, Word>) {
  return module.wordIds
    .map((id) => wordById.get(id))
    .filter((w): w is Word => !!w && w.pos !== "particle");
}

/** Builds one test attempt. Returns [] for modules with nothing to test
 *  (interludes). MCQ distractors come from the module's own words when it
 *  has enough — thematically close options make a fairer test — falling
 *  back to the full pool for tiny modules. */
export function buildModuleTest(
  module: Module,
  wordById: Map<string, Word>,
  sentenceById: Map<string, Sentence>,
  allWords: Word[],
  allSentences: Sentence[],
  rng: Rng = Math.random,
): TestQuestion[] {
  const words = shuffle(testableWords(module, wordById), rng);
  const sentences = shuffle(
    module.sentenceIds
      .map((id) => sentenceById.get(id))
      .filter((s): s is Sentence => !!s),
    rng,
  );
  if (words.length === 0) return [];

  // Distinct-en pool for word MCQs; a module supplies its own distractors
  // when it can, otherwise the whole course pitches in.
  const wordPool = words.length >= 8 ? words : allWords;
  const sentencePool = sentences.length >= 4 ? sentences : allSentences;

  const out: TestQuestion[] = [];
  let cursor = 0;
  const nextWords = (n: number) => {
    const slice = words.slice(cursor, cursor + n);
    cursor = Math.min(cursor + n, words.length);
    return slice;
  };

  for (const w of nextWords(TEST_SHAPE.wordMeaning))
    out.push({
      key: `wordMeaning:${w.id}`,
      kind: "wordMeaning",
      item: w,
      options: generateWordOptions(w, wordPool, rng),
    });
  for (const w of nextWords(TEST_SHAPE.wordPick))
    out.push({
      key: `wordPick:${w.id}`,
      kind: "wordPick",
      item: w,
      options: generateWordOptions(w, wordPool, rng),
    });
  for (const w of nextWords(TEST_SHAPE.typing))
    out.push({ key: `typing:${w.id}`, kind: "typing", item: w });
  // Sentences close the test — recognition, production, then synthesis (and
  // the last question is always a choice, so "See results" can label it).
  for (const s of sentences.slice(0, TEST_SHAPE.sentence))
    out.push({
      key: `sentence:${s.id}`,
      kind: "sentence",
      item: s,
      options: generateSentenceOptions(s, sentencePool, rng),
    });

  return out;
}

/** The DrillKind an answer is logged under — word questions of both
 *  directions track the same per-word "word" card. */
export function drillKindFor(q: TestQuestion) {
  if (q.kind === "sentence") return "anatomy" as const;
  if (q.kind === "typing") return "typing" as const;
  return "word" as const;
}

export function scorePct(correct: number, total: number): number {
  return total === 0 ? 0 : Math.round((correct / total) * 100);
}
