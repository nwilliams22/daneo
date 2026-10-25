import { describe, it, expect } from "vitest";
import {
  generateConfusableOptions,
  generateConfusableTrueFalse,
  generateGapOptions,
} from "./distractors";
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

describe("confusable flashcard true/false (BAD-279)", () => {
  it("shows either the letter's own sound or a confusable's, never a sound that is also correct", () => {
    for (const target of content.confusables) {
      for (let seed = 0; seed < 40; seed++) {
        const tf = generateConfusableTrueFalse(
          target,
          content.confusables,
          mulberry32(seed),
        );
        expect(tf.item.id).toBe(target.id);
        if (tf.isTrue) {
          expect(tf.sound).toBe(target.r);
          expect(tf.decoy).toBeUndefined();
        } else {
          // A false card's sound belongs to another confusable and is never
          // the target's own romanization — otherwise "false" would be wrong.
          expect(tf.decoy).toBeDefined();
          expect(tf.sound).toBe(tf.decoy!.r);
          expect(tf.decoy!.id).not.toBe(target.id);
          expect(tf.sound).not.toBe(target.r);
          expect(
            content.confusables.some((c) => c.id === tf.decoy!.id),
          ).toBe(true);
        }
      }
    }
  });

  it("takes the false sound from the target's own group whenever the group has one", () => {
    for (const target of content.confusables) {
      const sameGroup = content.confusables.filter(
        (x) => x.group === target.group && x.id !== target.id && x.r !== target.r,
      );
      if (sameGroup.length === 0) continue;
      for (let seed = 0; seed < 40; seed++) {
        const tf = generateConfusableTrueFalse(
          target,
          content.confusables,
          mulberry32(seed),
        );
        if (!tf.decoy) continue;
        expect(tf.decoy.group).toBe(target.group);
      }
    }
  });

  it("is roughly 50/50 true vs false, so answering true is not a strategy", () => {
    const target = content.confusables[0]!;
    let trues = 0;
    for (let seed = 0; seed < 400; seed++)
      if (
        generateConfusableTrueFalse(target, content.confusables, mulberry32(seed))
          .isTrue
      )
        trues++;
    expect(trues).toBeGreaterThan(150);
    expect(trues).toBeLessThan(250);
  });

  it("falls back to a true card when the pool holds nothing to confuse it with", () => {
    const target = content.confusables[0]!;
    for (let seed = 0; seed < 10; seed++) {
      const tf = generateConfusableTrueFalse(target, [target], mulberry32(seed));
      expect(tf).toMatchObject({ sound: target.r, isTrue: true });
    }
  });

  it("is deterministic for a given seed", () => {
    const target = content.confusables[0]!;
    const a = generateConfusableTrueFalse(target, content.confusables, mulberry32(3));
    const b = generateConfusableTrueFalse(target, content.confusables, mulberry32(3));
    expect(a).toEqual(b);
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
