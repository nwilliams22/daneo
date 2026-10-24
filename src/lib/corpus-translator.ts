import sentencesJson from "../content/sentences.json";
import type { Chunk, Sentence, TranslationResult } from "../types";
import { sentenceSchema, translationResultSchema } from "./schemas";
import { romanize } from "./romanize";
import { lookupGap } from "./gap-lookup";
import { particlesIn } from "./translation-postprocess";
import {
  normalizeCourseInput, spacingKey, terminalMarkKey, untaughtWords,
  type UntaughtWord,
} from "./course-input";

const courseSentences = sentenceSchema.array().parse(sentencesJson);

export type CorpusTranslation =
  | { status: "translated"; sentenceId: string; result: TranslationResult }
  | {
      status: "refused";
      reason: "no-exact-match" | "ambiguous-match" | "invalid-source";
      unresolvedInput: string;
      sentenceIds: string[];
    };

/** Join reviewed chunks without inventing punctuation or a dropped subject. */
export function sentenceSurface(chunks: readonly Chunk[]): string {
  return chunks.map(chunk => chunk.t).filter(text => text !== "").join(" ");
}

/**
 * Copy the reviewed layers, aligning by ID rather than array position.
 * Empty Korean chunks retain their reviewed gloss (an understood subject).
 * Gap explanations are copied from reviewed patterns; no note synthesis,
 * word-ID inference or deconjugation happens here.
 */
export function assembleCorpusSentence(sentence: Sentence): CorpusTranslation {
  const korean = sentenceSurface(sentence.ko);
  const refuse = (): CorpusTranslation => ({
    status: "refused",
    reason: "invalid-source",
    unresolvedInput: korean,
    sentenceIds: [sentence.id],
  });
  const ids = sentence.ko.map(chunk => chunk.id);
  if (
    new Set(ids).size !== ids.length ||
    [sentence.gloss, sentence.en].some(layer =>
      layer.length !== ids.length ||
      new Set(layer.map(chunk => chunk.id)).size !== ids.length ||
      layer.some(chunk => !ids.includes(chunk.id)))
  ) return refuse();

  const gloss = [];
  for (const chunk of sentence.ko) {
    const reviewed = sentence.gloss.find(item => item.id === chunk.id);
    if (!reviewed || reviewed.role !== chunk.role) return refuse();
    gloss.push({ chunk: chunk.t, gloss: reviewed.t, role: chunk.role });
  }
  const parsed = translationResultSchema.safeParse({
    direction: "ko-to-en",
    korean,
    romanization: romanize(korean),
    natural_english: sentenceSurface(sentence.en),
    gloss,
    particles: particlesIn(korean),
    ...lookupGap(korean),
  });
  return parsed.success
    ? { status: "translated", sentenceId: sentence.id, result: parsed.data }
    : refuse();
}

/**
 * Exact Korean course-sentence lookup only. Deliberately no trimming, Unicode
 * normalization, punctuation removal, fuzzy matching, or novel recombination.
 * Multiple source rows refuse even if their English happens to agree.
 * On a miss the entire input is unresolved: this engine cannot diagnose tokens.
 * The optional corpus supports isolated tests; production uses reviewed data.
 */
export function translateCorpusSentence(
  input: string,
  sentences: readonly Sentence[] = courseSentences,
): CorpusTranslation {
  const matches = sentences.filter(sentence => sentenceSurface(sentence.ko) === input);
  if (matches.length !== 1) {
    return {
      status: "refused",
      reason: matches.length === 0 ? "no-exact-match" : "ambiguous-match",
      unresolvedInput: input,
      sentenceIds: matches.map(sentence => sentence.id),
    };
  }
  return assembleCorpusSentence(matches[0]);
}

/** Which canonical key matched, for the ladder below. */
export type MatchedBy = "exact" | "terminal-mark" | "spacing";

const PASSES: { matchedBy: MatchedBy; key: (text: string) => string }[] = [
  { matchedBy: "exact", key: normalizeCourseInput },
  { matchedBy: "terminal-mark", key: terminalMarkKey },
  { matchedBy: "spacing", key: spacingKey },
];

/** One key→sentences map per pass, built once per corpus array. */
const indexes = new WeakMap<object, Map<string, Sentence[]>[]>();

function keyIndexes(sentences: readonly Sentence[]): Map<string, Sentence[]>[] {
  const cached = indexes.get(sentences as object);
  if (cached) return cached;
  const built = PASSES.map(pass => {
    const map = new Map<string, Sentence[]>();
    for (const sentence of sentences) {
      const key = pass.key(sentenceSurface(sentence.ko));
      const bucket = map.get(key);
      if (bucket) bucket.push(sentence);
      else map.set(key, [sentence]);
    }
    return map;
  });
  indexes.set(sentences as object, built);
  return built;
}

export type SubmittedLookup =
  | {
      status: "translated";
      sentenceId: string;
      matchedBy: MatchedBy;
      result: TranslationResult;
    }
  | {
      status: "refused";
      reason: "no-exact-match" | "ambiguous-match" | "invalid-source";
      /** What was actually looked up, after normalization. */
      submitted: string;
      /** Tokens the course contains nowhere; empty when every word is taught. */
      untaught: UntaughtWord[];
      sentenceIds: string[];
    };

/**
 * The learner-facing boundary: normalize what was submitted, then look it up.
 *
 * Three exact lookups against progressively more canonical keys, never a fuzzy
 * one. An invisible or doubled space is removed before the first pass; the
 * second pass ignores a missing or extra terminal mark, which 376 of the 1,439
 * sentences carry; the third ignores where the spaces fell. Each pass is still
 * equality against a reviewed sentence, so no input outside the corpus can be
 * answered and a key that matches two sentences refuses as ambiguous rather
 * than picking one. `translateCorpusSentence` above stays byte-strict, because
 * the evaluation harness and its provenance tests are written against it.
 */
export function lookupSubmittedSentence(
  raw: string,
  sentences: readonly Sentence[] = courseSentences,
): SubmittedLookup {
  const submitted = normalizeCourseInput(raw);
  const byKey = keyIndexes(sentences);
  for (const [index, pass] of PASSES.entries()) {
    const wanted = pass.key(submitted);
    if (wanted === "") break;
    const matches = byKey[index].get(wanted) ?? [];
    if (matches.length === 0) continue;
    if (matches.length > 1) {
      return {
        status: "refused",
        reason: "ambiguous-match",
        submitted,
        untaught: [],
        sentenceIds: matches.map(sentence => sentence.id),
      };
    }
    const assembled = assembleCorpusSentence(matches[0]);
    return assembled.status === "translated"
      ? { ...assembled, matchedBy: pass.matchedBy }
      : {
          status: "refused",
          reason: "invalid-source",
          submitted,
          untaught: [],
          sentenceIds: assembled.sentenceIds,
        };
  }
  return {
    status: "refused",
    reason: "no-exact-match",
    submitted,
    untaught: untaughtWords(submitted),
    sentenceIds: [],
  };
}
