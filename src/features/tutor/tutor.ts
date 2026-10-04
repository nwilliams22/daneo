import { z } from "zod";
import { db } from "../../db/db";
import { allSentences, allWords, moduleById, sentenceById, wordById } from "../../content";
import { knownSet, unlockedSentences } from "../../lib/gating";
import { currentlyMissed } from "../../lib/stats";
import type { Sentence } from "../../types";

const replySchema = z.object({
  answer: z.string().min(1).max(1200),
  sentenceIds: z.array(z.string()).max(3),
});

export interface TutorContext {
  known: Set<string>;
  due: number;
  misses: string[];
  progress: string[];
  examples: Sentence[];
}

/** A read-only snapshot. The tutor never calls a learner-state write funnel. */
export async function readTutorContext(now = Date.now()): Promise<TutorContext> {
  const [knownRows, dueCards, results, tests] = await Promise.all([
    db.knownWords.toArray(),
    db.srsCards.where("due").belowOrEqual(now).toArray(),
    db.drillResults.toArray(),
    db.moduleTests.toArray(),
  ]);
  const known = knownSet(knownRows);
  const misses = currentlyMissed(results).slice(0, 8).map(({ kind, itemId }) => {
    const word = wordById.get(itemId);
    return word && known.has(word.id) ? `${word.en} (${kind})` : `${kind} practice`;
  });
  const progress = tests.slice(-8).map((test) =>
    `${moduleById.get(test.moduleId)?.title ?? "Lesson"}: ${test.bestPct}% best`,
  );
  return {
    known,
    due: dueCards.length,
    misses,
    progress,
    examples: unlockedSentences(allSentences, known).slice(-8),
  };
}

export function tutorPrompt(question: string, context: TutorContext): string {
  const words = allWords.filter((word) => context.known.has(word.id)).slice(-40)
    .map(({ en, ko }) => ({ en, ko }));
  const sentences = context.examples.map((sentence) => ({
    id: sentence.id,
    english: sentence.en.map((chunk) => chunk.t).join(" "),
  }));
  const payload = {
    question,
    knownWords: words,
    knownWordCount: context.known.size,
    dueCards: context.due,
    misses: context.misses,
    moduleProgress: context.progress,
    sentences,
  };
  while (new TextEncoder().encode(JSON.stringify(payload)).length > 4096) {
    if (sentences.length > 0) sentences.pop();
    else if (words.length > 0) words.pop();
    else break;
  }
  return JSON.stringify(payload);
}

export interface TutorReply { answer: string; examples: Sentence[] }

/** Model text is never a source of Korean examples. Only known curriculum rows render. */
export function safeTutorReply(raw: unknown, known: Set<string>, offeredIds?: Set<string>): TutorReply | null {
  const parsed = replySchema.safeParse(raw);
  if (!parsed.success) return null;
  // Drop generated Korean even when the model mixes it into English prose.
  // The curriculum example below is the sole Korean output path.
  const korean = /[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]/u;
  const answer = parsed.data.answer
    .replace(/\([^()]*[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af][^()]*\)/gu, "")
    .split(/(\s+)/u)
    .filter((part) => !korean.test(part))
    .join("")
    .replace(/\s+/gu, " ")
    .trim();
  if (!/[A-Za-z]/u.test(answer)) return null;
  const examples = parsed.data.sentenceIds
    .map((id) => sentenceById.get(id))
    .filter((sentence): sentence is Sentence => !!sentence && (!offeredIds || offeredIds.has(sentence.id)))
    .filter((sentence) => sentence.wordIds.every((id) => known.has(id)));
  return { answer, examples };
}
