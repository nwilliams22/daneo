import type { DrillKind, DrillResult, FontFace } from "../types";

// Pure derivations over DrillResult rows — the dashboard and the unified
// Review area are just views over these.

export interface MissedRef {
  kind: DrillKind;
  itemId: string;
}

const keyOf = (r: { kind: DrillKind; itemId: string }) =>
  `${r.kind}:${r.itemId}`;

/** Items whose LATEST result is wrong — answering correctly later clears
 *  an item from review. */
export function currentlyMissed(results: DrillResult[]): MissedRef[] {
  const latest = new Map<string, DrillResult>();
  for (const r of results) {
    const k = keyOf(r);
    const prev = latest.get(k);
    if (!prev || r.at >= prev.at) latest.set(k, r);
  }
  return [...latest.values()]
    .filter((r) => !r.correct)
    .sort((a, b) => b.at - a.at)
    .map((r) => ({ kind: r.kind, itemId: r.itemId }));
}

/** Word-kind misses bucketed by owning module — the Review strip gives each
 *  module's missed vocab one card whose re-drill is that module's test.
 *  Preserves input order within a module (newest miss first, per
 *  currentlyMissed); misses that resolve to no module are dropped. */
export function missedWordsByModule(
  missed: MissedRef[],
  moduleOf: (itemId: string) => string | undefined,
): Map<string, string[]> {
  const byModule = new Map<string, string[]>();
  for (const m of missed) {
    if (m.kind !== "word") continue;
    const moduleId = moduleOf(m.itemId);
    if (!moduleId) continue;
    const list = byModule.get(moduleId) ?? [];
    list.push(m.itemId);
    byModule.set(moduleId, list);
  }
  return byModule;
}

export interface Accuracy {
  seen: number;
  correct: number;
  pct: number;
}

export function accuracy(
  results: DrillResult[],
  sinceMs?: number,
): Accuracy {
  const rows =
    sinceMs === undefined ? results : results.filter((r) => r.at >= sinceMs);
  const correct = rows.filter((r) => r.correct).length;
  return {
    seen: rows.length,
    correct,
    pct: rows.length ? Math.round((correct / rows.length) * 100) : 0,
  };
}

export interface ItemStats {
  kind: DrillKind;
  itemId: string;
  attempts: number;
  correct: number;
  pct: number;
  lastAt: number;
}

export function itemStats(results: DrillResult[]): ItemStats[] {
  const byItem = new Map<string, ItemStats>();
  for (const r of results) {
    const k = keyOf(r);
    const s =
      byItem.get(k) ??
      ({
        kind: r.kind,
        itemId: r.itemId,
        attempts: 0,
        correct: 0,
        pct: 0,
        lastAt: 0,
      } satisfies ItemStats);
    s.attempts += 1;
    if (r.correct) s.correct += 1;
    s.lastAt = Math.max(s.lastAt, r.at);
    byItem.set(k, s);
  }
  for (const s of byItem.values())
    s.pct = Math.round((s.correct / s.attempts) * 100);
  return [...byItem.values()];
}

/** Lowest-accuracy items with enough attempts to mean something. */
export function weakestItems(
  results: DrillResult[],
  minAttempts = 3,
  top = 5,
): ItemStats[] {
  return itemStats(results)
    .filter((s) => s.attempts >= minAttempts)
    .sort((a, b) => a.pct - b.pct || b.attempts - a.attempts)
    .slice(0, top);
}

/** Accuracy per group for a keyed subset of items (e.g. confusable groups). */
export function accuracyByGroup(
  results: DrillResult[],
  kind: DrillKind,
  groupOf: (itemId: string) => string | undefined,
): { group: string; seen: number; correct: number; pct: number }[] {
  const groups = new Map<string, { seen: number; correct: number }>();
  for (const r of results) {
    if (r.kind !== kind) continue;
    const g = groupOf(r.itemId);
    if (!g) continue;
    const s = groups.get(g) ?? { seen: 0, correct: 0 };
    s.seen += 1;
    if (r.correct) s.correct += 1;
    groups.set(g, s);
  }
  return [...groups.entries()].map(([group, s]) => ({
    group,
    ...s,
    pct: Math.round((s.correct / s.seen) * 100),
  }));
}

export function accuracyByFace(
  results: DrillResult[],
): { face: FontFace; seen: number; correct: number; pct: number }[] {
  const faces = new Map<FontFace, { seen: number; correct: number }>();
  for (const r of results) {
    if (!r.face) continue;
    const s = faces.get(r.face) ?? { seen: 0, correct: 0 };
    s.seen += 1;
    if (r.correct) s.correct += 1;
    faces.set(r.face, s);
  }
  return [...faces.entries()].map(([face, s]) => ({
    face,
    ...s,
    pct: Math.round((s.correct / s.seen) * 100),
  }));
}
