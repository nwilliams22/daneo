import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { postprocessTranslation } from "../../lib/translation-postprocess";
import { directionForInput } from "../../lib/translation-direction";
import { translateErrorSchema, type TranslateError, type TranslateOutcome } from "./translation-contract";

export type LocalState = "absent" | "loading" | "ready" | "generating" | "error";
export interface LocalProgress {
  requestId: string;
  state: LocalState;
  outputTokens: number;
}
export interface LocalSnapshot {
  state: LocalState;
  requestId: string | null;
  error: { code: string; message: string } | null;
  resident: boolean;
}

// Injectable only to test the IPC boundary without a webview. Production always
// uses the registered Tauri commands, never HTTP or a fallback engine.
interface Transport {
  invoke<T>(command: string, args?: Record<string, unknown>): Promise<T>;
  listen(handler: (event: LocalProgress) => void): Promise<() => void | Promise<void>>;
}
const desktop: Transport = {
  invoke,
  listen: (handler) => listen<LocalProgress>("local-translation-progress", (event) => handler(event.payload)),
};
const failure = (code: TranslateError["code"], message: string): TranslateOutcome => ({ ok: false, error: { code, message } });
const cancelled = () => failure("cancelled", "Translation cancelled.");
const isDesktop = () => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export function createLocalTranslator(transport: Transport = desktop) {
  const requests = new Map<string, { cancelled: boolean }>();
  return {
    state: () => isDesktop() || transport !== desktop
      ? transport.invoke<LocalSnapshot>("local_translation_state")
      : Promise.resolve<LocalSnapshot>({ state: "absent", requestId: null, error: null, resident: false }),
    async cancel(requestId: string): Promise<void> {
      const request = requests.get(requestId);
      if (!request) return;
      request.cancelled = true;
      // Failure to deliver cancellation must not make a late reply usable.
      try { await transport.invoke("cancel_local", { requestId }); } catch { /* suppressed locally */ }
    },
    async translate(
      { requestId, input }: { requestId: string; input: string },
      onProgress?: (progress: LocalProgress) => void,
    ): Promise<TranslateOutcome> {
      if (!isDesktop() && transport === desktop) {
        return failure("desktop-required", "Local needs the desktop app. Start it with `npm run tauri dev`.");
      }
      if (requests.has(requestId)) return failure("busy", "Request ID is already active.");
      const request = { cancelled: false };
      requests.set(requestId, request);
      let unlisten: (() => void | Promise<void>) | undefined;
      try {
        // Subscribe before invoking, so fast native errors cannot leak a listener.
        unlisten = await transport.listen((event) => {
          if (event.requestId !== requestId || requests.get(requestId) !== request) return;
          if (request.cancelled) {
            // Covers cancel racing ahead of native command registration.
            void transport.invoke("cancel_local", { requestId }).catch(() => {});
            return;
          }
          // No completion from events, and no partial token text in this API.
          onProgress?.(event);
        });
        if (request.cancelled) return cancelled();
        const direction = directionForInput(input);
        const raw = await transport.invoke<unknown>("translate_local", { requestId, input, direction });
        if (request.cancelled) return cancelled();
        if (typeof raw !== "object" || raw === null) return failure("invalid-shape", "Invalid native response.");
        if ("ok" in raw && raw.ok === false && "error" in raw) {
          const error = translateErrorSchema.safeParse(raw.error);
          if (error.success) return { ok: false, error: error.data };
        }
        const parsed = postprocessTranslation("ok" in raw && raw.ok === true && "result" in raw ? { ...raw.result as object, direction } : null);
        if (!parsed) return failure("invalid-shape", "The local reply did not match the translator contract.");
        return { ok: true, result: parsed };
      } catch {
        return request.cancelled ? cancelled() : failure("generation-failed", "The local translator is unavailable.");
      } finally {
        requests.delete(requestId);
        try { await unlisten?.(); } catch { /* a closed webview may already have removed it */ }
      }
    },
  };
}

// Use a fresh UUID per request. Explore wiring and controls are the next slice.
export const localTranslator = createLocalTranslator();
