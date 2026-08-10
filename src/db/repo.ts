import { db } from "./db";
import { applyAnswer } from "../lib/srs";
import type {
  DrillKind,
  DrillResult,
  ExportSnapshot,
  FontFace,
  PersistedSettings,
  TranslationResult,
} from "../types";

// All writes to learner state go through here. Writes happen only from
// explicit user events (never render effects) — StrictMode-safe.

/** Idempotent: re-checking a known word just refreshes learnedAt. */
export function markWordKnown(wordId: string) {
  return db.knownWords.put({ wordId, learnedAt: Date.now() });
}

export function unmarkWordKnown(wordId: string) {
  return db.knownWords.delete(wordId);
}

/** Bulk pre-marking (placement quiz) — idempotent like markWordKnown. */
export function markWordsKnown(wordIds: string[]) {
  const at = Date.now();
  return db.knownWords.bulkPut(
    wordIds.map((wordId) => ({ wordId, learnedAt: at })),
  );
}

/** The one grading funnel: records the result row AND moves the item's
 *  SRS card (creating it on first sight), atomically. Every drill and the
 *  Review session answer through here, so everything drilled is scheduled. */
export function logDrillResult(opts: {
  kind: DrillKind;
  itemId: string;
  correct: boolean;
  face?: FontFace;
}) {
  const row: DrillResult = { ...opts, at: Date.now() };
  return db.transaction("rw", [db.drillResults, db.srsCards], async () => {
    await db.drillResults.add(row);
    const existing = await db.srsCards.get([opts.kind, opts.itemId]);
    await db.srsCards.put(
      applyAnswer(existing, opts.kind, opts.itemId, opts.correct),
    );
  });
}

/** Records a finished module test: last score always updates, best sticks. */
export function recordModuleTest(moduleId: string, pct: number) {
  return db.transaction("rw", db.moduleTests, async () => {
    const prior = await db.moduleTests.get(moduleId);
    await db.moduleTests.put({
      moduleId,
      bestPct: Math.max(pct, prior?.bestPct ?? 0),
      lastPct: pct,
      attempts: (prior?.attempts ?? 0) + 1,
      at: Date.now(),
    });
  });
}

export function saveTranslation(result: TranslationResult) {
  return db.savedTranslations.add({ savedAt: Date.now(), result });
}

export function deleteTranslation(id: number) {
  return db.savedTranslations.delete(id);
}

export async function snapshot(
  settings: PersistedSettings,
): Promise<ExportSnapshot> {
  const [knownWords, drillResults, srsCards, savedTranslations, moduleTests] =
    await Promise.all([
      db.knownWords.toArray(),
      db.drillResults.toArray(),
      db.srsCards.toArray(),
      db.savedTranslations.toArray(),
      db.moduleTests.toArray(),
    ]);
  return {
    version: 1,
    exportedAt: Date.now(),
    settings,
    tables: { knownWords, drillResults, srsCards, savedTranslations, moduleTests },
  };
}

/** Replaces ALL learner state with the snapshot's tables, atomically.
 *  Settings restoration is the caller's job (it lives outside Dexie). */
export async function restore(snap: ExportSnapshot) {
  await db.transaction(
    "rw",
    [
      db.knownWords,
      db.drillResults,
      db.srsCards,
      db.savedTranslations,
      db.moduleTests,
    ],
    async () => {
      await Promise.all([
        db.knownWords.clear(),
        db.drillResults.clear(),
        db.srsCards.clear(),
        db.savedTranslations.clear(),
        db.moduleTests.clear(),
      ]);
      await Promise.all([
        db.knownWords.bulkAdd(snap.tables.knownWords),
        db.drillResults.bulkAdd(snap.tables.drillResults),
        db.srsCards.bulkAdd(snap.tables.srsCards),
        db.savedTranslations.bulkAdd(snap.tables.savedTranslations),
        db.moduleTests.bulkAdd(snap.tables.moduleTests ?? []),
      ]);
    },
  );
}
