import { db } from "./db";
import type {
  DrillKind,
  DrillResult,
  ExportSnapshot,
  FontFace,
  PersistedSettings,
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

export function logDrillResult(opts: {
  kind: DrillKind;
  itemId: string;
  correct: boolean;
  face?: FontFace;
}) {
  const row: DrillResult = { ...opts, at: Date.now() };
  return db.drillResults.add(row);
}

export async function snapshot(
  settings: PersistedSettings,
): Promise<ExportSnapshot> {
  const [knownWords, drillResults, srsCards, savedTranslations] =
    await Promise.all([
      db.knownWords.toArray(),
      db.drillResults.toArray(),
      db.srsCards.toArray(),
      db.savedTranslations.toArray(),
    ]);
  return {
    version: 1,
    exportedAt: Date.now(),
    settings,
    tables: { knownWords, drillResults, srsCards, savedTranslations },
  };
}

/** Replaces ALL learner state with the snapshot's tables, atomically.
 *  Settings restoration is the caller's job (it lives outside Dexie). */
export async function restore(snap: ExportSnapshot) {
  await db.transaction(
    "rw",
    [db.knownWords, db.drillResults, db.srsCards, db.savedTranslations],
    async () => {
      await Promise.all([
        db.knownWords.clear(),
        db.drillResults.clear(),
        db.srsCards.clear(),
        db.savedTranslations.clear(),
      ]);
      await Promise.all([
        db.knownWords.bulkAdd(snap.tables.knownWords),
        db.drillResults.bulkAdd(snap.tables.drillResults),
        db.srsCards.bulkAdd(snap.tables.srsCards),
        db.savedTranslations.bulkAdd(snap.tables.savedTranslations),
      ]);
    },
  );
}
