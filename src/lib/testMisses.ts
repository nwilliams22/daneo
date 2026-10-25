import type { DrillKind, Sentence, TestMiss, Word } from "../types";
import { sentenceEnglish } from "./distractors";

// Module-test misses (Nick, 2026-10-25). A test's wrong answers were always
// scheduled into the review queue, but nothing showed the learner WHAT the
// test caught. This list is that visible copy: written once per attempt,
// cleared item by item as each one comes back correct (db/repo.ts), and the
// pool the module's "practice these" session draws from.

function sentenceKorean(s: Sentence): string {
  return s.ko.map((c) => c.t).filter(Boolean).join(" ");
}

/** Kinds that stand for a word — these flag a row on the vocab checklist. */
const WORD_KINDS: DrillKind[] = ["word", "typing"];

export function isWordMiss(miss: TestMiss): boolean {
  return WORD_KINDS.includes(miss.kind);
}

export function missKey(kind: DrillKind, itemId: string): string {
  return `${kind}:${itemId}`;
}

/** One entry per card: a single attempt can test the same word twice. */
export function dedupeMisses(misses: TestMiss[]): TestMiss[] {
  const seen = new Set<string>();
  return misses.filter((m) => {
    const key = missKey(m.kind, m.itemId);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function withoutMiss(
  misses: TestMiss[],
  kind: DrillKind,
  itemId: string,
): TestMiss[] {
  return misses.filter((m) => !(m.kind === kind && m.itemId === itemId));
}

/** Words to mark "practice" in the module checklist — the checks themselves
 *  stay as they are: ticked means studied, not proven (gating depends on it). */
export function missedWordIds(misses: TestMiss[] = []): Set<string> {
  return new Set(misses.filter(isWordMiss).map((m) => m.itemId));
}

/** A miss as the shared missed-items strip renders it. */
export interface MissView {
  id: string;
  big: string; // Korean
  small: string; // the meaning they didn't have
}

/** Renderable misses, skipping any whose item has left the content. */
export function missViews(
  misses: TestMiss[] = [],
  wordById: Map<string, Word>,
  sentenceById: Map<string, Sentence>,
): MissView[] {
  const out: MissView[] = [];
  for (const m of dedupeMisses(misses)) {
    const id = missKey(m.kind, m.itemId);
    if (isWordMiss(m)) {
      const w = wordById.get(m.itemId);
      if (w) out.push({ id, big: w.ko, small: w.en });
    } else {
      const s = sentenceById.get(m.itemId);
      if (s) out.push({ id, big: sentenceKorean(s), small: sentenceEnglish(s) });
    }
  }
  return out;
}
