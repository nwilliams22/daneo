// @vitest-environment jsdom
import "fake-indexeddb/auto";
import "./support/dom-storage";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { Table } from "dexie";
import { db } from "../src/db/db";
import { clearAllProgress, progressCounts } from "../src/db/repo";
import ResetProgress from "../src/features/settings/ResetProgress";
import SettingsPage from "../src/features/settings/SettingsPage";
import { resetAllProgress } from "../src/features/settings/resetAllProgress";
import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  getPersistedSettings,
  useSettings,
} from "../src/state/settings";

// BAD-280: Settings must be able to wipe this device's learner clean, with a
// backup offered first and no single misclick doing it.

vi.mock("../src/audio/useKoreanTTS", () => ({
  useKoreanTTS: () => ({ status: "unsupported", speak: vi.fn(), stop: vi.fn() }),
}));

let root: Root | undefined;
let container: HTMLDivElement;

/** A row that satisfies whatever primary key a table declares — so this test
 *  seeds tables it was never told about. */
function seedRow(table: Table): Record<string, unknown> {
  const { keyPath, auto } = table.schema.primKey;
  const row: Record<string, unknown> = { seededBy: "reset test" };
  if (auto || keyPath == null) return row;
  for (const path of Array.isArray(keyPath) ? keyPath : [keyPath])
    row[path] = `seed_${path}`;
  return row;
}

/** Puts one row in EVERY table the Dexie schema declares. A table added to
 *  db.ts later is seeded here automatically, so the clear below cannot miss it
 *  in silence — that is the whole point of this helper. */
async function seedEveryTable() {
  for (const table of db.tables)
    await (table as unknown as Table<Record<string, unknown>>).add(
      seedRow(table),
    );
}

async function tableCounts() {
  return Object.fromEntries(
    await Promise.all(
      db.tables.map(async (t) => [t.name, await t.count()] as const),
    ),
  );
}

async function mount(node: React.ReactNode) {
  root = createRoot(container);
  await act(async () => root!.render(node));
}

function button(label: string): HTMLButtonElement {
  const all = [...container.querySelectorAll("button")];
  const found = all.find((b) => b.textContent?.trim() === label);
  if (!found)
    throw new Error(
      `no button labelled "${label}" — saw: ${all
        .map((b) => b.textContent?.trim())
        .join(" | ")}`,
    );
  return found as HTMLButtonElement;
}

async function click(label: string) {
  const target = button(label);
  await act(async () => target.click());
}

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  await clearAllProgress();
  useSettings.getState().resetSettings();
  localStorage.clear();
  container = document.createElement("div");
  document.body.append(container);
});

afterEach(async () => {
  await act(async () => root?.unmount());
  root = undefined;
  container.remove();
});

it("clears every table the schema declares, not a hand-written list", async () => {
  expect(db.tables.length).toBeGreaterThan(0);
  await seedEveryTable();
  // The seed landed everywhere, or the clear below would prove nothing.
  for (const [name, count] of Object.entries(await tableCounts()))
    expect(count, `${name} was not seeded`).toBe(1);

  await clearAllProgress();

  for (const [name, count] of Object.entries(await tableCounts()))
    expect(count, `${name} survived the reset`).toBe(0);
  expect(await progressCounts()).toEqual({
    knownWords: 0,
    drillResults: 0,
    srsCards: 0,
    moduleTests: 0,
    savedTranslations: 0,
  });
});

it("sends the settings store back to a first run, so the next screen is onboarding", async () => {
  await seedEveryTable();
  useSettings
    .getState()
    .completeOnboarding({ hangulDone: true, romanizationVisible: false });
  useSettings.getState().setTheme("dark");
  expect(localStorage.getItem(SETTINGS_STORAGE_KEY)).toContain(
    '"onboardingDone":true',
  );

  await resetAllProgress();

  expect(getPersistedSettings()).toEqual(DEFAULT_SETTINGS);
  expect(useSettings.getState().onboardingDone).toBe(false);
  // No persisted copy left to resurrect on reload.
  expect(localStorage.getItem(SETTINGS_STORAGE_KEY)).toBeNull();
  for (const count of Object.values(await tableCounts())) expect(count).toBe(0);
});

it("takes two steps, names what goes, and erases nothing until the second", async () => {
  await db.knownWords.put({ wordId: "w_mul", learnedAt: 1 });
  await db.moduleTests.put({
    moduleId: "m1",
    bestPct: 40,
    lastPct: 40,
    attempts: 1,
    at: 1,
  });
  const reload = vi.fn();
  await mount(<ResetProgress reload={reload} />);

  // Step one opens the confirmation and spells out the loss in real numbers.
  // The panel must never appear before the counts: "0 known words" in front of
  // someone about to erase hundreds is the one sentence that must not flash.
  await click("Reset all progress");
  expect(container.textContent).toContain("1 known word");
  expect(container.textContent).toContain("1 module test score");
  expect(container.textContent).not.toContain("0 known words");
  expect(container.textContent).toContain("0 saved discoveries"); // not "discoverys"
  expect(container.textContent).toContain("restarts at onboarding");
  expect(container.textContent).toContain("Downloaded model files are kept");
  button("Export a backup first"); // the way out is on the panel
  expect(await db.knownWords.count()).toBe(1);
  expect(reload).not.toHaveBeenCalled();

  // Cancel is a real exit, not a second confirmation.
  await click("Cancel");
  expect(container.textContent).not.toContain("Erase everything");
  expect(await db.knownWords.count()).toBe(1);

  // Step two does the deed and restarts the app.
  await click("Reset all progress");
  await click("Erase everything");
  await vi.waitFor(async () => {
    expect(await db.knownWords.count()).toBe(0);
    expect(await db.moduleTests.count()).toBe(0);
    expect(reload).toHaveBeenCalled();
  });
  expect(useSettings.getState().onboardingDone).toBe(false);
});

it("offers the reset from the Settings page, under Backup", async () => {
  await mount(<SettingsPage />);
  const text = container.textContent ?? "";
  expect(text).toContain("Backup");
  expect(text).toContain("Reset all progress");
  expect(text.indexOf("Backup")).toBeLessThan(text.indexOf("Reset all progress"));
});
