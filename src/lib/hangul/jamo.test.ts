import { describe, it, expect } from "vitest";
import {
  CHOSEONG,
  JUNGSEONG,
  JONGSEONG,
  composeSyllable,
  decomposeSyllable,
  isSyllable,
  VOWEL_COMBOS,
  JONG_COMBOS,
  SPLIT_VOWEL,
  SPLIT_JONG,
} from "./jamo";

describe("jamo tables", () => {
  it("have canonical Unicode sizes", () => {
    expect(CHOSEONG).toHaveLength(19);
    expect(JUNGSEONG).toHaveLength(21);
    expect(JONGSEONG).toHaveLength(28);
  });

  it("compose/decompose round-trips the entire modern syllable range", () => {
    for (let code = 0xac00; code <= 0xd7a3; code++) {
      const ch = String.fromCharCode(code);
      const d = decomposeSyllable(ch)!;
      expect(composeSyllable(d.cho, d.jung, d.jong)).toBe(ch);
    }
  });

  it("composes known examples", () => {
    expect(composeSyllable("ㅎ", "ㅏ", "ㄴ")).toBe("한");
    expect(composeSyllable("ㄱ", "ㅜ", "ㄱ")).toBe("국");
    expect(composeSyllable("ㅇ", "ㅓ")).toBe("어");
    expect(composeSyllable("ㄱ", "ㅏ", "ㅄ")).toBe("값");
    expect(composeSyllable("ㄱ", "ㅘ")).toBe("과");
  });

  it("rejects non-syllables", () => {
    expect(decomposeSyllable("ㄱ")).toBeNull();
    expect(decomposeSyllable("a")).toBeNull();
    expect(isSyllable("한")).toBe(true);
    expect(isSyllable("ㅎ")).toBe(false);
  });

  it("compound tables are bidirectional", () => {
    for (const [a, seconds] of Object.entries(VOWEL_COMBOS))
      for (const [b, compound] of Object.entries(seconds))
        expect(SPLIT_VOWEL[compound]).toEqual([a, b]);
    for (const [a, seconds] of Object.entries(JONG_COMBOS))
      for (const [b, compound] of Object.entries(seconds))
        expect(SPLIT_JONG[compound]).toEqual([a, b]);
  });
});
