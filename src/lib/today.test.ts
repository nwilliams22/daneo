import { describe, it, expect } from "vitest";
import {
  lastCaught,
  moduleToContinue,
  oldestDueDays,
  planMinutes,
  reviewMinutes,
  startOfDay,
  studyStreak,
  studyWeek,
  testOwed,
} from "./today";
import type { DrillResult, Module, ModuleTestResult, SrsCard } from "../types";

const DAY = 24 * 60 * 60 * 1000;
// Mid-afternoon, so "today" has room on both sides of every assertion.
const NOW = new Date("2026-10-25T15:00:00").getTime();

const result = (at: number): DrillResult => ({
  kind: "word",
  itemId: "w_x",
  correct: true,
  at,
});

const mod = (id: string, order: number, wordIds: string[]): Module => ({
  id,
  title: `Module ${order}`,
  order,
  contentMd: `${id}.md`,
  wordIds,
  sentenceIds: [],
});

const card = (due: number): SrsCard => ({
  kind: "word",
  itemId: `w_${due}`,
  interval: 1,
  ease: 5,
  due,
  lapses: 0,
});

describe("studyWeek", () => {
  it("marks the days that saw an answer, oldest first, today last", () => {
    const week = studyWeek([result(NOW), result(NOW - 3 * DAY)], 7, NOW);
    // index 6 is today, index 3 is three days back
    expect(week).toEqual([false, false, false, true, false, false, true]);
  });

  it("is all false for a learner who has never drilled", () => {
    expect(studyWeek([], 7, NOW)).toEqual(Array(7).fill(false));
  });

  it("counts a day once however many answers it holds", () => {
    const week = studyWeek(
      [result(NOW), result(NOW - 60_000), result(NOW - 120_000)],
      7,
      NOW,
    );
    expect(week.filter(Boolean)).toHaveLength(1);
  });

  it("ignores answers older than the window", () => {
    expect(studyWeek([result(NOW - 30 * DAY)], 7, NOW)).toEqual(
      Array(7).fill(false),
    );
  });
});

describe("studyStreak", () => {
  it("counts consecutive days ending today", () => {
    const rows = [0, 1, 2].map((d) => result(NOW - d * DAY));
    expect(studyStreak(rows, NOW)).toBe(3);
  });

  it("does not break a run that reached yesterday but not yet today", () => {
    const rows = [1, 2].map((d) => result(NOW - d * DAY));
    expect(studyStreak(rows, NOW)).toBe(2);
  });

  it("stops at the first missed day", () => {
    const rows = [0, 1, 3, 4].map((d) => result(NOW - d * DAY));
    expect(studyStreak(rows, NOW)).toBe(2);
  });

  it("is 0 once two whole days have passed", () => {
    expect(studyStreak([result(NOW - 2 * DAY)], NOW)).toBe(0);
  });

  it("is 0 with no results at all", () => {
    expect(studyStreak([], NOW)).toBe(0);
  });

  it("uses local midnight, so a late-night and an early-morning session are two days", () => {
    const lateNight = new Date("2026-10-23T23:40:00").getTime();
    const earlyNext = new Date("2026-10-24T00:10:00").getTime();
    const now = new Date("2026-10-24T09:00:00").getTime();
    expect(startOfDay(lateNight)).not.toBe(startOfDay(earlyNext));
    expect(studyStreak([result(lateNight), result(earlyNext)], now)).toBe(2);
  });
});

describe("moduleToContinue", () => {
  const modules = [
    mod("m1", 1, ["a", "b"]),
    mod("m2", 2, ["c", "d"]),
    mod("m3", 3, ["e", "f"]),
  ];

  it("picks the furthest module that is started but not finished", () => {
    const known = new Set(["a", "b", "c"]);
    expect(moduleToContinue(modules, known)?.id).toBe("m2");
  });

  it("picks the first unfinished module when none is half-done", () => {
    expect(moduleToContinue(modules, new Set(["a", "b"]))?.id).toBe("m2");
  });

  it("starts at the beginning for a brand-new learner", () => {
    expect(moduleToContinue(modules, new Set())?.id).toBe("m1");
  });

  it("is undefined once everything is finished", () => {
    const all = new Set(["a", "b", "c", "d", "e", "f"]);
    expect(moduleToContinue(modules, all)).toBeUndefined();
  });

  it("never treats a reading as in-progress, but will offer it in order", () => {
    const withReading = [mod("m1", 1, ["a"]), mod("r1", 2, []), mod("m2", 3, ["b"])];
    // "a" done, so the reading is the next unfinished thing — except a reading
    // has no words, so isModuleComplete() calls it complete and m2 is next.
    expect(moduleToContinue(withReading, new Set(["a"]))?.id).toBe("m2");
  });
});

