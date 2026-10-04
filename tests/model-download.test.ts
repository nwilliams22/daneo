import { describe, it, expect, vi } from "vitest";
import { createModelDownloader, type ModelDownloadProgress, type ModelCacheOutcome } from "../src/lib/model-download";

describe("model downloader IPC", () => {
  it("subscribes before invocation, isolates progress, and preserves typed refusal", async () => {
    let handler: (p: ModelDownloadProgress) => void = () => {};
    const unlisten = vi.fn();
    const outcome: ModelCacheOutcome = { ok: false, error: { code: "invalid-pin", message: "No model selected." } };
    const invoke = vi.fn(async () => {
      handler({ requestId: "other", bytes: 1, total: 2, bytesPerSecond: 1 });
      handler({ requestId: "mine", bytes: 0, total: 2, bytesPerSecond: 0 });
      return outcome;
    });
    const downloader = createModelDownloader({ invoke: invoke as never, listen: async (h) => { handler = h; return unlisten; } });
    const progress = vi.fn();
    expect(await downloader.download("mine", progress)).toEqual(outcome);
    expect(invoke).toHaveBeenCalledWith("download_model", { requestId: "mine" });
    expect(progress).toHaveBeenCalledTimes(1);
    expect(unlisten).toHaveBeenCalledOnce();
  });
  it("cancels native work and refuses a late success", async () => {
    let finish: (r: ModelCacheOutcome) => void = () => {};
    let started: () => void = () => {};
    const ready = new Promise<void>((r) => { started = r; });
    const invoke = vi.fn((command: string) => {
      if (command === "download_model") { started(); return new Promise<ModelCacheOutcome>((r) => { finish = r; }); }
      return Promise.resolve(true);
    });
    const unlisten = vi.fn();
    const downloader = createModelDownloader({ invoke: invoke as never, listen: async () => unlisten });
    const result = downloader.download("mine");
    await ready;
    await downloader.cancel("mine");
    finish({ ok: true, result: { path: "/verified" } });
    expect(await result).toMatchObject({ ok: false, error: { code: "cancelled" } });
    expect(invoke).toHaveBeenCalledWith("cancel_model_download", { requestId: "mine" });
    expect(unlisten).toHaveBeenCalledOnce();
  });
  it("cancels while subscription is pending without starting a transfer", async () => {
    let subscribed: (f: () => void) => void = () => {};
    const invoke = vi.fn(async () => true);
    const unlisten = vi.fn();
    const downloader = createModelDownloader({ invoke: invoke as never, listen: () => new Promise((r) => { subscribed = r; }) });
    const result = downloader.download("mine");
    await downloader.cancel("mine");
    subscribed(unlisten);
    expect(await result).toMatchObject({ ok: false, error: { code: "cancelled" } });
    expect(invoke).not.toHaveBeenCalledWith("download_model", expect.anything());
    expect(unlisten).toHaveBeenCalledOnce();
  });
});
