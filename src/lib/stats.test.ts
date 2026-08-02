import { describe, it, expect } from "vitest";
import {
  currentlyMissed,
  accuracy,
  weakestItems,
  accuracyByGroup,
  accuracyByFace,
} from "./stats";
import type { DrillResult } from "../types";

const r = (
  itemId: string,
  correct: boolean,
  at: number,
  kind: DrillResult["kind"] = "confusable",
  face?: DrillResult["face"],
): DrillResult => ({ itemId, kind, correct, at, face });

describe("currentlyMissed (latest-result semantics)", () => {
  it("lists items whose latest result is wrong", () => {
    const missed = currentlyMissed([
      r("cf_wa", false, 1),
      r("cf_wo", true, 2),
    ]);
    expect(missed).toEqual([{ kind: "confusable", itemId: "cf_wa" }]);
  });

  it("clears an item once it is answered correctly later", () => {
    const missed = currentlyMissed([
      r("cf_wa", false, 1),
      r("cf_wa", true, 2),
    ]);
    expect(missed).toEqual([]);
  });

  it("re-adds an item that was correct but missed again later", () => {
    const missed = currentlyMissed([
      r("cf_wa", true, 1),
      r("cf_wa", false, 2),
    ]);
    expect(missed).toEqual([{ kind: "confusable", itemId: "cf_wa" }]);
  });

  it("treats the same itemId in different drills separately", () => {
    const missed = currentlyMissed([
      r("x", false, 1, "gap"),
      r("x", true, 2, "typing"),
    ]);
    expect(missed).toEqual([{ kind: "gap", itemId: "x" }]);
  });

  it("orders newest miss first", () => {
    const missed = currentlyMissed([
      r("a", false, 1),
      r("b", false, 5),
    ]);
    expect(missed.map((m) => m.itemId)).toEqual(["b", "a"]);
  });
});

describe("accuracy", () => {
  it("computes overall and windowed accuracy", () => {
    const rows = [r("a", true, 10), r("b", false, 20), r("c", true, 30)];
    expect(accuracy(rows)).toEqual({ seen: 3, correct: 2, pct: 67 });
    expect(accuracy(rows, 15)).toEqual({ seen: 2, correct: 1, pct: 50 });
    expect(accuracy([], 0)).toEqual({ seen: 0, correct: 0, pct: 0 });
  });
});

describe("weakestItems", () => {
  it("requires minimum attempts and sorts worst first", () => {
    const rows = [
      r("hard", false, 1), r("hard", false, 2), r("hard", true, 3),
      r("easy", true, 1), r("easy", true, 2), r("easy", true, 3),
      r("rare", false, 1), // only 1 attempt — excluded
    ];
    const weak = weakestItems(rows, 3, 5);
    expect(weak.map((w) => w.itemId)).toEqual(["hard", "easy"]);
    expect(weak[0]!.pct).toBe(33);
  });
});

describe("accuracyByGroup", () => {
  it("joins results to groups and skips unknown items", () => {
    const groupMap: Record<string, string> = { a: "vowel", b: "vowel", c: "tense" };
    const rows = [
      r("a", true, 1), r("b", false, 2), r("c", true, 3), r("zzz", true, 4),
    ];
    const groups = accuracyByGroup(rows, "confusable", (id) => groupMap[id]);
    expect(groups).toContainEqual({ group: "vowel", seen: 2, correct: 1, pct: 50 });
    expect(groups).toContainEqual({ group: "tense", seen: 1, correct: 1, pct: 100 });
    expect(groups).toHaveLength(2);
  });
});

describe("accuracyByFace", () => {
  it("groups only face-tagged results", () => {
    const rows = [
      r("a", true, 1, "confusable", "myeongjo"),
      r("b", false, 2, "confusable", "myeongjo"),
      r("c", true, 3), // untagged — ignored
    ];
    expect(accuracyByFace(rows)).toEqual([
      { face: "myeongjo", seen: 2, correct: 1, pct: 50 },
    ]);
  });
});
