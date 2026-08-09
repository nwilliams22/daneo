import { describe, expect, it } from "vitest";
import { diffTyping, firstArrangeMismatch, jamoContrast } from "./feedback";
import { confusables } from "../content";
import type { Chunk } from "../types";

describe("diffTyping", () => {
  it("matches an identical answer", () => {
    expect(diffTyping("물", "물")).toEqual([{ type: "match", ch: "물" }]);
  });

  it("finds a single wrong vowel with its jamo slot", () => {
    const ops = diffTyping("게", "개");
    expect(ops).toEqual([
      {
        type: "sub",
        typed: "게",
        answer: "개",
        jamo: [{ slot: "jung", typed: "ㅔ", answer: "ㅐ" }],
      },
    ]);
  });

  it("finds a wrong batchim", () => {
    const ops = diffTyping("감니다", "갑니다");
    expect(ops[0]).toEqual({
      type: "sub",
      typed: "감",
      answer: "갑",
      jamo: [{ slot: "jong", typed: "ㅁ", answer: "ㅂ" }],
    });
    expect(ops.slice(1)).toEqual([
      { type: "match", ch: "니" },
      { type: "match", ch: "다" },
    ]);
  });

  it("reports a missing batchim as an empty typed slot", () => {
    expect(diffTyping("가", "갈")).toEqual([
      {
        type: "sub",
        typed: "가",
        answer: "갈",
        jamo: [{ slot: "jong", typed: "", answer: "ㄹ" }],
      },
    ]);
  });

  it("reports an extra batchim as an empty answer slot", () => {
    expect(diffTyping("갈", "가")).toEqual([
      {
        type: "sub",
        typed: "갈",
        answer: "가",
        jamo: [{ slot: "jong", typed: "ㄹ", answer: "" }],
      },
    ]);
  });

  it("diffs compound vowels as one slot", () => {
    expect(diffTyping("완", "원")).toEqual([
      {
        type: "sub",
        typed: "완",
        answer: "원",
        jamo: [{ slot: "jung", typed: "ㅘ", answer: "ㅝ" }],
      },
    ]);
  });

  it("lists every differing slot of an unrelated syllable", () => {
    const [op] = diffTyping("물", "개");
    expect(op).toMatchObject({ type: "sub" });
    if (op?.type === "sub")
      expect(op.jamo.map((d) => d.slot)).toEqual(["cho", "jung", "jong"]);
  });

  it("does not cascade after a dropped syllable", () => {
    expect(diffTyping("어요", "없어요")).toEqual([
      { type: "missing", answer: "없" },
      { type: "match", ch: "어" },
      { type: "match", ch: "요" },
    ]);
  });

  it("flags an extra trailing syllable", () => {
    expect(diffTyping("가요요", "가요")).toEqual([
      { type: "match", ch: "가" },
      { type: "match", ch: "요" },
      { type: "extra", typed: "요" },
    ]);
  });

  it("flags a missing space in a phrase", () => {
    expect(diffTyping("잘지냈어요", "잘 지냈어요")).toEqual([
      { type: "match", ch: "잘" },
      { type: "missing", answer: " " },
      { type: "match", ch: "지" },
      { type: "match", ch: "냈" },
      { type: "match", ch: "어" },
      { type: "match", ch: "요" },
    ]);
  });

  it("substitutes non-Hangul characters without jamo detail", () => {
    expect(diffTyping("가!", "가?")).toEqual([
      { type: "match", ch: "가" },
      { type: "sub", typed: "!", answer: "?", jamo: [] },
    ]);
  });
});

describe("jamoContrast", () => {
  it("returns both items for a same-group confusable pair", () => {
    const hit = jamoContrast("ㅔ", "ㅐ", confusables);
    expect(hit?.typed.r).toBe("e");
    expect(hit?.answer.r).toBe("ae");
    expect(hit?.answer.note).toBeTruthy();
  });

  it("returns null across groups", () => {
    // ㅘ is a compound, ㅏ a plain vowel — related shapes, different groups
    expect(jamoContrast("ㅘ", "ㅏ", confusables)).toBeNull();
  });

  it("returns null for jamo the confusables set doesn't cover", () => {
    expect(jamoContrast("ㄺ", "ㄹ", confusables)).toBeNull();
  });
});

describe("firstArrangeMismatch", () => {
  const chunk = (id: string, t: string): Chunk => ({
    id,
    t,
    role: "other",
  });

  it("finds the first diverging slot", () => {
    const answer = [chunk("a", "저는"), chunk("b", "물을"), chunk("c", "마셔요")];
    const placed = [chunk("a", "저는"), chunk("c", "마셔요"), chunk("b", "물을")];
    const mm = firstArrangeMismatch(placed, answer);
    expect(mm?.index).toBe(1);
    expect(mm?.placed.t).toBe("마셔요");
    expect(mm?.answer.t).toBe("물을");
  });

  it("returns null when the arrangement is correct", () => {
    const answer = [chunk("a", "저는"), chunk("b", "마셔요")];
    expect(firstArrangeMismatch(answer, answer)).toBeNull();
  });
});