describe("testOwed", () => {
  const modules = [mod("m1", 1, ["a"]), mod("m2", 2, ["b"])];
  const tests = (rows: Partial<ModuleTestResult>[]) =>
    new Map(
      rows.map((r) => [
        r.moduleId!,
        { bestPct: 0, lastPct: 0, attempts: 1, at: NOW, ...r } as ModuleTestResult,
      ]),
    );

  it("names a finished module that has never been tested", () => {
    const owed = testOwed(modules, new Set(["a"]), tests([]));
    expect(owed?.module.id).toBe("m1");
    expect(owed?.result).toBeUndefined();
  });

  it("names a finished module whose best score is still below the pass mark", () => {
    const owed = testOwed(modules, new Set(["a"]), tests([{ moduleId: "m1", bestPct: 62 }]));
    expect(owed?.module.id).toBe("m1");
    expect(owed?.result?.bestPct).toBe(62);
  });

  it("skips a passed module and moves to the next one owed", () => {
    const owed = testOwed(
      modules,
      new Set(["a", "b"]),
      tests([{ moduleId: "m1", bestPct: 90 }]),
    );
    expect(owed?.module.id).toBe("m2");
  });

  it("owes nothing while the module's vocabulary is unfinished", () => {
    expect(testOwed(modules, new Set(), tests([]))).toBeUndefined();
  });

  it("ignores readings, which have no test", () => {
    const withReading = [mod("r1", 1, [])];
    expect(testOwed(withReading, new Set(), tests([]))).toBeUndefined();
  });
});

describe("lastCaught", () => {
  const row = (moduleId: string, at: number, misses: number): ModuleTestResult => ({
    moduleId,
    bestPct: 50,
    lastPct: 50,
    attempts: 1,
    at,
    misses: Array.from({ length: misses }, (_, i) => ({
      kind: "word" as const,
      itemId: `w_${moduleId}_${i}`,
    })),
  });

  it("returns the most recent attempt that caught something", () => {
    const caught = lastCaught([row("m1", NOW - DAY, 2), row("m2", NOW, 3)]);
    expect(caught?.moduleId).toBe("m2");
    expect(caught?.misses).toHaveLength(3);
  });

  it("skips attempts whose misses are all cleared", () => {
    const caught = lastCaught([row("m1", NOW - DAY, 2), row("m2", NOW, 0)]);
    expect(caught?.moduleId).toBe("m1");
  });

  it("is undefined when nothing was caught", () => {
    expect(lastCaught([row("m1", NOW, 0)])).toBeUndefined();
  });

  it("tolerates rows written before misses were tracked", () => {
    const old: ModuleTestResult = {
      moduleId: "m0",
      bestPct: 40,
      lastPct: 40,
      attempts: 1,
      at: NOW,
    };
    expect(lastCaught([old])).toBeUndefined();
  });
});

describe("minutes", () => {
  it("quotes the mockup's 23 reviews as about 6 minutes", () => {
    expect(reviewMinutes(23)).toBe(6);
  });

  it("never quotes zero minutes for a non-empty queue", () => {
    expect(reviewMinutes(1)).toBe(1);
  });

  it("adds the module stint and the test to the whole plan", () => {
    expect(planMinutes({ due: 23, hasModule: true, hasTest: true })).toBe(18);
  });

  it("drops what is not waiting", () => {
    expect(planMinutes({ due: 23, hasModule: false, hasTest: false })).toBe(6);
  });
});

describe("oldestDueDays", () => {
  it("reports how long the longest-waiting due card has waited", () => {
    expect(oldestDueDays([card(NOW - 3 * DAY), card(NOW - 1000)], NOW)).toBe(3);
  });

  it("is 0 when everything came due today", () => {
    expect(oldestDueDays([card(NOW - 1000)], NOW)).toBe(0);
  });

  it("ignores cards that are not due yet", () => {
    expect(oldestDueDays([card(NOW + 5 * DAY)], NOW)).toBe(0);
  });
});
