import { describe, expect, it } from "vitest";
import {
  hasNoHangul, normalizeCourseInput, spacingKey, terminalMarkKey, untaughtWords,
} from "./course-input";

describe("normalizeCourseInput", () => {
  it.each([
    ["저는 물을 마셔요 ", "저는 물을 마셔요"],
    [" 저는 물을 마셔요", "저는 물을 마셔요"],
    ["저는  물을   마셔요", "저는 물을 마셔요"],
    ["저는 물을　마셔요", "저는 물을 마셔요"],
    ["저는 물을 마셔요​", "저는 물을 마셔요"],
    ["﻿저는 물을 마셔요", "저는 물을 마셔요"],
    ["저는\t물을\n마셔요", "저는 물을 마셔요"],
  ])("canonicalizes %j", (raw, expected) => {
    expect(normalizeCourseInput(raw)).toBe(expected);
  });

  it("composes decomposed jamo so visually identical Hangul compares equal", () => {
    const decomposed = "저는 물을 마셔요".normalize("NFD");
    expect(decomposed).not.toBe("저는 물을 마셔요");
    expect(normalizeCourseInput(decomposed)).toBe("저는 물을 마셔요");
  });

  it("keeps word boundaries and punctuation the corpus wrote", () => {
    expect(normalizeCourseInput("피곤해요. 그래서 집에 가요"))
      .toBe("피곤해요. 그래서 집에 가요");
    expect(normalizeCourseInput("지금 몇 시예요?")).toBe("지금 몇 시예요?");
  });
});

describe("relaxed lookup keys", () => {
  it("drops only a trailing terminal mark", () => {
    expect(terminalMarkKey("지금 몇 시예요?")).toBe("지금 몇 시예요");
    expect(terminalMarkKey("걱정하지 마세요!")).toBe("걱정하지 마세요");
    expect(terminalMarkKey("피곤해요. 그래서 집에 가요")).toBe("피곤해요. 그래서 집에 가요");
  });

  it("drops the spaces as well, and nothing else", () => {
    expect(spacingKey("저는 물을 마셔요")).toBe("저는물을마셔요");
    expect(spacingKey("피곤해요. 그래서 집에 가요")).toBe("피곤해요.그래서집에가요");
  });
});

describe("untaughtWords", () => {
  it("names an untaught noun under its case particle", () => {
    expect(untaughtWords("저는 양자컴퓨터를 봐요"))
      .toEqual([{ token: "양자컴퓨터를", word: "양자컴퓨터" }]);
    expect(untaughtWords("저는 스마트워치가 있어요"))
      .toEqual([{ token: "스마트워치가", word: "스마트워치" }]);
  });

  it("names a bare untaught noun as typed", () => {
    expect(untaughtWords("양자컴퓨터")).toEqual([{ token: "양자컴퓨터", word: "양자컴퓨터" }]);
  });

  it("names every untaught word once, in order", () => {
    expect(untaughtWords("저는 양자컴퓨터와 메타버스를 봐요").map(entry => entry.word))
      .toEqual(["양자컴퓨터", "메타버스"]);
    expect(untaughtWords("메타버스를 메타버스를")).toHaveLength(1);
  });

  it("claims nothing when every word is taught", () => {
    expect(untaughtWords("친구는 우유를 좋아해요")).toEqual([]);
    expect(untaughtWords("저는 집에서 음악을 들어요")).toEqual([]);
  });

  it("claims nothing about a predicate form, taught or not", () => {
    // Deconjugation is not attempted, so an inflected token is never named.
    for (const input of ["차요", "마셨어요", "공부하는", "먹을까요", "슬펐어요"]) {
      expect(untaughtWords(input), input).toEqual([]);
    }
  });

  it("ignores a token with no Hangul in it at all", () => {
    expect(untaughtWords("I drink water")).toEqual([]);
    expect(untaughtWords("water 물")).toEqual([]);
  });

  it("names a foreign-script or numeric form that carries a Korean particle", () => {
    // The course writes no Arabic numerals and no Latin headwords, so neither
    // form matches a course word — and saying which one did not is the point.
    expect(untaughtWords("저는 KTX를 타요")).toEqual([{ token: "KTX를", word: "KTX" }]);
    expect(untaughtWords("저는 2시에 가요")).toEqual([{ token: "2시에", word: "2시" }]);
  });

  it("is unaffected by punctuation or invisible whitespace", () => {
    expect(untaughtWords(" 저는 양자컴퓨터를 봐요! "))
      .toEqual([{ token: "양자컴퓨터를", word: "양자컴퓨터" }]);
  });
});

describe("hasNoHangul", () => {
  it.each(["I drink water", "123", "", "   "])("is true for %j", input => {
    expect(hasNoHangul(input)).toBe(true);
  });

  it.each(["저는 물을 마셔요", "mixed 물"])("is false for %j", input => {
    expect(hasNoHangul(input)).toBe(false);
  });
});
