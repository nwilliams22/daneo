import { decomposeSyllable } from "./hangul/jamo";
import type { Chunk, ConfusableItem } from "../types";

// "Why was I wrong" feedback (TASKS.md 2026-08-02, Nick): a wrong answer
// explains BOTH sides — the correct item and the mistake itself. This module
// is the pure half: a jamo-aware diff for typed answers, a confusable-pair
// lookup that turns a jamo mix-up into its contrast note, and the arrange-mode
// mismatch finder. Rendering lives in the drill components.

export type SlotKey = "cho" | "jung" | "jong";

export interface JamoDiff {
  slot: SlotKey;
  /** "" = the learner's syllable has nothing in this slot (e.g. no batchim). */
  typed: string;
  /** "" = the slot should be empty. */
  answer: string;
}

export type DiffOp =
  | { type: "match"; ch: string }
  | { type: "sub"; typed: string; answer: string; jamo: JamoDiff[] }
  | { type: "extra"; typed: string }
  | { type: "missing"; answer: string };

function jamoDiffs(typed: string, answer: string): JamoDiff[] {
  const dt = decomposeSyllable(typed);
  const da = decomposeSyllable(answer);
  if (!dt || !da) return [];
  const out: JamoDiff[] = [];
  for (const slot of ["cho", "jung", "jong"] as const)
    if (dt[slot] !== da[slot])
      out.push({ slot, typed: dt[slot], answer: da[slot] });
  return out;
}

/** Character-level edit script from what was typed to the correct spelling.
 *  Substituted Hangul syllables carry their per-slot jamo differences, so
 *  "ㅐ where ㅔ goes" and "missing batchim ㄹ" fall out directly. Alignment
 *  is Levenshtein, so a dropped or extra syllable doesn't cascade into
 *  every later syllable reading as wrong. */
export function diffTyping(typed: string, answer: string): DiffOp[] {
  const t = [...typed];
  const a = [...answer];
  const n = t.length;
  const m = a.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    Array.from({ length: m + 1 }, () => 0),
  );
  for (let i = 0; i <= n; i++) dp[i]![0] = i;
  for (let j = 0; j <= m; j++) dp[0]![j] = j;
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++)
      dp[i]![j] = Math.min(
        dp[i - 1]![j - 1]! + (t[i - 1] === a[j - 1] ? 0 : 1),
        dp[i - 1]![j]! + 1,
        dp[i]![j - 1]! + 1,
      );

  // Backtrace from the end, preferring extra/missing over a match on ties so
  // a doubled syllable reads as "extra 요 at the end", not one in the middle.
  const ops: DiffOp[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && dp[i]![j] === dp[i - 1]![j]! + 1) {
      ops.unshift({ type: "extra", typed: t[i - 1]! });
      i--;
    } else if (j > 0 && dp[i]![j] === dp[i]![j - 1]! + 1) {
      ops.unshift({ type: "missing", answer: a[j - 1]! });
      j--;
    } else {
      const tc = t[i - 1]!;
      const ac = a[j - 1]!;
      ops.unshift(
        tc === ac
          ? { type: "match", ch: tc }
          : { type: "sub", typed: tc, answer: ac, jamo: jamoDiffs(tc, ac) },
      );
      i--;
      j--;
    }
  }
  return ops;
}

/** When a typed-jamo mistake is one of the app's trained confusable pairs
 *  (same group), return both items so the UI can attach the contrast note —
 *  e.g. ㅐ for ㅔ → "the merged-sound pair". */
export function jamoContrast(
  typedJamo: string,
  answerJamo: string,
  pool: ConfusableItem[],
): { typed: ConfusableItem; answer: ConfusableItem } | null {
  const typed = pool.find((c) => c.c === typedJamo);
  const answer = pool.find((c) => c.c === answerJamo);
  return typed && answer && typed.group === answer.group
    ? { typed, answer }
    : null;
}

/** First slot where the arranged sentence diverges from the answer.
 *  Callers only check equal-length arrangements, so a bare index compare
 *  is enough; null = no divergence. */
export function firstArrangeMismatch(
  placed: Chunk[],
  answer: Chunk[],
): { index: number; placed: Chunk; answer: Chunk } | null {
  for (let i = 0; i < answer.length; i++) {
    const p = placed[i];
    const a = answer[i];
    if (!p || !a) return null;
    if (p.t !== a.t) return { index: i, placed: p, answer: a };
  }
  return null;
}
