import "fake-indexeddb/auto";
import { describe, it, expect } from "vitest";
import { db } from "../db/db";
import { markWordKnown, logDrillResult, snapshot, restore } from "../db/repo";
import {
  parseSnapshot,
  serializeSnapshot,
  snapshotFilename,
} from "./exportImport";
import type { PersistedSettings } from "../types";

const settings: PersistedSettings = {
  romanizationVisible: false,
  theme: "dark",
  audioEnabled: true,
  speechRate: 0.85,
  onboardingDone: true,
  hangulDone: true,
};

describe("export/import", () => {
  it("filename is date-stamped", () => {
    expect(snapshotFilename(new Date(2026, 7, 1))).toBe(
      "daneo-backup-2026-08-01.json",
    );
  });

  it("round-trips all learner state through serialize → parse → restore", async () => {
    await markWordKnown("w_mul");
    await markWordKnown("w_jeo");
    await logDrillResult({ kind: "confusable", itemId: "cf_wa", correct: false });
    await logDrillResult({ kind: "typing", itemId: "w_mul", correct: true });

    const snap = await snapshot(settings);
    expect(snap.tables.knownWords).toHaveLength(2);
    expect(snap.tables.drillResults).toHaveLength(2);
    expect(snap.settings).toEqual(settings);

    const parsed = parseSnapshot(serializeSnapshot(snap));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    // wipe, then restore
    await db.knownWords.clear();
    await db.drillResults.clear();
    expect(await db.knownWords.count()).toBe(0);

    await restore(parsed.snapshot);
    const words = await db.knownWords.toArray();
    expect(words.map((w) => w.wordId).sort()).toEqual(["w_jeo", "w_mul"]);
    const results = await db.drillResults.toArray();
    expect(results).toHaveLength(2);
    expect(results.find((r) => r.kind === "confusable")?.correct).toBe(false);
  });

  it("restore replaces existing state instead of merging", async () => {
    const snap = await snapshot(settings); // current state from prior test
    await markWordKnown("w_extra_should_vanish");
    await restore(snap);
    const words = await db.knownWords.toArray();
    expect(words.map((w) => w.wordId)).not.toContain("w_extra_should_vanish");
  });

  it("rejects invalid JSON and non-backup JSON", () => {
    expect(parseSnapshot("not json").ok).toBe(false);
    expect(parseSnapshot("{}").ok).toBe(false);
    expect(
      parseSnapshot(JSON.stringify({ version: 2, tables: {} })).ok,
    ).toBe(false);
  });
});
