// Unicode Hangul arithmetic. Modern syllables live at
// U+AC00 + (cho*21 + jung)*28 + jong, with jamo indexed in canonical order.
// Pure data + functions — no DOM, no React.

export const CHOSEONG = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
] as const;

export const JUNGSEONG = [
  "ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ",
  "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ",
] as const;

/** Index 0 is "no final consonant". */
export const JONGSEONG = [
  "", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ",
  "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
] as const;

/** first vowel part → second part → compound */
export const VOWEL_COMBOS: Record<string, Record<string, string>> = {
  ㅗ: { ㅏ: "ㅘ", ㅐ: "ㅙ", ㅣ: "ㅚ" },
  ㅜ: { ㅓ: "ㅝ", ㅔ: "ㅞ", ㅣ: "ㅟ" },
  ㅡ: { ㅣ: "ㅢ" },
};

/** first final consonant → second → compound batchim */
export const JONG_COMBOS: Record<string, Record<string, string>> = {
  ㄱ: { ㅅ: "ㄳ" },
  ㄴ: { ㅈ: "ㄵ", ㅎ: "ㄶ" },
  ㄹ: { ㄱ: "ㄺ", ㅁ: "ㄻ", ㅂ: "ㄼ", ㅅ: "ㄽ", ㅌ: "ㄾ", ㅍ: "ㄿ", ㅎ: "ㅀ" },
  ㅂ: { ㅅ: "ㅄ" },
};

const buildSplit = (
  combos: Record<string, Record<string, string>>,
): Record<string, [string, string]> => {
  const out: Record<string, [string, string]> = {};
  for (const [a, seconds] of Object.entries(combos))
    for (const [b, compound] of Object.entries(seconds)) out[compound] = [a, b];
  return out;
};

export const SPLIT_VOWEL = buildSplit(VOWEL_COMBOS);
export const SPLIT_JONG = buildSplit(JONG_COMBOS);

const SYLLABLE_BASE = 0xac00;
const SYLLABLE_END = 0xd7a3;

export const isSyllable = (ch: string): boolean => {
  const code = ch.charCodeAt(0);
  return ch.length === 1 && code >= SYLLABLE_BASE && code <= SYLLABLE_END;
};

const VOWELS = new Set<string>(JUNGSEONG);
export const isVowelJamo = (j: string): boolean => VOWELS.has(j);

const CHO_SET = new Set<string>(CHOSEONG);
export const canBeCho = (j: string): boolean => CHO_SET.has(j);

const JONG_SET = new Set<string>(JONGSEONG.filter((x) => x !== ""));
export const canBeJong = (j: string): boolean => JONG_SET.has(j);

export function composeSyllable(cho: string, jung: string, jong = ""): string {
  const ci = (CHOSEONG as readonly string[]).indexOf(cho);
  const ji = (JUNGSEONG as readonly string[]).indexOf(jung);
  const ti = (JONGSEONG as readonly string[]).indexOf(jong);
  if (ci < 0 || ji < 0 || ti < 0)
    throw new Error(`Cannot compose ${cho}+${jung}+${jong}`);
  return String.fromCharCode(SYLLABLE_BASE + (ci * 21 + ji) * 28 + ti);
}

export function decomposeSyllable(
  ch: string,
): { cho: string; jung: string; jong: string } | null {
  if (!isSyllable(ch)) return null;
  const offset = ch.charCodeAt(0) - SYLLABLE_BASE;
  return {
    cho: CHOSEONG[Math.floor(offset / (21 * 28))]!,
    jung: JUNGSEONG[Math.floor(offset / 28) % 21]!,
    jong: JONGSEONG[offset % 28]!,
  };
}
