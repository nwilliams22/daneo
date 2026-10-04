import promptTemplate from "../../src/lib/translation-prompt.json" with { type: "json" };
import { translationResultSchema } from "../../src/lib/schemas.ts";
import type { TranslationResult } from "../../src/types.ts";
import { directionForInput, type TranslationDirection } from "../../src/lib/translation-direction.ts";

// The translator prompt contract (PROJECT.md §3). This file is pure — no
// network, no env — so the §6.3 contract tests can import it directly.
// The JSON shape must stay in lockstep with translationResultSchema, which
// is the single source of truth shared with the client.

export function buildTranslatePrompt(input: string, direction: TranslationDirection = directionForInput(input)): string {
  return promptTemplate.replaceAll("{{DIRECTION}}", direction).replace("{{INPUT}}", () => input);
}

export type ParseTranslationResult =
  | { ok: true; result: TranslationResult }
  | { ok: false; code: "bad-json" | "invalid-shape"; message: string };

/** Strip fences → JSON.parse → zod. Never throws (§6.3). */
export function parseTranslationText(text: string, direction?: TranslationDirection): ParseTranslationResult {
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
  // The requested direction is application state, not a model judgment.
  if (direction && raw && typeof raw === "object" && !Array.isArray(raw)) {
    raw = { ...raw, direction };
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
