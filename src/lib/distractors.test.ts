import { describe, it, expect } from "vitest";
import { generateConfusableOptions, generateGapOptions } from "./distractors";
import { mulberry32 } from "./rng";
import { content } from "../content";

describe("confusable distractors (§6.2)", () => {
  it("every target yields 4 options with the answer present and distinct roms", () => {
    for (const target of content.confusables) {
      for (let seed = 0; seed < 20; seed++) {
        const options = generateConfusableOptions(
          target,
          content.confusables,
          mulberry32(seed),
        );
        expect(options).toHaveLength(4);
        expect(options.filter((o) => o.id === target.id)).toHaveLength(1);
        const roms = options.map((o) => o.r);
        expect(new Set(roms).size).toBe(4);
      }
    }
  });

  it("distractors share the target's group whenever ≥3 same-group items exist", () => {
    for (const target of content.confusables) {
      const sameGroup = content.confusables.filter(
        (x) => x.group === target.group && x.id !== target.id,
      );
      if (sameGroup.length < 3) continue;
      for (let seed = 0; seed < 20; seed++) {
        const options = generateConfusableOptions(
          target,
          content.confusables,
          mulberry32(seed),
        );
        for (const o of options) expect(o.group).toBe(target.group);
      }
    }
  });

  it("falls back beyond the group only when the group is too small", () => {
    const pool = content.confusables.filter(
      (c) => c.group !== "tense" || ["p", "kk"].includes(c.r),
    );
    const target = pool.find((c) => c.r === "p")!;
    const options = generateConfusableOptions(target, pool, mulberry32(1));
    expect(options).toHaveLength(4);
    expect(options.filter((o) => o.id === target.id)).toHaveLength(1);
    expect(new Set(options.map((o) => o.r)).size).toBe(4);
  });

  it("is deterministic for a given seed", () => {
    const target = content.confusables[0]!;
    const a = generateConfusableOptions(target, content.confusables, mulberry32(7));
    const b = generateConfusableOptions(target, content.confusables, mulberry32(7));
    expect(a.map((o) => o.id)).toEqual(b.map((o) => o.id));
  });
});

describe("gap quiz distractors", () => {
  it("every target yields 4 options with distinct real meanings", () => {
    for (const target of content.gap) {
      for (let seed = 0; seed < 20; seed++) {
        const options = generateGapOptions(target, content.gap, mulberry32(seed));
        expect(options).toHaveLength(4);
        expect(options.filter((o) => o.id === target.id)).toHaveLength(1);
        expect(new Set(options.map((o) => o.real)).size).toBe(4);
      }
    }
  });
});
