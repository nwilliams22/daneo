import sentencesJson from "../content/sentences.json";
import wordsJson from "../content/words.json";
import type { Chunk, Sentence } from "../types";
import { sentenceSchema } from "./schemas";
import { verbEnding } from "./translation-postprocess";

const courseSentences = sentenceSchema.array().parse(sentencesJson);

/**
 * Whitespace a learner cannot see but a string comparison can: a pasted
 * non-breaking or ideographic space, a zero-width joiner, a stray BOM.
 */
const INVISIBLE = /[\u00a0\u1680\u2000-\u200d\u202f\u205f\u2060\u3000\ufeff]/g;

/** Punctuation the corpus writes around a sentence, not inside a word. */
const EDGE_PUNCTUATION = /^["'“‘(]+|["'’”).,!?…~]+$/gu;
const TERMINAL_MARK = /[.!?…~]+$/u;

/**
 * Canonicalize what the learner submitted before any lookup. NFC composes
 * jamo typed or pasted in decomposed form, so visually identical Hangul
 * compares equal; the rest removes whitespace the learner cannot see. This
 * does not touch word boundaries or punctuation: the matcher stays exact and
 * `translateCorpusSentence` stays byte-strict for the evaluation harness.
 */
export function normalizeCourseInput(raw: string): string {
  return raw.normalize("NFC").replace(INVISIBLE, " ").replace(/\s+/g, " ").trim();
}

/** Lookup key that ignores a missing or extra terminal mark. */
export function terminalMarkKey(input: string): string {
  return normalizeCourseInput(input).replace(TERMINAL_MARK, "").trim();
}

/** Lookup key that additionally ignores where the learner put the spaces. */
export function spacingKey(input: string): string {
  return terminalMarkKey(input).replace(/\s+/g, "");
}

function surfaceTokens(chunks: readonly Chunk[]): string[] {
  return chunks.flatMap(chunk => chunk.t.split(/\s+/)).filter(token => token !== "");
}

function bareToken(token: string): string {
  return token.replace(EDGE_PUNCTUATION, "");
}

/**
 * Every word form the course actually contains: each space-separated token of
 * every reviewed sentence, plus every dictionary headword. Both are reviewed
 * content, so a token found here is taught by definition and a token found
 * nowhere here appears in no lesson and no word list.
 */
const taughtForms: ReadonlySet<string> = new Set([
  ...courseSentences.flatMap((sentence: Sentence) => surfaceTokens(sentence.ko)),
  ...wordsJson.flatMap(word => word.ko.split(/\s+/)),
  // Predicate stems too, so a taught verb is never named through a suffix
  // that happens to look like a particle (`공부하는` → `공부하` → `공부하다`).
  ...wordsJson
    .filter(word => (word.pos === "verb" || word.pos === "adj") && word.ko.endsWith("다"))
    .map(word => word.ko.slice(0, -1)),
].map(bareToken).filter(form => form !== ""));

/**
 * Reviewed particle inventory, longest first. Taken from the `particle`
 * entries of `words.json` rather than restated here, so the course's own
 * content decides what counts as a suffix.
 */
const particleForms: readonly string[] = [...new Set(
  wordsJson.filter(word => word.pos === "particle").map(word => word.ko),
)].sort((a, b) => b.length - a.length);

/**
 * The case and topic particles that may be reported as stripped. A wider
 * strip is still used to *suppress* a claim (see below), but only these
 * attach to a bare noun unambiguously enough to name the noun underneath.
 */
const reportableParticles: readonly string[] = [
  "에서", "에게", "한테", "이랑", "으로",
  "부터", "까지", "께서", "만큼",
  "은", "는", "이", "가", "을", "를", "에", "도",
  "와", "과", "랑", "로", "의", "만", "께",
].sort((a, b) => b.length - a.length);

export interface UntaughtWord {
  /** The token as the learner typed it, minus surrounding punctuation. */
  token: string;
  /** The form that was looked up: the token minus a reportable particle. */
  word: string;
}

/**
 * Tokens of the submitted sentence that appear in no reviewed sentence and no
 * dictionary entry, with a trailing particle discounted.
 *
 * Deliberately one-sided: silence is the safe answer, a wrong name is not.
 * Three filters stand between a token and being named, and each of them can
 * only suppress a claim:
 *
 * 1. The token itself occurs somewhere in the course content.
 * 2. The token ends in a reviewed inflected ending. Then it is a predicate
 *    form, and whether the course teaches its dictionary form cannot be
 *    decided without deconjugation — measured at 28% recovery in
 *    `deterministic-engine-feasibility.md`, so it is not attempted. `차요` is
 *    not named, because the course does teach `차다`.
 * 3. Stripping any reviewed particle leaves a stem that is taught. A noun does
 *    not inflect, so a case particle comes off exactly and the stem is the
 *    dictionary form — which is why the six out-of-course items resolve.
 *
 * Nothing here infers a meaning, a stem or a conjugation. It reports which
 * word was not found, which is the one piece of information a refused learner
 * can act on.
 */
export function untaughtWords(input: string): UntaughtWord[] {
  const found: UntaughtWord[] = [];
  for (const raw of normalizeCourseInput(input).split(" ")) {
    const token = bareToken(raw);
    if (token === "" || !/[가-힣]/.test(token)) continue;
    if (taughtForms.has(token)) continue;
    if (verbEnding.test(token)) continue;
    const taughtStem = particleForms.some(particle =>
      token.length > particle.length &&
      token.endsWith(particle) &&
      taughtForms.has(token.slice(0, -particle.length)));
    if (taughtStem) continue;
    const reportable = reportableParticles.find(particle =>
      token.length > particle.length && token.endsWith(particle));
    const word = reportable ? token.slice(0, -reportable.length) : token;
    if (!found.some(entry => entry.token === token)) found.push({ token, word });
  }
  return found;
}

/** True when the submitted text contains no Hangul at all (e.g. English). */
export function hasNoHangul(input: string): boolean {
  return !/[가-힣ᄀ-ᇿ㄰-㆏]/.test(input);
}
