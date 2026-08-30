import { describe, it, expect } from "vitest";
import {
  gradeRoleLabels,
  hasDroppedSubject,
  labelable,
  roleTargets,
  type CoreRole,
} from "./roleLabel";
import { sentenceById } from "../content";
import type { Chunk, Sentence } from "../types";

const mk = (ko: Chunk[]): Sentence => ({
  id: "s_test",
  en: ko,
  gloss: ko,
  ko,
  wordIds: [],
  note: "",
});

const labels = (pairs: [string, CoreRole][]) => new Map(pairs);

describe("roleTargets", () => {
  it("requires subject/object/place and the sentence-final verb", () => {
    const s = mk([
      { id: "s", t: "저는", role: "subject" },
      { id: "o", t: "물을", role: "object" },
      { id: "v", t: "마셔요", role: "verb" },
    ]);
    expect(roleTargets(s).map((t) => t.required)).toEqual([true, true, true]);
  });

  it("makes a clause-linking verb optional but a period-closed one required", () => {
    const s = mk([
      { id: "v1", t: "소파가 있고,", role: "verb" },
      { id: "v2", t: "피곤해요.", role: "verb" },
      { id: "c", t: "그래서", role: "other" },
      { id: "v", t: "가요", role: "verb" },
    ]);
    expect(roleTargets(s).map((t) => t.required)).toEqual([
      false,
      true,
      false,
      true,
    ]);
  });

  it("skips dropped (empty) chunks", () => {
    const s = mk([
      { id: "s", t: "", role: "subject" },
      { id: "v", t: "가요", role: "verb" },
    ]);
    expect(roleTargets(s).map((t) => t.chunk.id)).toEqual(["v"]);
    expect(hasDroppedSubject(s)).toBe(true);
  });
});

describe("labelable", () => {
  it("rejects one-piece sentences", () => {
    expect(labelable(mk([{ id: "v", t: "고마워요", role: "verb" }]))).toBe(
      false,
    );
  });

  it("accepts subject + verb", () => {
    expect(
      labelable(
        mk([
          { id: "s", t: "저는", role: "subject" },
          { id: "v", t: "학생이에요", role: "verb" },
        ]),
      ),
    ).toBe(true);
  });

  it("keeps a healthy share of the shipped corpus", () => {
    const all = [...sentenceById.values()];
    const n = all.filter(labelable).length;
    expect(n).toBeGreaterThan(all.length * 0.9);
  });
});

describe("gradeRoleLabels", () => {
  const sov = mk([
    { id: "s", t: "저는", role: "subject" },
    { id: "o", t: "물을", role: "object" },
    { id: "v", t: "마셔요", role: "verb" },
  ]);

  it("passes a complete correct labelling", () => {
    const g = gradeRoleLabels(
      sov,
      labels([
        ["s", "subject"],
        ["o", "object"],
        ["v", "verb"],
      ]),
    );
    expect(g.correct).toBe(true);
    expect(g.chunks.every((c) => c.ok)).toBe(true);
  });

  it("fails a swapped subject/object and reports which chunks", () => {
    const g = gradeRoleLabels(
      sov,
      labels([
        ["s", "object"],
        ["o", "subject"],
        ["v", "verb"],
      ]),
    );
    expect(g.correct).toBe(false);
    expect(g.chunks.map((c) => c.ok)).toEqual([false, false, true]);
    expect(g.chunks[0]).toMatchObject({ expected: "subject", given: "object" });
  });

  it("fails when a required part is left unlabelled", () => {
    const g = gradeRoleLabels(sov, labels([["s", "subject"], ["v", "verb"]]));
    expect(g.correct).toBe(false);
    expect(g.chunks[1]).toMatchObject({ ok: false, given: undefined });
  });

  it("fails when an 'other' chunk (time word, linking clause) is labelled", () => {
    const s = mk([
      { id: "t", t: "오늘은", role: "other" },
      { id: "c", t: "늦어서", role: "other" },
      { id: "v", t: "미안해요", role: "verb" },
    ]);
    expect(
      gradeRoleLabels(s, labels([["t", "subject"], ["v", "verb"]])).correct,
    ).toBe(false);
    expect(
      gradeRoleLabels(s, labels([["c", "verb"], ["v", "verb"]])).correct,
    ).toBe(false);
    expect(gradeRoleLabels(s, labels([["v", "verb"]])).correct).toBe(true);
  });

  it("accepts a clause-linking verb either labelled or left alone", () => {
    const s = mk([
      { id: "o", t: "상을", role: "object" },
      { id: "v1", t: "차려", role: "verb" },
      { id: "v", t: "놓았어요", role: "verb" },
    ]);
    expect(
      gradeRoleLabels(s, labels([["o", "object"], ["v", "verb"]])).correct,
    ).toBe(true);
    expect(
      gradeRoleLabels(
        s,
        labels([
          ["o", "object"],
          ["v1", "verb"],
          ["v", "verb"],
        ]),
      ).correct,
    ).toBe(true);
    // …but not labelled as something else, and the final verb stays required
    expect(
      gradeRoleLabels(
        s,
        labels([
          ["o", "object"],
          ["v1", "object"],
          ["v", "verb"],
        ]),
      ).correct,
    ).toBe(false);
    expect(
      gradeRoleLabels(s, labels([["o", "object"], ["v1", "verb"]])).correct,
    ).toBe(false);
  });

  it("accepts both halves of a double-subject sentence", () => {
    const s = sentenceById.get("s18_hansik_banchan")!; // 한식은 반찬이 많아요
    expect(
      gradeRoleLabels(
        s,
        labels([
          ["s", "subject"],
          ["o", "subject"],
          ["v", "verb"],
        ]),
      ).correct,
    ).toBe(true);
  });

  it("grades the shipped question sentences after the tag audit", () => {
    const s = sentenceById.get("s17_hobby_what")!; // 취미가 뭐예요?
    expect(
      gradeRoleLabels(s, labels([["v", "subject"], ["q", "verb"]])).correct,
    ).toBe(true);
  });
});
