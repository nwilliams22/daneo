import { afterEach, describe, expect, it, vi } from "vitest";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { saveBackup } from "./saveBackup";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn(), isTauri: vi.fn() }));
afterEach(() => { vi.resetAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("backup file transport", () => {
  it("waits for the native write to finish before returning saved", async () => {
    vi.mocked(isTauri).mockReturnValue(true);
    let complete!: (path: string) => void;
    vi.mocked(invoke).mockReturnValue(new Promise<string>((resolve) => { complete = resolve; }));
    const settled = vi.fn();
    const pending = saveBackup('{"word":"물"}', "backup.json").then(settled);
    await Promise.resolve();
    expect(settled).not.toHaveBeenCalled();
    complete("/chosen/backup.json");
    await pending;
    expect(invoke).toHaveBeenCalledWith("export_backup", { text: '{"word":"물"}', filename: "backup.json" });
    expect(settled).toHaveBeenCalledWith({ kind: "saved", path: "/chosen/backup.json" });
  });

  it("distinguishes cancellation from a saved file", async () => {
    vi.mocked(isTauri).mockReturnValue(true);
    vi.mocked(invoke).mockResolvedValue(null);
    expect(await saveBackup("{}", "backup.json")).toEqual({ kind: "cancelled" });
  });

  it("propagates native failure instead of falling back to an unconfirmed download", async () => {
    vi.mocked(isTauri).mockReturnValue(true);
    vi.mocked(invoke).mockRejectedValue(new Error("Permission denied"));
    await expect(saveBackup("{}", "backup.json")).rejects.toThrow("Permission denied");
  });

  it("reports only requested in browsers and does not revoke the Blob immediately", async () => {
    vi.useFakeTimers();
    vi.mocked(isTauri).mockReturnValue(false);
    const anchor = { href: "", download: "", click: vi.fn(), remove: vi.fn() };
    vi.stubGlobal("document", { createElement: () => anchor, body: { appendChild: vi.fn() } });
    const revoke = vi.fn();
    vi.stubGlobal("URL", { createObjectURL: () => "blob:backup", revokeObjectURL: revoke });
    expect(await saveBackup("{}", "backup.json")).toEqual({ kind: "requested" });
    expect(anchor.click).toHaveBeenCalledOnce();
    expect(anchor.download).toBe("backup.json");
    expect(revoke).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(revoke).toHaveBeenCalledWith("blob:backup");
    expect(invoke).not.toHaveBeenCalled();
  });
});
