// Data model — PROJECT.md §4, with additive fields noted in TASKS.md.

// Shared primitives
export type Role = "subject" | "object" | "place" | "verb" | "other";
export type FontFace = "gothic" | "myeongjo" | "hand";
export type DrillKind =
  | "confusable"
  | "anatomy"
  | "gap"
  | "font"
  | "typing"
  | "word"; // vocab meaning MCQ — introduced with module tests (2026-08-10)

export interface Word {
  id: string; // "w_mul"
  ko: string; // 물
  rom: string; // mul
  en: string; // water
  pos: "noun" | "verb" | "adj" | "particle" | "phrase";
  moduleId: string; // which module introduces it
  notes?: string;
}

export interface Chunk {
  id: string;
  t: string; // empty string = droppable (understood-from-context) chunk
  role: Role;
}

export interface Sentence {
  id: string;
  en: Chunk[]; // natural English order
  gloss: Chunk[]; // Korean order, particles as suffixes
  ko: Chunk[]; // Korean, aligned by chunk id
  rom?: string; // full-sentence romanization (secondary, hideable)
  wordIds: string[]; // MUST all be in learner's known set to be shown
  note: string;
}

export interface ConfusableItem {
  id: string;
  c: string;
  r: string;
  group: "compound" | "vowel" | "consonant" | "tense";
  note: string; // the distinguishing feature
}

export interface GapItem {
  // literal-vs-real
  id: string;
  ko: string;
  rom: string;
  lit: string;
  real: string;
  note: string;
  cat: "structure" | "phrase" | "concept";
}

export interface Module {
  id: string;
  title: string;
  order: number;
  ring?: number; // CURRICULUM.md ring (1 beginner / 2 intermediate / 3 advanced); absent = 1
  contentMd: string; // path to markdown
  wordIds: string[]; // vocab unlocked on completion
  sentenceIds: string[];
}

// Cross-font reader content
export interface FontFaceInfo {
  key: FontFace;
  ko: string; // 고딕
  en: string; // Gothic
  use: string; // apps · screens · signage
}

export interface FontLetterRow {
  id: string;
  c: string;
  r: string;
  note: string; // what changes across faces
}

// Learner state (Dexie)
export interface KnownWord {
  wordId: string;
  learnedAt: number;
}

export interface DrillResult {
  id?: number; // auto-increment
  itemId: string;
  kind: DrillKind;
  correct: boolean;
  at: number;
  face?: FontFace; // set when the prompt rendered in a non-default face
}

export interface SrsCard {
  // Phase A.2 — scheduled by FSRS (src/lib/srs.ts). The §4 base fields keep
  // their meaning: interval = scheduled days, ease = FSRS difficulty,
  // due = epoch ms. The optional fields are FSRS state, additive per the
  // TASKS.md convention; absent values default to a brand-new card.
  itemId: string;
  kind: DrillKind;
  interval: number;
  ease: number;
  due: number;
  lapses: number;
  stability?: number;
  elapsedDays?: number;
  reps?: number;
  learningSteps?: number;
  state?: 0 | 1 | 2 | 3; // New | Learning | Review | Relearning
  lastReview?: number;
}

// Translator contract (Phase A.3 — schema ships early so client code stays typed)
export interface TranslationResult {
  direction: "en-to-ko" | "ko-to-en";
  korean: string;
  romanization: string;
  natural_english: string;
  gloss: { chunk: string; gloss: string; role: Role }[];
  particles: { particle: string; job: string }[];
  literal_gap: string;
  cultural_note: string;
}

export interface SavedTranslation {
  id?: number;
  savedAt: number;
  result: TranslationResult;
}

// Module-test outcomes (one row per module; best score sticks)
export interface ModuleTestResult {
  moduleId: string;
  bestPct: number; // 0–100, highest score ever
  lastPct: number; // most recent attempt
  attempts: number;
  at: number; // when the last attempt finished
}

// Settings persisted by the zustand store (also embedded in export backups)
export interface PersistedSettings {
  romanizationVisible: boolean;
  theme: "system" | "light" | "dark";
  audioEnabled: boolean;
  speechRate: number;
  onboardingDone: boolean;
  hangulDone: boolean;
}

export interface ExportSnapshot {
  version: 1;
  exportedAt: number;
  settings: PersistedSettings;
  tables: {
    knownWords: KnownWord[];
    drillResults: DrillResult[];
    srsCards: SrsCard[];
    savedTranslations: SavedTranslation[];
    moduleTests?: ModuleTestResult[]; // optional — pre-test backups still import
  };
}
