import { describe, expect, it } from "vitest";
import { moduleLabels } from "./moduleLabel";
import type { Module } from "../types";

const mod = (id: string, wordIds: string[] = ["w"]): Module => ({
  id,
  title: `title ${id}`,
  order: 1,
  contentMd: `modules/${id}.md`,
  wordIds,
  sentenceIds: [],
});

describe("moduleLabels", () => {
  it("numbers vocab modules and readings separately", () => {
    // A reading between two modules must not shift the module numbers.
    expect(
      moduleLabels([mod("m1"), mod("r1", []), mod("m2"), mod("r2", [])]),
    ).toEqual({
      m1: "Module 1",
      r1: "Reading 1",
      m2: "Module 2",
      r2: "Reading 2",
    });
  });

  it("keeps appendices out of the numbered course", () => {
    expect(moduleLabels([mod("m1"), mod("s1"), mod("m2")])).toEqual({
      m1: "Module 1",
      s1: "Appendix S1",
      m2: "Module 2",
    });
  });
});
