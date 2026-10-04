export type TranslationDirection = "en-to-ko" | "ko-to-en";

/** Hangul in the submitted text selects the source language. */
export function directionForInput(input: string): TranslationDirection {
  return /[\uac00-\ud7a3\u1100-\u11ff\u3130-\u318f]/u.test(input) ? "ko-to-en" : "en-to-ko";
}
