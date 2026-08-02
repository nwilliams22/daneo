import { translationResultSchema } from "../../lib/schemas";
import type { TranslationResult } from "../../types";

// Client half of the translator contract. The proxy validates the model
// output; we re-validate its response here so a bad server can never crash
// the UI (§6.3) — errors are typed, never thrown.

const IS_TAURI = "__TAURI_INTERNALS__" in window;
// Browser dev goes through the Vite proxy (same origin); the packaged app
// runs on a tauri:// origin and must hit the proxy directly.
const BASE = IS_TAURI || !import.meta.env.DEV ? "http://127.0.0.1:8787/api" : "/api";

export interface TranslateError {
  code: string;
  message: string;
}

export type TranslateOutcome =
  | { ok: true; result: TranslationResult }
  | { ok: false; error: TranslateError };

export async function translate(input: string): Promise<TranslateOutcome> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });
  } catch {
    return {
      ok: false,
      error: {
        code: "no-server",
        message:
          "Couldn't reach the translator server. Start it with `npm run server` (it keeps the API key out of the app).",
      },
    };
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    const err = (body as { error?: TranslateError } | null)?.error;
    return {
      ok: false,
      error: err ?? {
        code: "server",
        message: `The translator server returned an error (${res.status}).`,
      },
    };
  }

  const parsed = translationResultSchema.safeParse(
    (body as { result?: unknown } | null)?.result,
  );
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "invalid-shape",
        message: "The server response didn't match the translator contract.",
      },
    };
  }
  return { ok: true, result: parsed.data as TranslationResult };
}
