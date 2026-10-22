import sentencesJson from "../content/sentences.json";
import type { Chunk, Sentence, TranslationResult } from "../types";
import { sentenceSchema, translationResultSchema } from "./schemas";
import { romanize } from "./romanize";
import { lookupGap } from "./gap-lookup";
import { particlesIn } from "./translation-postprocess";

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
