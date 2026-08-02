import { describe, it, expect } from "vitest";
import {
  composerReduce,
  renderComposer,
  EMPTY_COMPOSER,
  type ComposerState,
} from "./composer";
import { jamoForKey } from "./keymap";

/** Type a string of QWERTY letters (uppercase = shifted) through the keymap. */
function type(keys: string, from: ComposerState = EMPTY_COMPOSER): ComposerState {
  let state = from;
  for (const ch of keys) {
    const shift = ch === ch.toUpperCase() && ch !== ch.toLowerCase();
    const jamo = jamoForKey(`Key${ch.toUpperCase()}`, shift);
    if (!jamo) throw new Error(`No jamo for ${ch}`);
    state = composerReduce(state, { type: "jamo", jamo });
  }
  return state;
}

const typed = (keys: string) => renderComposer(type(keys));

describe("2-beolsik composition", () => {
  it("builds simple syllables", () => {
    expect(typed("dks")).toBe("안"); // ㅇㅏㄴ
    expect(typed("anf")).toBe("물"); // ㅁㅜㄹ
    expect(typed("qkq")).toBe("밥");
  });

  it("builds multi-syllable words", () => {
    expect(typed("gksrnrdj")).toBe("한국어");
    expect(typed("dnfl")).toBe("우리");
    expect(typed("tkfka")).toBe("사람");
    expect(typed("aktudy")).toBe("마셔요"); // ㅁㅏㅅ+ㅕ migrates the ㅅ
  });

  it("handles batchim migration (the stolen final)", () => {
    // ㄱㅏㅇ = 강, then ㅏ steals the ㅇ → 가아
    expect(typed("rkdk")).toBe("가아");
    // 집 + ㅔ → 지베 (typing 집에 without the silent ㅇ placeholder)
    expect(typed("wlqp")).toBe("지베");
  });

  it("splits compound batchim on migration (값+ㅣ→갑시)", () => {
    expect(typed("rkqtl")).toBe("갑시"); // ㄱㅏㅂㅅ = 값, +ㅣ → 갑시
  });

  it("forms compound batchim and compound vowels", () => {
    expect(typed("rkqt")).toBe("값"); // ㄱㅏㅂ+ㅅ → ㅄ
    expect(typed("rhk")).toBe("과"); // ㄱㅗ+ㅏ → ㅘ
    expect(typed("dhl")).toBe("외"); // ㅇㅗ+ㅣ → ㅚ
    expect(typed("dml")).toBe("의"); // ㅇㅡ+ㅣ → ㅢ
  });

  it("supports the shift layer", () => {
    expect(typed("Rk")).toBe("까"); // ⇧ㄱ=ㄲ + ㅏ
    expect(typed("Tkf")).toBe("쌀");
    expect(typed("dO")).toBe("얘"); // ㅇ + ⇧ㅐ=ㅒ
    expect(typed("dho")).toBe("왜"); // ㅇ + ㅗ+ㅐ→ㅙ
  });

  it("commits bare consonants when no vowel follows", () => {
    expect(typed("qw")).toBe("ㅂㅈ");
  });

  it("keeps bare vowels standalone and compounds them", () => {
    expect(typed("hk")).toBe("ㅘ"); // ㅗ then ㅏ with no consonant
    expect(typed("kk")).toBe("ㅏㅏ"); // no combo → two bare vowels
  });

  it("types real vocabulary from the word list", () => {
    expect(typed("djqtdjdy")).toBe("없어요");
    expect(typed("dkssudgktpdy")).toBe("안녕하세요");
    expect(typed("rhakdnjdy")).toBe("고마워요"); // ㄱㅗㅁㅏㅇㅜㅓㅇㅛ — ㅜ+ㅓ→ㅝ
    expect(typed("clsrn")).toBe("친구");
  });

  it("backspace removes one jamo at a time", () => {
    let s = type("djqt"); // 없
    expect(renderComposer(s)).toBe("없");
    s = composerReduce(s, { type: "backspace" });
    expect(renderComposer(s)).toBe("업");
    s = composerReduce(s, { type: "backspace" });
    expect(renderComposer(s)).toBe("어");
    s = composerReduce(s, { type: "backspace" });
    expect(renderComposer(s)).toBe("ㅇ");
    s = composerReduce(s, { type: "backspace" });
    expect(renderComposer(s)).toBe("");
    s = composerReduce(s, { type: "backspace" }); // no-op on empty
    expect(renderComposer(s)).toBe("");
  });

  it("backspace re-opens committed syllables at the jamo level", () => {
    let s = type("gksrnr"); // 한국
    expect(renderComposer(s)).toBe("한국");
    s = composerReduce(s, { type: "backspace" }); // pop ㄱ of 국
    expect(renderComposer(s)).toBe("한구");
    s = composerReduce(s, { type: "backspace" }); // pop ㅜ
    expect(renderComposer(s)).toBe("한ㄱ");
  });

  it("backspace decomposes compound vowels one part at a time", () => {
    let s = type("rhk"); // 과
    s = composerReduce(s, { type: "backspace" });
    expect(renderComposer(s)).toBe("고");
    s = composerReduce(s, { type: "backspace" });
    expect(renderComposer(s)).toBe("ㄱ");
  });

  it("space commits the current syllable", () => {
    let s = type("dks");
    s = composerReduce(s, { type: "space" });
    s = type("dks", s);
    expect(renderComposer(s)).toBe("안 안");
  });

  it("clear empties everything", () => {
    const s = composerReduce(type("gksrnrdj"), { type: "clear" });
    expect(renderComposer(s)).toBe("");
  });
});
