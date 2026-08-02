import type { ConfusableItem, Sentence, Word } from "../types";
import { shuffle, type Rng } from "./rng";
import {
  generateConfusableOptions,
  generateSentenceOptions,
  generateWordOptions,
} from "./distractors";

// Placement-quiz onboarding (TASKS.md 2026-08-01, Nick): instead of the
// yes/no "can you read Hangul?", a short adaptive quiz places the learner.
// Three stages, each gating the next — fail a stage and the quiz stops
// there. Pure logic; the Onboarding UI just renders it.
//
//   hangul (5 glyph→sound)   → proves reading      → collapses the alphabet
//   vocab  (6 word→meaning)  → proves M1 bricks    → pre-checks M1 vocab
//   glue   (4 sentence→gist) → proves M1 sentences → start at Module 2

export type PlacementStage = "hangul" | "vocab" | "glue";

export type PlacementQuestion =
  | { stage: "hangul"; item: ConfusableItem; options: ConfusableItem[] }
  | { stage: "vocab"; word: Word; options: Word[] }
  | { stage: "glue"; sentence: Sentence; options: Sentence[] };

export interface PlacementQuiz {
  hangul: PlacementQuestion[];
  vocab: PlacementQuestion[];
  glue: PlacementQuestion[];
}

/** Correct answers needed to pass each stage (out of its question count). */
export const PLACEMENT_PASS: Record<PlacementStage, number> = {
  hangul: 4, // of 5
  vocab: 5, // of 6
  glue: 3, // of 4
};

export const PLACEMENT_COUNT: Record<PlacementStage, number> = {
  hangul: 5,
  vocab: 6,
  glue: 4,
};

/** Build the full question set up front (stages are revealed adaptively).
 *  Hangul samples one glyph per confusable group so the five questions
 *  span basic vowels through tense consonants. */
export function buildPlacementQuiz(opts: {
  confusables: ConfusableItem[];
  words: Word[]; // Module 1 checklist words (non-particle)
  sentences: Sentence[]; // Module 1 sentences
  rng?: Rng;
}): PlacementQuiz {
  const { confusables, words, sentences, rng = Math.random } = opts;

  const groups = ["vowel", "consonant", "compound", "tense"] as const;
  const hangulItems: ConfusableItem[] = [];
  for (const g of groups) {
    const pick = shuffle(confusables.filter((c) => c.group === g), rng)[0];
    if (pick) hangulItems.push(pick);
  }
  for (const extra of shuffle(confusables, rng)) {
    if (hangulItems.length >= PLACEMENT_COUNT.hangul) break;
    if (!hangulItems.some((c) => c.id === extra.id)) hangulItems.push(extra);
  }

  const vocabWords = shuffle(
    words.filter((w) => w.pos !== "particle"),
    rng,
  ).slice(0, PLACEMENT_COUNT.vocab);

  const glueSentences = shuffle(sentences, rng).slice(0, PLACEMENT_COUNT.glue);

  return {
    hangul: shuffle(hangulItems, rng).map((item) => ({
      stage: "hangul",
      item,
      options: generateConfusableOptions(item, confusables, rng),
    })),
    vocab: vocabWords.map((word) => ({
      stage: "vocab",
      word,
      options: generateWordOptions(word, words, rng),
    })),
    glue: glueSentences.map((sentence) => ({
      stage: "glue",
      sentence,
      options: generateSentenceOptions(sentence, sentences, rng),
    })),
  };
}

export type PlacementLevel = "alphabet" | "words" | "glue" | "module2";

export interface PlacementOutcome {
  level: PlacementLevel;
  hangulDone: boolean;
  romanizationVisible: boolean;
  /** Words to pre-mark as known (Module 1's checklist, when earned). */
  preMarkWordIds: string[];
}

/** Scores for stages actually taken; a stage after a failed one is absent.
 *  m1WordIds is Module 1's checklist (what "knows the words" unlocks). */
export function placementOutcome(
  scores: { hangul: number; vocab?: number; glue?: number },
  m1WordIds: string[],
): PlacementOutcome {
  if (scores.hangul < PLACEMENT_PASS.hangul) {
    return {
      level: "alphabet",
      hangulDone: false,
      romanizationVisible: true,
      preMarkWordIds: [],
    };
  }
  if (scores.vocab === undefined || scores.vocab < PLACEMENT_PASS.vocab) {
    return {
      level: "words",
      hangulDone: true,
      romanizationVisible: true,
      preMarkWordIds: [],
    };
  }
  if (scores.glue === undefined || scores.glue < PLACEMENT_PASS.glue) {
    return {
      level: "glue",
      hangulDone: true,
      romanizationVisible: false,
      preMarkWordIds: [...m1WordIds],
    };
  }
  return {
    level: "module2",
    hangulDone: true,
    romanizationVisible: false,
    preMarkWordIds: [...m1WordIds],
  };
}

/** The next stage to run after finishing `stage` with `score`, or null when
 *  the quiz is over (adaptive early stop on a failed stage). */
export function nextStage(
  stage: PlacementStage,
  score: number,
): PlacementStage | null {
  if (score < PLACEMENT_PASS[stage]) return null;
  if (stage === "hangul") return "vocab";
  if (stage === "vocab") return "glue";
  return null;
}
