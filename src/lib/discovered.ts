import type { GapItem, SavedTranslation } from "../types";

// Translator save-to-deck (PROJECT.md §5): a saved discovery whose
// literal_gap is non-empty files itself into the Gap deck automatically.
// Discovered items live in Dexie, not /src/content, so they're converted
// to GapItem shape at read time with a "disc_" id prefix.

export const DISCOVERED_PREFIX = "disc_";

export function discoveredGapItem(t: SavedTranslation): GapItem | null {
  if (t.id === undefined || !t.result.literal_gap.trim()) return null;
  const lit = t.result.gloss
    .map((g) => g.gloss)
    .filter(Boolean)
    .join(" ");
  return {
    id: `${DISCOVERED_PREFIX}${t.id}`,
    ko: t.result.korean,
    rom: t.result.romanization,
    lit: lit || t.result.korean,
    real: t.result.natural_english,
    note: t.result.literal_gap,
    cat: "phrase",
  };
}

/** All saved translations that qualify for the Gap deck. */
export function discoveredGapItems(saved: SavedTranslation[]): GapItem[] {
  return saved
    .map(discoveredGapItem)
    .filter((g): g is GapItem => g !== null);
}
