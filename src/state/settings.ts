import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PersistedSettings } from "../types";

interface SettingsState extends PersistedSettings {
  setRomanizationVisible: (v: boolean) => void;
  setTheme: (t: PersistedSettings["theme"]) => void;
  setAudioEnabled: (v: boolean) => void;
  setSpeechRate: (r: number) => void;
  completeOnboarding: (o: {
    hangulDone: boolean;
    romanizationVisible: boolean;
  }) => void;
  resetOnboarding: () => void;
  restoreSettings: (s: PersistedSettings) => void;
  resetSettings: () => void;
}

/** A first-run learner's settings. Named so "Reset all progress" and the
 *  store's initial state cannot drift apart.
 *
 *  Theme is "dark", not "system": Nick picked the Dancheong dark sheet on
 *  BAD-281 and asked for the app to open dark whatever the desktop is set to.
 *  "System" is still a choice in Settings — it is no longer the default. */
export const DEFAULT_SETTINGS: PersistedSettings = {
  romanizationVisible: true,
  theme: "dark",
  audioEnabled: true,
  speechRate: 0.9,
  onboardingDone: false,
  hangulDone: false,
};

export const SETTINGS_STORAGE_KEY = "daneo-settings";

/** Bumped when a stored setting needs rewriting on load. v1: the default
 *  theme moved from "system" to "dark", and an install that never touched the
 *  theme picker is still carrying the old default — it has to move with it, or
 *  the one person using the app sees no change (BAD-281). */
export const SETTINGS_VERSION = 1;

/** Rewrites a stored settings blob to SETTINGS_VERSION. Only an untouched
 *  "system" moves to "dark": someone who deliberately picked "system" after
 *  v1 shipped is already on v1 and is left alone. Exported so the one rule it
 *  encodes is tested rather than inferred from a store's behaviour. */
export function migrateSettings(
  persisted: unknown,
  from: number,
): Partial<PersistedSettings> | undefined {
  const s = persisted as Partial<PersistedSettings> | undefined;
  if (from < 1 && s?.theme === "system") return { ...s, theme: "dark" };
  return s;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      setRomanizationVisible: (v) => set({ romanizationVisible: v }),
      setTheme: (t) => set({ theme: t }),
      setAudioEnabled: (v) => set({ audioEnabled: v }),
      setSpeechRate: (r) => set({ speechRate: r }),
      completeOnboarding: (o) => set({ onboardingDone: true, ...o }),
      resetOnboarding: () => set({ onboardingDone: false }),
      restoreSettings: (s) => set(s),
      // Back to a first run, onboardingDone included — the Dexie half of a
      // reset lives in db/repo.ts clearAllProgress().
      resetSettings: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      version: SETTINGS_VERSION,
      migrate: migrateSettings,
    },
  ),
);

export function getPersistedSettings(): PersistedSettings {
  const s = useSettings.getState();
  return {
    romanizationVisible: s.romanizationVisible,
    theme: s.theme,
    audioEnabled: s.audioEnabled,
    speechRate: s.speechRate,
    onboardingDone: s.onboardingDone,
    hangulDone: s.hangulDone,
  };
}
