import { afterEach, describe, expect, it, vi } from "vitest";
import { translateCourse } from "../src/features/explore/course-api";
import { translateOutcomeSchema } from "../src/features/explore/translation-contract";
import { lookupSubmittedSentence, sentenceSurface } from "../src/lib/corpus-translator";
import { untaughtWords } from "../src/lib/course-input";
import { allSentences } from "../src/content";
import recombinationSet from "../reference/eval/recombination-dev-set.json";

afterEach(() => vi.unstubAllGlobals());

describe("course adapter", () => {
  it("returns the shared contract and reviewed gap without network access", () => {
    const fetch = vi.fn(() => { throw new Error("Network forbidden"); });
    vi.stubGlobal("fetch", fetch);
    const outcome = translateCourse("친구가 학교에 가요");
    expect(translateOutcomeSchema.parse(outcome)).toEqual(outcome);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) throw new Error("Expected reviewed translation");
    expect(outcome.result.natural_english).toBe("My friend goes to school");
    expect(outcome.result.literal_gap).not.toBe("");
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(["quantum spaceship", "저는 우주젤리를 마셔요", "물을 저는 마셔요"])(
    "refuses %s without guessing", input => {
      const outcome = translateCourse(input);
      expect(translateOutcomeSchema.parse(outcome)).toEqual(outcome);
      expect(outcome).toMatchObject({ ok: false, error: { code: "outside-course" } });
    });

  // BAD-274 defect 1: the refusal must name the untaught word, not echo the input.
  describe("names the untaught word instead of echoing the input", () => {
    const outOfCourse = recombinationSet.items.filter(item => item.itemClass === "out-of-course");

    it.each(outOfCourse)("identifies the untaught word in $input", item => {
      const outcome = translateCourse(item.input);
      expect(outcome.ok).toBe(false);
      if (outcome.ok) throw new Error("Expected a refusal");
      const expected = item.unresolved!.map(entry => entry.text);
      expect(outcome.error.untaught?.map(entry => entry.word)).toEqual(expected);
      for (const word of expected) expect(outcome.error.message).toContain(word);
      // The whole submitted sentence is no longer the diagnosis.
      expect(outcome.error.message).not.toContain(item.input);
    });

    it("keeps the typed token alongside the word it looked up", () => {
      const outcome = translateCourse("저는 양자컴퓨터를 봐요");
      if (outcome.ok) throw new Error("Expected a refusal");
      expect(outcome.error.untaught).toEqual([{ token: "양자컴퓨터를", word: "양자컴퓨터" }]);
    });

    it("names no word on any item the frozen set records as having none", () => {
      // Classes 1 and 3: the frozen set gives these no `unresolved` entry, so
      // naming a word on one would be a claim the set says is not there.
      for (const item of recombinationSet.items) {
        if (item.unresolved || !/[가-힣]/.test(item.input)) continue;
        const outcome = translateCourse(item.input);
        if (outcome.ok) continue; // a near-miss that happens to be a stored sentence
        expect(outcome.error.untaught, item.id).toEqual([]);
        expect(outcome.error.message, item.id).toContain("Every word here is taught");
      }
    });

    it("does not name a conjugated form of a taught verb", () => {
      // 차요 is 차다 (w_chada, taught) inflected; 마셨어요 is 마시다 inflected.
      // Deconjugation is not attempted, so neither is named.
      for (const input of ["저는 공을 차요", "저는 물을 마셨어요"]) {
        expect(untaughtWords(input), input).toEqual([]);
      }
    });

    it("never calls a word of a reviewed sentence untaught", () => {
      // The one-sided guarantee: no stored sentence may produce a false claim.
      const offenders = allSentences
        .map(sentence => [sentence.id, untaughtWords(sentenceSurface(sentence.ko))] as const)
        .filter(([, untaught]) => untaught.length > 0);
      expect(offenders).toEqual([]);
    });

    it("tells an English submission that English is not supported", () => {
      const outcome = translateCourse("I drink water");
      if (outcome.ok) throw new Error("Expected a refusal");
      expect(outcome.error.untaught).toEqual([]);
      expect(outcome.error.message).toContain("English input is not supported");
    });
  });

  // BAD-274 defect 2: normalize the submitted input before lookup.
  describe("normalizes the submitted input before lookup", () => {
    it.each([
      ["a trailing space", "저는 물을 마셔요 "],
      ["a leading space", " 저는 물을 마셔요"],
      ["a doubled space", "저는  물을 마셔요"],
      ["a non-breaking space", "저는 물을 마셔요"],
      ["a zero-width space", "저는 물을 마셔요​"],
      ["decomposed jamo", "저는 물을 마셔요".normalize("NFD")],
    ])("accepts a stored sentence with %s", (_label, input) => {
      const outcome = translateCourse(input);
      expect(translateOutcomeSchema.parse(outcome)).toEqual(outcome);
      expect(outcome.ok).toBe(true);
      if (!outcome.ok) throw new Error("Expected the stored sentence");
      expect(outcome.result.korean).toBe("저는 물을 마셔요");
    });

    it("accepts a stored sentence whose terminal mark is missing or added", () => {
      expect(translateCourse("지금 몇 시예요").ok).toBe(true);
      const added = translateCourse("저는 물을 마셔요!");
      expect(added.ok).toBe(true);
      if (!added.ok) throw new Error("Expected the stored sentence");
      expect(added.result.korean).toBe("저는 물을 마셔요");
    });

    it("accepts a stored sentence spaced differently", () => {
      const outcome = translateCourse("저는물을 마셔요");
      expect(outcome.ok).toBe(true);
      if (!outcome.ok) throw new Error("Expected the stored sentence");
      expect(outcome.result.korean).toBe("저는 물을 마셔요");
    });

    it("refuses rather than choosing when a relaxed key matches two sentences", () => {
      // 걱정하지 마세요 and 걱정하지 마세요! are both stored, so the spacing key
      // is ambiguous — the exact forms still resolve to one sentence each.
      expect(translateCourse("걱정하지마세요")).toMatchObject({
        ok: false, error: { code: "ambiguous-course" },
      });
      expect(translateCourse("걱정하지 마세요").ok).toBe(true);
      expect(translateCourse("걱정하지 마세요!").ok).toBe(true);
    });

    it("answers every stored sentence through the submitted boundary", () => {
      const refused = allSentences
        .map(sentence => [sentence.id, lookupSubmittedSentence(sentenceSurface(sentence.ko))] as const)
        .filter(([, outcome]) => outcome.status !== "translated")
        .map(([id]) => id);
      expect(refused).toEqual([]);
    });

    it("does not widen coverage: a normalized near-miss is still refused", () => {
      for (const input of ["저는 우유를 마셔요", "저는 물을 마셔", "물 마셔요"]) {
        expect(translateCourse(input), input).toMatchObject({ ok: false });
      }
    });
  });
});
