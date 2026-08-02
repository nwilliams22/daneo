import type { KnownWord, Module, Sentence, Word } from "../types";

// Word-first gating (PROJECT.md §1 rule 1) — the sentence engine never shows
// a sentence containing a word the learner hasn't marked as learned.

export function knownSet(known: KnownWord[]): Set<string> {
  return new Set(known.map((k) => k.wordId));
}

export function moduleProgress(
  module: Module,
  known: Set<string>,
): { done: number; total: number } {
  const done = module.wordIds.filter((id) => known.has(id)).length;
  return { done, total: module.wordIds.length };
}

/** A module with no vocab (e.g. the Hangul history reading) counts as complete. */
export function isModuleComplete(module: Module, known: Set<string>): boolean {
  return module.wordIds.every((id) => known.has(id));
}

/** Sentences whose every word is known. */
export function unlockedSentences(
  sentences: Sentence[],
  known: Set<string>,
): Sentence[] {
  return sentences.filter((s) => s.wordIds.every((id) => known.has(id)));
}

/** Words the learner has marked known (e.g. the typing-drill pool). */
export function unlockedWords(words: Word[], known: Set<string>): Word[] {
  return words.filter((w) => known.has(w.id));
}
