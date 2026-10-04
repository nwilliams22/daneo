import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export type ModelDownloadCode = "invalid-pin" | "no-network" | "http-error" | "hash-mismatch"
  | "disk-full" | "permission-denied" | "cancelled" | "busy" | "io-error";
export type ModelCacheOutcome = { ok: true; result: { path: string | null } }
  | { ok: false; error: { code: ModelDownloadCode; message: string } };
export interface ModelDownloadProgress {
  requestId: string;
  bytes: number;
  total: number;
  bytesPerSecond: number;
}
interface Transport {
  invoke<T>(command: string, args?: Record<string, unknown>): Promise<T>;
  listen(handler: (event: ModelDownloadProgress) => void): Promise<() => void>;
}
const desktop: Transport = {
  invoke,
  listen: (handler) => listen<ModelDownloadProgress>("model-download-progress", (event) => handler(event.payload)),
};
const failure = (code: ModelDownloadCode, message: string): ModelCacheOutcome => ({ ok: false, error: { code, message } });

// The native manifest is the only pin source. No URL, artifact or cache path from the UI.
export function createModelDownloader(transport: Transport = desktop) {
  const requests = new Map<string, { cancelled: boolean }>();
  return {
    state: () => transport.invoke<ModelCacheOutcome>("model_cache_state"),
    async cancel(requestId: string): Promise<void> {
      const request = requests.get(requestId);
      if (!request) return;
      request.cancelled = true;
      await transport.invoke("cancel_model_download", { requestId });
    },
    async download(requestId: string, onProgress?: (event: ModelDownloadProgress) => void): Promise<ModelCacheOutcome> {
      if (requests.has(requestId)) return failure("busy", "Request ID is already active.");
      const request = { cancelled: false };
      requests.set(requestId, request);
      let unlisten: (() => void) | undefined;
      try {
        unlisten = await transport.listen((event) => {
          if (event.requestId !== requestId) return;
          if (request.cancelled) {
            // Cancel can arrive before native registration. Initial progress retries it.
            void transport.invoke("cancel_model_download", { requestId }).catch(() => {});
          } else onProgress?.(event);
        });
        if (request.cancelled) return failure("cancelled", "Model download cancelled.");
        const result = await transport.invoke<ModelCacheOutcome>("download_model", { requestId });
        return request.cancelled ? failure("cancelled", "Model download cancelled.") : result;
      } catch {
        return failure(request.cancelled ? "cancelled" : "io-error", "Model download is unavailable.");
      } finally {
        requests.delete(requestId);
        unlisten?.();
      }
    },
  };
}
export const modelDownloader = createModelDownloader();
