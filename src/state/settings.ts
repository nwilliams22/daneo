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
 *  store's initial state cannot drift apart. */
export const DEFAULT_SETTINGS: PersistedSettings = {
  romanizationVisible: true,
  theme: "system",
  audioEnabled: true,
  speechRate: 0.9,
  onboardingDone: false,
  hangulDone: false,
};

export const SETTINGS_STORAGE_KEY = "daneo-settings";

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
    { name: SETTINGS_STORAGE_KEY },
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
