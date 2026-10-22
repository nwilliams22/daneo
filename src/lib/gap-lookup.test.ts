import { describe, expect, it } from "vitest";
import gapJson from "../content/gap.json";
import { findReviewedGap, gapAlternatives, lookupGap } from "./gap-lookup";
import { translateCorpusSentence } from "./corpus-translator";

const row = (id: string) => gapJson.find(entry => entry.id === id)!;
const empty = { literal_gap: "", cultural_note: "" };

describe("reviewed gap lookup", () => {
  it("copies a clean pattern without matching a substring inside it", () => {
    expect(findReviewedGap("맛있어요")?.id).toBe("g_masisseoyo");
    expect(lookupGap("맛있어요")).toEqual({
      literal_gap: `${row("g_masisseoyo").lit} → ${row("g_masisseoyo").real}`,
      cultural_note: row("g_masisseoyo").note,
    });
  });

  it.each(["시간이 있어요", "시간이 없어요"])("matches slash alternatives: %s", input => {
    expect(findReviewedGap(input)?.id).toBe("g_isseoyo");
  });

  it("matches middle-dot alternatives literally", () => {
    expect(gapAlternatives("여기 · 거기 · 저기")).toEqual(["여기", "거기", "저기"]);
    expect(findReviewedGap("거기")?.ko).toBe("여기 · 거기 · 저기");
  });

  it("prefers the longest alternative regardless of input order", () => {
    for (const input of ["있어요 맛있어요", "맛있어요 있어요"]) {
      expect(findReviewedGap(input)?.id).toBe("g_masisseoyo");
    }
    expect(findReviewedGap("갈 수 있어요")?.ko).toBe("갈 수 있어요");
  });

  it("resolves duplicate surfaces by ascending entry ID", () => {
    const duplicates = gapJson.filter(entry => entry.ko === "화이팅!");
    expect(duplicates.length).toBeGreaterThan(1);
    expect(findReviewedGap("화이팅!")?.id).toBe(duplicates.map(entry => entry.id).sort()[0]);
  });

  it.each(["", "저는 물을 마셔요", "맛있어요가", "멋있어요", "없어요x", "정말", "있어요\u0301"])
    ("leaves both fields empty for absent or near matches: %j", input => {
      expect(lookupGap(input)).toEqual(empty);
    });

  it("preserves punctuation and does not infer grammatical notation", () => {
    expect(lookupGap("화이팅")).toEqual(empty);
    expect(gapAlternatives("-을/를 제외하고")).toEqual([]);
    expect(gapAlternatives("○○ 씨")).toEqual([]);
    expect(findReviewedGap("(맛있어요!)")?.id).toBe("g_masisseoyo");
  });

  it("emits only character-identical reviewed fields across all 420 entries", () => {
    expect(gapJson).toHaveLength(420);
    for (const source of gapJson) {
      for (const surface of gapAlternatives(source.ko)) {
        const winner = findReviewedGap(surface)!;
        expect(winner).toBeDefined();
        expect(gapJson.some(entry => entry.id === winner.id &&
          entry.lit === winner.lit && entry.real === winner.real && entry.note === winner.note)).toBe(true);
        // Check whole fields, not split text: reviewed fields may contain separators.
        expect(lookupGap(surface)).toEqual({
          literal_gap: `${winner.lit} → ${winner.real}`, cultural_note: winner.note,
        });
      }
    }
  });

  it("attaches the reviewed contrast to a real course translation", () => {
    const result = translateCorpusSentence("물이 있어요");
    expect(result.status).toBe("translated");
    if (result.status !== "translated") return;
    expect(result.result.literal_gap).toBe(`${row("g_isseoyo").lit} → ${row("g_isseoyo").real}`);
    expect(result.result.cultural_note).toBe(row("g_isseoyo").note);
  });
});
