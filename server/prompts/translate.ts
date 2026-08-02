import { translationResultSchema } from "../../src/lib/schemas.ts";
import type { TranslationResult } from "../../src/types.ts";

// The translator prompt contract (PROJECT.md §3). This file is pure — no
// network, no env — so the §6.3 contract tests can import it directly.
// The JSON shape must stay in lockstep with translationResultSchema, which
// is the single source of truth shared with the client.

export function buildTranslatePrompt(input: string): string {
  return `You are the translation engine inside a word-first Korean learning app. The learner knows Hangul and basic particles. Given the input below (either English or Korean), respond with ONLY a JSON object — no markdown fences, no preamble — with these fields:

{
  "direction": "en-to-ko" or "ko-to-en",
  "korean": "the Korean sentence in polite -요 form (Hangul)",
  "romanization": "romanization of the Korean",
  "natural_english": "natural English meaning",
  "gloss": [
    {"chunk": "Korean word/chunk in Hangul", "gloss": "English-in-Korean-order gloss, writing particles as suffixes like 'store-to' or 'water-[obj]'", "role": "subject|object|place|verb|other"}
  ],
  "particles": [
    {"particle": "the particle in Hangul", "job": "one short sentence on what it does here"}
  ],
  "literal_gap": "If the literal word-for-word meaning differs from the real meaning (e.g. idioms, cultural formulas, exist-style 'have'), explain the gap in 1-2 sentences. If it maps directly, use an empty string.",
  "cultural_note": "1-2 sentences of cultural/usage context if genuinely relevant, else empty string"
}

The gloss array must follow Korean word order. Keep every field concise. Input: "${input}"`;
}

export type ParseTranslationResult =
  | { ok: true; result: TranslationResult }
  | { ok: false; code: "bad-json" | "invalid-shape"; message: string };

/** Strip fences → JSON.parse → zod. Never throws (§6.3). */
export function parseTranslationText(text: string): ParseTranslationResult {
  const clean = text.replace(/```json|```/g, "").trim();
  let raw: unknown;
  try {
    raw = JSON.parse(clean);
  } catch {
    return {
      ok: false,
      code: "bad-json",
      message: "The model reply was not valid JSON.",
    };
  }
  const parsed = translationResultSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      ok: false,
      code: "invalid-shape",
      message: `The model reply did not match the contract${
        first ? ` (${first.path.join(".")}: ${first.message})` : ""
      }.`,
    };
  }
  return { ok: true, result: parsed.data as TranslationResult };
}
