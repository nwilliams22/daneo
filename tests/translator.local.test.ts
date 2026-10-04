import { describe, expect, it, vi } from "vitest";
import { createLocalTranslator, localTranslator, type LocalProgress } from "../src/features/explore/local-api";

const good = (korean: string) => ({
  direction: "en-to-ko", korean, romanization: "", natural_english: "water",
  gloss: [], particles: [], literal_gap: "", cultural_note: "",
});
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => { resolve = r; });
  return { promise, resolve };
}
function harness() {
  const listeners = new Set<(event: LocalProgress) => void>();
  const replies = new Map<string, ReturnType<typeof deferred<unknown>>>();
  const cancellations: string[] = [];
  const client = createLocalTranslator({
    async invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
      const id = String(args?.requestId);
      if (command === "cancel_local") { cancellations.push(id); return true as T; }
      const reply = deferred<unknown>();
      replies.set(id, reply);
      return reply.promise as Promise<T>;
    },
    async listen(handler) { listeners.add(handler); return () => { listeners.delete(handler); }; },
  });
  return { client, replies, listeners, cancellations,
    emit: (requestId: string, outputTokens: number) => listeners.forEach((fn) => fn({ requestId, outputTokens, state: "generating" })),
  };
}

describe("local translation IPC boundary", () => {
  it("returns a typed desktop-required error in a browser without invoking Tauri", async () => {
    vi.stubGlobal("window", {});
    try {
      expect(await localTranslator.state()).toMatchObject({ state: "absent" });
      expect(await localTranslator.translate({ requestId: "browser", input: "water" }))
        .toMatchObject({ ok: false, error: { code: "desktop-required" } });
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("suppresses an asynchronous listener cleanup failure after a valid reply", async () => {
    const client = createLocalTranslator({
      async invoke<T>() { return { ok: true, result: good("물") } as T; },
      async listen() { return async () => { throw new Error("webview closed"); }; },
    });
    expect(await client.translate({ requestId: "cleanup", input: "water" }))
      .toMatchObject({ ok: true, result: { korean: "물" } });
  });

  it("cancel then immediate success rejects late progress AND the first reply", async () => {
    const h = harness();
    const progress: LocalProgress[] = [];
    const first = h.client.translate({ requestId: "one", input: "first" });
    await Promise.resolve();
    await h.client.cancel("one");
    const second = h.client.translate({ requestId: "two", input: "second" }, (event) => progress.push(event));
    await Promise.resolve();
    h.emit("one", 999);
    h.emit("two", 1);
    expect(progress).toEqual([{ requestId: "two", outputTokens: 1, state: "generating" }]);
    h.replies.get("one")!.resolve({ ok: true, result: good("first") });
    h.replies.get("two")!.resolve({ ok: true, result: good("second") });
    expect(await first).toMatchObject({ ok: false, error: { code: "cancelled" } });
    expect(await second).toMatchObject({ ok: true, result: { korean: "second" } });
    expect(h.listeners.size).toBe(0);
    expect(h.cancellations).toEqual(["one", "one"]);
  });

  it("cancel before listener registration prevents native invocation", async () => {
    const h = harness();
    const result = h.client.translate({ requestId: "early", input: "water" });
    await h.client.cancel("early");
    expect(await result).toMatchObject({ ok: false, error: { code: "cancelled" } });
    expect(h.replies.size).toBe(0);
    expect(h.listeners.size).toBe(0);
  });

  it.each(["model-missing", "model-corrupt", "allocation-failed", "generation-failed", "cancelled"])("preserves native %s errors", async (code) => {
    const h = harness();
    const result = h.client.translate({ requestId: code, input: "water" });
    await Promise.resolve();
    h.replies.get(code)!.resolve({ ok: false, error: { code, message: "typed failure" } });
    expect(await result).toEqual({ ok: false, error: { code, message: "typed failure" } });
    expect(h.listeners.size).toBe(0);
  });

  it("progress never resolves a result and invalid final JSON fails the existing schema", async () => {
    const h = harness();
    let settled = false;
    const result = h.client.translate({ requestId: "schema", input: "water" }).then((value) => { settled = true; return value; });
    await Promise.resolve();
    h.emit("schema", 100);
    await Promise.resolve();
    expect(settled).toBe(false);
    h.replies.get("schema")!.resolve({ ok: true, result: { korean: "물" } });
    expect(await result).toMatchObject({ ok: false, error: { code: "invalid-shape" } });
    expect(h.listeners.size).toBe(0);
  });
});
