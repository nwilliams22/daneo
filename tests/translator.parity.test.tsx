import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { translate } from "../src/features/explore/api";
import { createLocalTranslator } from "../src/features/explore/local-api";
import TranslationError from "../src/features/explore/TranslationError";
import { translateErrorSchema, translateOutcomeSchema, type TranslateOutcome } from "../src/features/explore/translation-contract";
import { translationResultSchema } from "../src/lib/schemas";

// Synthetic fixtures only: run the real adapters and postprocessor, substituting
// just HTTP and IPC. No API key, proxy, model file or native webview is needed.
const good = {
  direction: "en-to-ko", korean: "물을 마셔요", natural_english: "I drink water",
  gloss: [{ chunk: "물을", gloss: "water-[obj]", role: "object" }, { chunk: "마셔요", gloss: "drink", role: "verb" }],
  particles: [], literal_gap: "", cultural_note: "",
};

function local(reply: unknown) {
  const unlisten = vi.fn();
  const invoke = vi.fn<(command: string, args?: Record<string, unknown>) => Promise<unknown>>().mockResolvedValue(reply);
  const client = createLocalTranslator({
    invoke: async <T,>(command: string, args?: Record<string, unknown>) => await invoke(command, args) as T,
    listen: async () => unlisten,
  });
  return { client, invoke, unlisten };
}

async function both(result: unknown, input = "I drink water") {
  const fetch = vi.fn().mockResolvedValue(Response.json({ result }));
  vi.stubGlobal("fetch", fetch);
  const native = local({ ok: true, result });
  const outcomes = await Promise.all([native.client.translate({ requestId: "parity", input }), translate(input)]);
  expect(fetch).toHaveBeenCalledOnce();
  expect(JSON.parse(fetch.mock.calls[0]![1].body)).toEqual({ input });
  expect(native.invoke).toHaveBeenCalledWith("translate_local", expect.objectContaining({ input }));
  expect(native.unlisten).toHaveBeenCalledOnce();
  for (const outcome of outcomes) expect(translateOutcomeSchema.safeParse(outcome).success).toBe(true);
  return outcomes;
}

function renderError(outcome: TranslateOutcome) {
  expect(outcome.ok).toBe(false);
  if (outcome.ok) throw new Error("Expected a typed error");
  expect(translateErrorSchema.safeParse(outcome.error).success).toBe(true);
  const html = renderToStaticMarkup(<MemoryRouter><TranslationError error={outcome.error} /></MemoryRouter>);
  expect(html).toContain('role="alert"');
  return html;
}

afterEach(() => vi.unstubAllGlobals());

describe("translation adapter contract parity", () => {
  it.each([
    ["I drink water", "en-to-ko"],
    ["물을 마셔요", "ko-to-en"],
  ])("validates the same result for %s", async (input, direction) => {
    const outcomes = await both({ ...good, direction }, input);
    expect(outcomes[0]).toEqual(outcomes[1]);
    for (const outcome of outcomes) {
      expect(outcome.ok).toBe(true);
      if (!outcome.ok) continue;
      expect(translationResultSchema.parse(outcome.result)).toEqual(outcome.result);
      expect(outcome.result.direction).toBe(direction);
      expect(outcome.result.romanization).toBe("mureul masyeoyo");
      expect(outcome.result.particles).toEqual([{ particle: "을", job: "marks the object" }]);
      expect(Object.keys(outcome.result).sort()).toEqual(Object.keys(translationResultSchema.shape).sort());
    }
  });

  it.each(["korean", "natural_english", "gloss", "literal_gap", "cultural_note"])("rejects missing %s in either engine", async (field) => {
    const result: Record<string, unknown> = { ...good };
    delete result[field];
    for (const outcome of await both(result)) {
      expect(outcome).toMatchObject({ ok: false, error: { code: "invalid-shape" } });
      renderError(outcome);
    }
  });

  it.each([null, [], "not JSON", { ...good, gloss: [{ chunk: "물", gloss: "water", role: "invented" }] }])("rejects malformed result %# without throwing", async (result) => {
    for (const outcome of await both(result)) {
      expect(outcome).toMatchObject({ ok: false, error: { code: "invalid-shape" } });
      renderError(outcome);
    }
  });

  it.each(translateErrorSchema.shape.code.options)("preserves and renders the shared %s error", async (code) => {
    const error = { code, message: "A typed failure" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error }, { status: 503 })));
    const native = local({ ok: false, error });
    const outcomes = await Promise.all([native.client.translate({ requestId: code, input: "water" }), translate("water")]);
    for (const outcome of outcomes) {
      expect(outcome).toEqual({ ok: false, error });
      expect(renderError(outcome)).toContain("A typed failure");
    }
  });

  it.each([null, "bad", { code: "unknown", message: "bad" }, { code: "upstream", message: { nested: "cannot render" } }])("contains malformed error %# at each boundary", async (error) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error }, { status: 503 })));
    const native = local({ ok: false, error });
    const outcomes = await Promise.all([native.client.translate({ requestId: "bad", input: "water" }), translate("water")]);
    expect(outcomes[0]).toMatchObject({ ok: false, error: { code: "invalid-shape" } });
    expect(outcomes[1]).toMatchObject({ ok: false, error: { code: "server" } });
    outcomes.forEach(renderError);
  });
});

describe("no-network and no-model degradation", () => {
  it("Local succeeds with networking disabled; the developer cloud adapter reports no-server", async () => {
    const fetch = vi.fn().mockRejectedValue(new TypeError("Network unavailable / proxy stopped"));
    vi.stubGlobal("fetch", fetch);
    const native = local({ ok: true, result: good });
    const outcome = await native.client.translate({ requestId: "offline", input: "I drink water" });
    expect(outcome.ok).toBe(true);
    expect(translateOutcomeSchema.safeParse(outcome).success).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
    const cloud = await translate("water");
    expect(cloud).toMatchObject({ ok: false, error: { code: "no-server" } });
    renderError(cloud);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("an absent model returns a downloader route without network fallback; Cloud remains independent", async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ result: good }));
    vi.stubGlobal("fetch", fetch);
    const native = local({ ok: false, error: { code: "model-missing", message: "No model file installed." } });
    const outcome = await native.client.translate({ requestId: "absent", input: "water" });
    expect(outcome).toMatchObject({ ok: false, error: { code: "model-missing" } });
    const html = renderError(outcome);
    expect(html).toContain('href="/settings"');
    expect(html).toContain("download or manage the local model");
    expect(fetch).not.toHaveBeenCalled();
    expect((await translate("water")).ok).toBe(true);
    expect(fetch).toHaveBeenCalledOnce();
    expect(native.invoke).toHaveBeenCalledOnce();
  });

  it("a rejected native command settles as generation-failed without automatic cloud fallback", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const native = local(null);
    native.invoke.mockRejectedValue(new Error("Native worker unavailable"));
    const outcome = await native.client.translate({ requestId: "worker", input: "water" });
    expect(outcome).toMatchObject({ ok: false, error: { code: "generation-failed" } });
    renderError(outcome);
    expect(native.unlisten).toHaveBeenCalledOnce();
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([200, 503])("a non-JSON HTTP %s settles as a renderable error", async (status) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("not JSON", { status })));
    const outcome = await translate("water");
    expect(outcome).toMatchObject({ ok: false, error: { code: status === 200 ? "invalid-shape" : "server" } });
    renderError(outcome);
  });
});
