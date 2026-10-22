import { describe, expect, it } from "vitest";
import gapJson from "../content/gap.json";
import sentencesJson from "../content/sentences.json";
import { sentenceSchema, translationResultSchema } from "./schemas";
import { romanize } from "./romanize";
import { particlesIn } from "./translation-postprocess";
import {
  assembleCorpusSentence, sentenceSurface, translateCorpusSentence,
} from "./corpus-translator";

const sentences = sentenceSchema.array().parse(sentencesJson);
const water = sentences.find(sentence => sentence.id === "s_water")!;

describe("exact course-sentence translator", () => {
  it("copies a reviewed SOV gloss and natural English without changing the contract", () => {
    const outcome = translateCorpusSentence("저는 물을 마셔요");
    expect(outcome.status).toBe("translated");
    if (outcome.status !== "translated") return;
    expect(outcome.sentenceId).toBe("s_water");
    expect(outcome.result).toEqual({
      direction: "ko-to-en",
      korean: "저는 물을 마셔요",
      romanization: romanize("저는 물을 마셔요"),
      natural_english: "I drink water",
      gloss: [
        { chunk: "저는", gloss: "I-[as for]", role: "subject" },
        { chunk: "물을", gloss: "water-[obj]", role: "object" },
        { chunk: "마셔요", gloss: "drink", role: "verb" },
      ],
      particles: particlesIn("저는 물을 마셔요"),
      literal_gap: "",
      cultural_note: "",
    });
    expect(translationResultSchema.safeParse(outcome.result).success).toBe(true);
  });

  it("aligns stored gloss by ID, not array position", () => {
    expect(assembleCorpusSentence({ ...water, gloss: [...water.gloss].reverse() }))
      .toEqual(assembleCorpusSentence(water));
  });

  it("retains reviewed glosses for invisible Korean chunks", () => {
    const sentence = sentences.find(row => row.ko.some(chunk => chunk.t === ""))!;
    const outcome = assembleCorpusSentence(sentence);
    expect(outcome.status).toBe("translated");
    if (outcome.status !== "translated") return;
    const dropped = sentence.ko.find(chunk => chunk.t === "")!;
    expect(outcome.result.gloss).toContainEqual({
      chunk: "", gloss: sentence.gloss.find(chunk => chunk.id === dropped.id)!.t,
      role: dropped.role,
    });
    expect(outcome.result.korean).toBe(sentenceSurface(sentence.ko));
  });

  it("refuses competing interpretations without selecting the first homograph", () => {
    const duplicate = { ...water, id: "competing-source", en: [...water.en].reverse() };
    expect(translateCorpusSentence("저는 물을 마셔요", [water, duplicate])).toEqual({
      status: "refused", reason: "ambiguous-match",
      unresolvedInput: "저는 물을 마셔요", sentenceIds: ["s_water", "competing-source"],
    });
  });

  it.each([
    "", " ", "저는 우주젤리를 마셔요", "저는물을 마셔요", "저는 물을 마셔요!",
    "저는 물을 마셔요 ", " 저는 물을 마셔요", "저는  물을 마셔요",
    "물을 저는 마셔요", "저는 물을 마셔요".normalize("NFD"),
  ])("refuses unmatched input verbatim: %j", input => {
    expect(translateCorpusSentence(input)).toEqual({
      status: "refused", reason: "no-exact-match", unresolvedInput: input, sentenceIds: [],
    });
  });

  it("refuses missing or duplicate alignment instead of guessing", () => {
    for (const gloss of [water.gloss.slice(1), [water.gloss[0], water.gloss[0], water.gloss[2]]]) {
      expect(assembleCorpusSentence({ ...water, gloss })).toMatchObject({
        status: "refused", reason: "invalid-source", sentenceIds: ["s_water"],
      });
    }
  });

  it("returns fresh results without mutating source data", () => {
    const before = JSON.stringify(water);
    const outcome = translateCorpusSentence("저는 물을 마셔요", [water]);
    if (outcome.status !== "translated") throw new Error("Expected stored match");
    outcome.result.gloss[0].gloss = "changed";
    expect(JSON.stringify(water)).toBe(before);
    expect(translateCorpusSentence("저는 물을 마셔요", [water])).toEqual(assembleCorpusSentence(water));
  });

  it("assembles every unique stored surface and refuses every duplicate surface", () => {
    // Contract/provenance regression only; this is not novel-input evaluation.
    for (const sentence of sentences) {
      const input = sentenceSurface(sentence.ko);
      const matches = sentences.filter(row => sentenceSurface(row.ko) === input);
      const outcome = translateCorpusSentence(input);
      if (matches.length > 1) {
        expect(outcome, sentence.id).toMatchObject({ status: "refused", reason: "ambiguous-match" });
      } else {
        expect(outcome.status, sentence.id).toBe("translated");
        if (outcome.status !== "translated") continue;
        expect(translationResultSchema.safeParse(outcome.result).success, sentence.id).toBe(true);
        expect(outcome.result.natural_english).toBe(sentenceSurface(sentence.en));
        expect(outcome.result.gloss.map(chunk => chunk.gloss))
          .toEqual(sentence.ko.map(chunk => sentence.gloss.find(row => row.id === chunk.id)!.t));
        if (outcome.result.literal_gap === "") {
          expect(outcome.result.cultural_note).toBe("");
        } else {
          expect(gapJson.some(entry =>
            outcome.result.literal_gap === `${entry.lit} → ${entry.real}` &&
            outcome.result.cultural_note === entry.note)).toBe(true);
        }
      }
    }
  });
});
