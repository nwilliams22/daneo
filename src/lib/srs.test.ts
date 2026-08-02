import { describe, expect, it } from "vitest";
import { applyAnswer, dueNow, isDue, nextDueAt } from "./srs";
import type { SrsCard } from "../types";

// PROJECT.md §6.4 — due-date math produces monotonically growing intervals
// on success, reset on lapse. The scheduler is FSRS (binary mapping:
// correct → Good, wrong → Again); these tests pin the behavior we rely on,
// not FSRS internals.

const T0 = new Date("2026-08-02T09:00:00Z");

/** Answer correctly exactly when the card comes due, `n` times. */
function successRun(n: number): SrsCard[] {
  const cards: SrsCard[] = [];
  let card = applyAnswer(undefined, "confusable", "c_wa", true, T0);
  cards.push(card);
  for (let i = 1; i < n; i++) {
    card = applyAnswer(card, "confusable", "c_wa", true, new Date(card.due));
    cards.push(card);
  }
  return cards;
}

describe("srs scheduling (§6.4)", () => {
  it("creates a card on first answer, scheduled into the future", () => {
    const card = applyAnswer(undefined, "confusable", "c_wa", true, T0);
    expect(card.kind).toBe("confusable");
    expect(card.itemId).toBe("c_wa");
    expect(card.due).toBeGreaterThan(T0.getTime());
    expect(card.lapses).toBe(0);
    expect(card.reps).toBe(1);
  });

  it("intervals grow monotonically across a run of successes", () => {
    const run = successRun(8);
    const gaps = run.map((c, i) =>
      i === 0 ? 0 : c.due - run[i - 1]!.due,
    );
    for (let i = 2; i < gaps.length; i++) {
      expect(gaps[i]!).toBeGreaterThanOrEqual(gaps[i - 1]!);
    }
    // and the tail is genuinely long-term (days, not minutes)
    const last = run[run.length - 1]!;
    expect(last.interval).toBeGreaterThanOrEqual(3);
    expect(last.state).toBe(2); // Review
  });

  it("a lapse resets the interval and increments lapses", () => {
    const run = successRun(6);
    const mature = run[run.length - 1]!;
    expect(mature.interval).toBeGreaterThan(0);

    const lapsed = applyAnswer(
      mature,
      "confusable",
      "c_wa",
      false,
      new Date(mature.due),
    );
    expect(lapsed.lapses).toBe(mature.lapses + 1);
    expect(lapsed.interval).toBeLessThan(mature.interval);
    // due again within the hour — the "shortened interval" re-entry
    expect(lapsed.due - mature.due).toBeLessThanOrEqual(60 * 60 * 1000);
    expect(lapsed.state).toBe(3); // Relearning
  });

  it("a WRONG first answer enters SRS due within minutes", () => {
    const card = applyAnswer(undefined, "gap", "g_bap", false, T0);
    expect(card.due - T0.getTime()).toBeLessThanOrEqual(15 * 60 * 1000);
    expect(card.due).toBeGreaterThan(T0.getTime());
  });

  it("recovers growth after a lapse", () => {
    const run = successRun(5);
    let card = applyAnswer(
      run[4]!,
      "confusable",
      "c_wa",
      false,
      new Date(run[4]!.due),
    );
    // two successes after the lapse → interval climbing again
    card = applyAnswer(card, "confusable", "c_wa", true, new Date(card.due));
    const next = applyAnswer(
      card,
      "confusable",
      "c_wa",
      true,
      new Date(card.due),
    );
    expect(next.due).toBeGreaterThan(card.due);
  });

  it("legacy cards without FSRS fields are treated as new and still schedule", () => {
    const legacy: SrsCard = {
      itemId: "c_eo",
      kind: "confusable",
      interval: 0,
      ease: 0,
      due: T0.getTime(),
      lapses: 0,
    };
    const next = applyAnswer(legacy, "confusable", "c_eo", true, T0);
    expect(next.due).toBeGreaterThan(T0.getTime());
    expect(next.stability).toBeGreaterThan(0);
  });
});

describe("due queue", () => {
  const mk = (kind: SrsCard["kind"], itemId: string, due: number): SrsCard => ({
    kind,
    itemId,
    interval: 1,
    ease: 5,
    due,
    lapses: 0,
  });

  it("mixes kinds in one queue, oldest due first, future cards excluded", () => {
    const now = T0.getTime();
    const cards = [
      mk("gap", "g1", now - 1000),
      mk("confusable", "c1", now - 5000),
      mk("typing", "w1", now + 60_000),
      mk("anatomy", "s1", now),
    ];
    const due = dueNow(cards, now);
    expect(due.map((c) => c.itemId)).toEqual(["c1", "g1", "s1"]);
    expect(isDue(cards[2]!, now)).toBe(false);
  });

  it("nextDueAt reports the earliest future card", () => {
    const now = T0.getTime();
    const cards = [
      mk("gap", "g1", now - 1000),
      mk("typing", "w1", now + 60_000),
      mk("typing", "w2", now + 30_000),
    ];
    expect(nextDueAt(cards, now)).toBe(now + 30_000);
    expect(nextDueAt([cards[0]!], now)).toBeUndefined();
  });
});
