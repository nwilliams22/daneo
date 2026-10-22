import gapJson from "../content/gap.json";
import { gapSchema } from "./schemas";
import type { TranslationResult } from "../types";

const reviewedGaps = gapSchema.array().parse(gapJson);
const wordCharacter = /[\p{L}\p{M}\p{N}_]/u;

/** Literal alternatives only; no inferred inflections, placeholders or suffix rules. */
export function gapAlternatives(pattern: string): string[] {
  if (/[-○→~]|\bvs\b/u.test(pattern)) return [];
  return pattern.split(/\s*[/·]\s*/u)
    .map(alternative => alternative.trim())
    .filter(alternative => alternative !== "");
}

// Longest literal surface wins: a specific phrase beats a contained generic word.
// Equal-length matches use ascending entry ID (code-unit order), then alternative,
// so duplicate patterns and input order never depend on the JSON iteration order.
const patterns = reviewedGaps.flatMap(entry =>
  gapAlternatives(entry.ko).map(surface => ({ entry, surface })))
  .sort((a, b) => b.surface.length - a.surface.length ||
    (a.entry.id < b.entry.id ? -1 : a.entry.id > b.entry.id ? 1 : 0) ||
    (a.surface < b.surface ? -1 : a.surface > b.surface ? 1 : 0));

function containsLiteral(input: string, surface: string): boolean {
  let start = input.indexOf(surface);
  while (start !== -1) {
    // Unicode letters, combining marks and numbers cannot adjoin a match.
    // This deliberately misses attached particles rather than guessing morphology.
    const before = Array.from(input.slice(0, start)).at(-1) ?? "";
    const after = Array.from(input.slice(start + surface.length))[0] ?? "";
    if (!wordCharacter.test(before) && !wordCharacter.test(after)) return true;
    start = input.indexOf(surface, start + 1);
  }
  return false;
}

/** Return the winning reviewed row, retaining the exact source strings. */
export function findReviewedGap(input: string) {
  const entry = patterns.find(({ surface }) => containsLiteral(input, surface))?.entry;
  return entry ? { ...entry } : undefined;
}

/** The arrow is presentation only; both contrast sides and the note are verbatim. */
export function lookupGap(input: string): Pick<TranslationResult, "literal_gap" | "cultural_note"> {
  const entry = findReviewedGap(input);
  return entry
    ? { literal_gap: `${entry.lit} → ${entry.real}`, cultural_note: entry.note }
    : { literal_gap: "", cultural_note: "" };
}
