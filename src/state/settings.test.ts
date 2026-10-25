import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  SETTINGS_VERSION,
  migrateSettings,
} from "./settings";

// Nick asked for the app to open dark whatever the desktop is set to
// (BAD-281). Two things have to hold for that, and both are easy to undo by
// accident: a fresh install starts dark, and the install he already has —
// which stored "system" before this shipped — moves with the default.

describe("theme default", () => {
  it("a first run is dark, not the desktop's choice", () => {
    expect(DEFAULT_SETTINGS.theme).toBe("dark");
  });
});

describe("migrateSettings", () => {
  const stored = (theme: string) => ({ ...DEFAULT_SETTINGS, theme });

  it("moves a pre-v1 install that never touched the picker", () => {
    expect(migrateSettings(stored("system"), 0)?.theme).toBe("dark");
  });

  it("leaves a deliberate light choice alone", () => {
    expect(migrateSettings(stored("light"), 0)?.theme).toBe("light");
  });

  it("leaves a deliberate v1 'system' alone", () => {
    expect(migrateSettings(stored("system"), SETTINGS_VERSION)?.theme).toBe(
      "system",
    );
  });

  it("keeps every other setting as it was", () => {
    const before = { ...stored("system"), speechRate: 0.75 };
    expect(migrateSettings(before, 0)).toEqual({ ...before, theme: "dark" });
  });
});
