import { postprocessTranslation } from "../../lib/translation-postprocess";
import { translateErrorSchema, type TranslateOutcome } from "./translation-contract";
export type { TranslateError, TranslateOutcome } from "./translation-contract";

// Client half of the translator contract. The proxy validates the model
// output; we re-validate its response here so a bad server can never crash
// the UI (§6.3) — errors are typed, never thrown.

const IS_TAURI = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
// Browser dev goes through the Vite proxy (same origin); the packaged app
// runs on a tauri:// origin and must hit the proxy directly.
const BASE = IS_TAURI || !import.meta.env.DEV ? "http://127.0.0.1:8787/api" : "/api";

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
    const err = translateErrorSchema.safeParse((body as { error?: unknown } | null)?.error);
    return {
      ok: false,
      error: err.success ? err.data : {
        code: "server",
        message: `The translator server returned an error (${res.status}).`,
      },
    };
  }

  const parsed = postprocessTranslation((body as { result?: unknown } | null)?.result);
  if (!parsed) {
    return {
      ok: false,
      error: {
        code: "invalid-shape",
        message: "The server response didn't match the translator contract.",
      },
    };
  }
  return { ok: true, result: parsed };
}
