import Dexie, { type EntityTable, type Table } from "dexie";
import type {
  KnownWord,
  DrillResult,
  SrsCard,
  SavedTranslation,
} from "../types";

// Learner state lives here (content ships as static JSON in /src/content).
// srsCards and savedTranslations are reserved for Phases A.2 / A.3 — the
// schema exists now so those features arrive without a migration.
export const db = new Dexie("daneo") as Dexie & {
  knownWords: EntityTable<KnownWord, "wordId">;
  drillResults: EntityTable<DrillResult, "id">;
  srsCards: Table<SrsCard, [string, string]>;
  savedTranslations: EntityTable<SavedTranslation, "id">;
};

db.version(1).stores({
  knownWords: "wordId, learnedAt",
  drillResults: "++id, kind, itemId, at, [kind+itemId], [kind+at]",
  srsCards: "[kind+itemId], due, kind",
  savedTranslations: "++id, savedAt",
});
