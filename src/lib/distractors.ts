import type { ConfusableItem, GapItem } from "../types";
import { shuffle, type Rng } from "./rng";

// Pedagogy rule 2 (PROJECT.md §1): confusables are trained as CONTRASTS —
// quiz distractors come from the same confusable group, never random,
// whenever the group can support it (§6.2).

/** Returns 4 shuffled options (answer included). Distractors share the
 *  target's group when ≥3 same-group candidates exist; roman values are
 *  always distinct so exactly one option is correct. */
export function generateConfusableOptions(
  target: ConfusableItem,
  pool: ConfusableItem[],
  rng: Rng = Math.random,
): ConfusableItem[] {
  const others = pool.filter((x) => x.id !== target.id);
  const sameGroup = others.filter((x) => x.group === target.group);
  const primary = sameGroup.length >= 3 ? sameGroup : others;

  const distractors: ConfusableItem[] = [];
  const usedRom = new Set([target.r]);
  const take = (source: ConfusableItem[]) => {
    for (const d of shuffle(source, rng)) {
      if (distractors.length === 3) return;
      if (usedRom.has(d.r)) continue;
      usedRom.add(d.r);
      distractors.push(d);
    }
  };
  take(primary);
  if (distractors.length < 3) take(others); // same-group roms exhausted — fill from everything

  return shuffle([target, ...distractors], rng);
}

/** Gap quiz options: 4 items with pairwise-distinct "real" meanings. */
export function generateGapOptions(
  target: GapItem,
  pool: GapItem[],
  rng: Rng = Math.random,
): GapItem[] {
  const others = pool.filter((x) => x.id !== target.id);
  const distractors: GapItem[] = [];
  const usedReal = new Set([target.real]);
  for (const d of shuffle(others, rng)) {
    if (distractors.length === 3) break;
    if (usedReal.has(d.real)) continue;
    usedReal.add(d.real);
    distractors.push(d);
  }
  return shuffle([target, ...distractors], rng);
}
