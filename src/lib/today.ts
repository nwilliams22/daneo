// What the Today page shows — pure derivations over the learner's rows, so the
// page itself is a view and the decisions here are testable (BAD-281 slice 2).
//
// "What do I do now?" has one answer, in this order: clear the review queue,
// carry on with the module you are in the middle of, sit the test you still
// owe, and practise what the last test caught. Everything below answers one of
// those four.

import type {
  DrillResult,
  Module,
  ModuleTestResult,
  SrsCard,
  TestMiss,
} from "../types";
import { isModuleComplete, moduleProgress } from "./gating";
import { PASS_PCT } from "./moduleTest";
import { dueNow } from "./srs";

const DAY_MS = 24 * 60 * 60 * 1000;

/** A review answer takes about this long once the learner is warmed up —
 *  calibrated against the mockup's "23 due ≈ 6 minutes" (BAD-281). */
export const SECONDS_PER_REVIEW = 15;

/** Local midnight for a timestamp. Day boundaries are the learner's, not UTC's:
 *  a 23:40 session and a 00:10 one are different days to the person doing them. */
export function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Whole days each of the last `days` calendar days (oldest first) saw at least
 *  one drill answer. Index `days - 1` is today. */
export function studyWeek(
  results: DrillResult[],
  days = 7,
  now: number = Date.now(),
): boolean[] {
  const today = startOfDay(now);
  const active = new Set(results.map((r) => startOfDay(r.at)));
  return Array.from({ length: days }, (_, i) =>
    active.has(today - (days - 1 - i) * DAY_MS),
  );
}

/** Consecutive days ending today (or yesterday — a streak is not broken until
 *  today is over) with at least one drill answer. */
export function studyStreak(
  results: DrillResult[],
  now: number = Date.now(),
): number {
  const active = new Set(results.map((r) => startOfDay(r.at)));
  const today = startOfDay(now);
  // Today not yet studied does not end a run that reached yesterday.
  let cursor = active.has(today) ? today : today - DAY_MS;
  if (!active.has(cursor)) return 0;
  let streak = 0;
  while (active.has(cursor)) {
    streak += 1;
    cursor -= DAY_MS;
  }
  return streak;
}

/** The module to carry on with: the furthest one already started but not
 *  finished, else the first unfinished one. Readings (no vocabulary) are never
 *  "in progress", so they are only offered when nothing else is open. */
export function moduleToContinue(
  modules: Module[],
  known: Set<string>,
): Module | undefined {
  const withWords = modules.filter((m) => m.wordIds.length > 0);
  const started = withWords.filter((m) => {
    const p = moduleProgress(m, known);
    return p.done > 0 && p.done < p.total;
  });
  if (started.length > 0) return started[started.length - 1];
  return modules.find((m) => !isModuleComplete(m, known));
}

export interface TestOwed {
  module: Module;
  /** Previous attempt, when there is one — absent means never sat. */
  result?: ModuleTestResult;
}

/** The module whose vocabulary is finished but whose test has not been passed:
 *  the one piece of work the app asks for that the learner can forget about. */
export function testOwed(
  modules: Module[],
  known: Set<string>,
  tests: Map<string, ModuleTestResult>,
): TestOwed | undefined {
  for (const m of modules) {
    if (m.wordIds.length === 0) continue;
    if (!isModuleComplete(m, known)) continue;
    const result = tests.get(m.id);
    if (result && result.bestPct >= PASS_PCT) continue;
    return { module: m, result };
  }
  return undefined;
}

export interface Caught {
  moduleId: string;
  misses: TestMiss[];
  at: number;
}

/** What the most recent module test caught and the learner has not cleared. */
export function lastCaught(tests: ModuleTestResult[]): Caught | undefined {
  const withMisses = tests
    .filter((t) => (t.misses?.length ?? 0) > 0)
    .sort((a, b) => b.at - a.at);
  const latest = withMisses[0];
  if (!latest) return undefined;
  return { moduleId: latest.moduleId, misses: latest.misses ?? [], at: latest.at };
}

/** Minutes the whole plan costs, rounded to something a person would say.
 *  Reviews are timed; a module stint and a test are flat estimates, because
 *  how long they take is up to the learner. */
export function planMinutes(opts: {
  due: number;
  hasModule: boolean;
  hasTest: boolean;
}): number {
  const reviewSeconds = opts.due * SECONDS_PER_REVIEW;
  const minutes =
    reviewSeconds / 60 + (opts.hasModule ? 8 : 0) + (opts.hasTest ? 4 : 0);
  return Math.max(1, Math.round(minutes));
}

/** Minutes a review queue of this size costs, rounded up to a whole minute. */
export function reviewMinutes(due: number): number {
  return Math.max(1, Math.ceil((due * SECONDS_PER_REVIEW) / 60));
}

/** How long the longest-waiting due card has been waiting, in whole days.
 *  0 means it came due today. */
export function oldestDueDays(
  cards: SrsCard[],
  now: number = Date.now(),
): number {
  const due = dueNow(cards, now);
  if (due.length === 0) return 0;
  const oldest = Math.min(...due.map((c) => c.due));
  return Math.max(0, Math.floor((startOfDay(now) - startOfDay(oldest)) / DAY_MS));
}
