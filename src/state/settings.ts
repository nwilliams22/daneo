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
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      romanizationVisible: true,
      theme: "system",
      audioEnabled: true,
      speechRate: 0.9,
      onboardingDone: false,
      hangulDone: false,
      setRomanizationVisible: (v) => set({ romanizationVisible: v }),
      setTheme: (t) => set({ theme: t }),
      setAudioEnabled: (v) => set({ audioEnabled: v }),
      setSpeechRate: (r) => set({ speechRate: r }),
      completeOnboarding: (o) => set({ onboardingDone: true, ...o }),
      resetOnboarding: () => set({ onboardingDone: false }),
      restoreSettings: (s) => set(s),
    }),
    { name: "daneo-settings" },
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
