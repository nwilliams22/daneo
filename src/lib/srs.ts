import {
  createEmptyCard,
  fsrs,
  Rating,
  type Card,
  type Grade,
} from "ts-fsrs";
import type { DrillKind, SrsCard } from "../types";

// Phase A.2 — spaced repetition via FSRS (Anki's modern scheduler), chosen
// over hand-rolled SM-2 (TASKS.md 2026-08-01 note). Defaults only, no
// settings jungle. Drills grade binary, so the mapping is fixed:
// wrong → Again (card lapses, due again within minutes — the "shortened
// interval" of PROJECT.md §5), correct → Good.

const f = fsrs(); // default parameters

function toFsrsCard(c: SrsCard): Card {
  return {
    due: new Date(c.due),
    stability: c.stability ?? 0,
    difficulty: c.ease,
    elapsed_days: c.elapsedDays ?? 0,
    scheduled_days: c.interval,
    reps: c.reps ?? 0,
    lapses: c.lapses,
    learning_steps: c.learningSteps ?? 0,
    state: c.state ?? 0,
    last_review: c.lastReview === undefined ? undefined : new Date(c.lastReview),
  };
}

function fromFsrsCard(kind: DrillKind, itemId: string, card: Card): SrsCard {
  return {
    kind,
    itemId,
    interval: card.scheduled_days,
    ease: card.difficulty,
    due: card.due.getTime(),
    lapses: card.lapses,
    stability: card.stability,
    elapsedDays: card.elapsed_days,
    reps: card.reps,
    learningSteps: card.learning_steps,
    state: card.state,
    lastReview: card.last_review?.getTime(),
  };
}

/** One graded answer, anywhere in the app, moves the item's card:
 *  a missing card is created first, so every drilled item enters SRS. */
export function applyAnswer(
  existing: SrsCard | undefined,
  kind: DrillKind,
  itemId: string,
  correct: boolean,
  now: Date = new Date(),
): SrsCard {
  const card = existing ? toFsrsCard(existing) : createEmptyCard(now);
  const grade: Grade = correct ? Rating.Good : Rating.Again;
  const { card: next } = f.next(card, now, grade);
  return fromFsrsCard(kind, itemId, next);
}

export function isDue(card: SrsCard, now: number = Date.now()): boolean {
  return card.due <= now;
}

/** The daily queue: every due card across every drill kind, oldest due
 *  first. Mixing kinds needs no extra logic — they share one queue. */
export function dueNow(cards: SrsCard[], now: number = Date.now()): SrsCard[] {
  return cards.filter((c) => isDue(c, now)).sort((a, b) => a.due - b.due);
}

/** Earliest future due time, for the "all clear — next review at" state. */
export function nextDueAt(
  cards: SrsCard[],
  now: number = Date.now(),
): number | undefined {
  let min: number | undefined;
  for (const c of cards) {
    if (c.due > now && (min === undefined || c.due < min)) min = c.due;
  }
  return min;
}
