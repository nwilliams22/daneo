import { z } from "zod";
import { translationResultSchema } from "../../lib/schemas";

// Both transport boundaries validate errors before the UI can render them.
export const translateErrorSchema = z.object({
  code: z.enum([
    "no-server", "server", "no-key", "bad-input", "upstream",
    "bad-json", "invalid-shape", "desktop-required", "model-missing",
    "model-corrupt", "allocation-failed", "generation-failed", "cancelled",
    "invalid-input", "busy", "outside-course", "ambiguous-course", "invalid-course",
  ]),
  message: z.string(),
  // Course refusals only: what was looked up after normalization, and the
  // words the course contains nowhere. Absent on the transport adapters.
  submitted: z.string().optional(),
  untaught: z.array(z.object({ token: z.string(), word: z.string() })).optional(),
});

export const translateOutcomeSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true), result: translationResultSchema }),
  z.object({ ok: z.literal(false), error: translateErrorSchema }),
]);

export type TranslateError = z.infer<typeof translateErrorSchema>;
export type TranslateOutcome = z.infer<typeof translateOutcomeSchema>;
