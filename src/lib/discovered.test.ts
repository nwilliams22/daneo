import { describe, expect, it } from "vitest";
import { discoveredGapItem, discoveredGapItems } from "./discovered";
import type { SavedTranslation, TranslationResult } from "../types";

const RESULT: TranslationResult = {
  direction: "en-to-ko",
  korean: "수고하셨습니다",
  romanization: "sugohasyeosseumnida",
  natural_english: "good work today",
  gloss: [
    { chunk: "수고", gloss: "hardship", role: "object" },
    { chunk: "하셨습니다", gloss: "did-[honorific]", role: "verb" },
  ],
  particles: [],
  literal_gap: "Literally 'you underwent hardship' — it thanks effort itself.",
  cultural_note: "",
};

const saved = (
  id: number | undefined,
  result: TranslationResult,
): SavedTranslation => ({ id, savedAt: 1, result });

describe("translator save-to-deck (PROJECT.md §5)", () => {
  it("converts a saved translation with a gap into a GapItem", () => {
    const g = discoveredGapItem(saved(7, RESULT));
    expect(g).not.toBeNull();
    expect(g!.id).toBe("disc_7");
    expect(g!.ko).toBe(RESULT.korean);
    expect(g!.real).toBe(RESULT.natural_english);
    expect(g!.lit).toBe("hardship did-[honorific]"); // gloss layer, joined
    expect(g!.note).toBe(RESULT.literal_gap);
    expect(g!.cat).toBe("phrase");
  });

  it("skips translations without a literal gap", () => {
    const noGap = { ...RESULT, literal_gap: "  " };
    expect(discoveredGapItem(saved(1, noGap))).toBeNull();
  });

  it("skips unsaved rows (no id yet)", () => {
    expect(discoveredGapItem(saved(undefined, RESULT))).toBeNull();
  });

  it("falls back to the Korean when the gloss layer is empty", () => {
    const g = discoveredGapItem(saved(2, { ...RESULT, gloss: [] }));
    expect(g!.lit).toBe(RESULT.korean);
  });

  it("filters a mixed list down to gap-worthy items", () => {
    const items = discoveredGapItems([
      saved(1, RESULT),
      saved(2, { ...RESULT, literal_gap: "" }),
      saved(3, RESULT),
    ]);
    expect(items.map((g) => g.id)).toEqual(["disc_1", "disc_3"]);
  });
});
