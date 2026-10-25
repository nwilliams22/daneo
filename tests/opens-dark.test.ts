// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, SETTINGS_VERSION } from "../src/state/settings";

// Nick, BAD-281: "Yes. Always open dark." Two pieces of code have to agree for
// that to be true, and they are in different languages and different files —
// the zustand store in src/state/settings.ts, and a hand-written script in
// index.html that sets the theme class before the first paint so launching the
// app is not a white flash. This runs the real script out of the real
// index.html, so the two cannot drift apart silently.

const html = readFileSync(
  path.resolve(__dirname, "../index.html"),
  "utf8",
);
const inline = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1];

/** jsdom here has no Storage, and the script only ever reads one key. */
function fakeStorage(raw?: string) {
  const store = new Map<string, string>();
  if (raw !== undefined) store.set("daneo-settings", raw);
  const api = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  };
  (globalThis as { localStorage?: unknown }).localStorage = api;
  (window as unknown as { localStorage?: unknown }).localStorage = api;
}

function runPrePaintScript({
  stored,
  prefersDark,
}: {
  stored: unknown;
  prefersDark: boolean;
}): boolean {
  document.documentElement.className = "";
  fakeStorage(stored === undefined ? undefined : JSON.stringify(stored));
  window.matchMedia = ((query: string) => ({
    matches: query.includes("dark") && prefersDark,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
  new Function(inline!)();
  return document.documentElement.classList.contains("dark");
}

const persisted = (theme: string, version: number) => ({
  state: { ...DEFAULT_SETTINGS, theme },
  version,
});

describe("the theme class set before the first paint", () => {
  beforeEach(() => {
    expect(inline, "index.html no longer has an inline script").toBeTruthy();
  });

  it("is dark on a never-run install, whatever the desktop prefers", () => {
    expect(runPrePaintScript({ stored: undefined, prefersDark: false })).toBe(
      true,
    );
  });

  it("is dark for the pre-v1 install that still says 'system'", () => {
    // Matches migrateSettings(): this is the copy Nick already has.
    expect(
      runPrePaintScript({ stored: persisted("system", 0), prefersDark: false }),
    ).toBe(true);
  });

  it("respects a deliberate light choice", () => {
    expect(
      runPrePaintScript({ stored: persisted("light", 0), prefersDark: true }),
    ).toBe(false);
  });

  it("follows the desktop for a 'system' chosen after v1", () => {
    expect(
      runPrePaintScript({
        stored: persisted("system", SETTINGS_VERSION),
        prefersDark: false,
      }),
    ).toBe(false);
    expect(
      runPrePaintScript({
        stored: persisted("system", SETTINGS_VERSION),
        prefersDark: true,
      }),
    ).toBe(true);
  });

  it("falls back to dark on unreadable stored settings", () => {
    document.documentElement.className = "";
    fakeStorage("{not json");
    new Function(inline!)();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
