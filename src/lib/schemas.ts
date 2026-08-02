import { z } from "zod";

// Mirrors types.ts (§4). Content JSON is parsed against these once at load;
// malformed content fails fast with a readable zod error.

export const roleSchema = z.enum([
  "subject",
  "object",
  "place",
  "verb",
  "other",
]);

export const fontFaceSchema = z.enum(["gothic", "myeongjo", "hand"]);

export const drillKindSchema = z.enum([
  "confusable",
  "anatomy",
  "gap",
  "font",
  "typing",
]);

export const wordSchema = z.object({
  id: z.string().min(1),
  ko: z.string().min(1),
  rom: z.string().min(1),
  en: z.string().min(1),
  pos: z.enum(["noun", "verb", "adj", "particle", "phrase"]),
  moduleId: z.string().min(1),
  notes: z.string().optional(),
});

export const chunkSchema = z.object({
  id: z.string().min(1),
  t: z.string(), // "" = droppable (understood-from-context) chunk
  role: roleSchema,
});

export const sentenceSchema = z.object({
  id: z.string().min(1),
  en: z.array(chunkSchema).min(1),
  gloss: z.array(chunkSchema).min(1),
  ko: z.array(chunkSchema).min(1),
  rom: z.string().optional(),
  wordIds: z.array(z.string().min(1)).min(1),
  note: z.string(),
});

export const confusableSchema = z.object({
  id: z.string().min(1),
  c: z.string().min(1),
  r: z.string().min(1),
  group: z.enum(["compound", "vowel", "consonant", "tense"]),
  note: z.string(),
});

export const gapSchema = z.object({
  id: z.string().min(1),
  ko: z.string().min(1),
  rom: z.string().min(1),
  lit: z.string().min(1),
  real: z.string().min(1),
  note: z.string(),
  cat: z.enum(["structure", "phrase", "concept"]),
});

export const moduleSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  order: z.number().int().positive(),
  contentMd: z.string().min(1),
  wordIds: z.array(z.string().min(1)),
  sentenceIds: z.array(z.string().min(1)),
});

export const fontFaceInfoSchema = z.object({
  key: fontFaceSchema,
  ko: z.string().min(1),
  en: z.string().min(1),
  use: z.string().min(1),
});

export const fontLetterRowSchema = z.object({
  id: z.string().min(1),
  c: z.string().min(1),
  r: z.string().min(1),
  note: z.string().min(1),
});

export const fontFacesContentSchema = z.object({
  faces: z.array(fontFaceInfoSchema).length(3),
  letters: z.array(fontLetterRowSchema).min(1),
  words: z.array(z.string().min(1)).min(1),
});

/** Everything validateContent() operates on. */
export const contentBundleSchema = z.object({
  words: z.array(wordSchema),
  sentences: z.array(sentenceSchema),
  confusables: z.array(confusableSchema),
  gap: z.array(gapSchema),
  modules: z.array(moduleSchema),
  fontFaces: fontFacesContentSchema,
});

export type ContentBundle = z.infer<typeof contentBundleSchema>;

// Translator contract (Phase A.3 — ships early so client code is typed; §6.3)
export const translationResultSchema = z.object({
  direction: z.enum(["en-to-ko", "ko-to-en"]),
  korean: z.string().min(1),
  romanization: z.string(),
  natural_english: z.string().min(1),
  gloss: z.array(
    z.object({
      chunk: z.string(),
      gloss: z.string(),
      role: roleSchema,
    }),
  ),
  particles: z.array(
    z.object({
      particle: z.string(),
      job: z.string(),
    }),
  ),
  literal_gap: z.string(),
  cultural_note: z.string(),
});

// Export/import snapshot (backup files)
export const exportSnapshotSchema = z.object({
  version: z.literal(1),
  exportedAt: z.number(),
  settings: z.object({
    romanizationVisible: z.boolean(),
    theme: z.enum(["system", "light", "dark"]),
    audioEnabled: z.boolean(),
    speechRate: z.number(),
    onboardingDone: z.boolean(),
    hangulDone: z.boolean(),
  }),
  tables: z.object({
    knownWords: z.array(
      z.object({ wordId: z.string(), learnedAt: z.number() }),
    ),
    drillResults: z.array(
      z.object({
        id: z.number().optional(),
        itemId: z.string(),
        kind: drillKindSchema,
        correct: z.boolean(),
        at: z.number(),
        face: fontFaceSchema.optional(),
      }),
    ),
    srsCards: z.array(
      z.object({
        itemId: z.string(),
        kind: drillKindSchema,
        interval: z.number(),
        ease: z.number(),
        due: z.number(),
        lapses: z.number(),
        // FSRS state (Phase A.2) — optional so pre-A.2 backups still import
        stability: z.number().optional(),
        elapsedDays: z.number().optional(),
        reps: z.number().optional(),
        learningSteps: z.number().optional(),
        state: z.union([
          z.literal(0),
          z.literal(1),
          z.literal(2),
          z.literal(3),
        ]).optional(),
        lastReview: z.number().optional(),
      }),
    ),
    savedTranslations: z.array(
      z.object({
        id: z.number().optional(),
        savedAt: z.number(),
        result: translationResultSchema,
      }),
    ),
  }),
});
