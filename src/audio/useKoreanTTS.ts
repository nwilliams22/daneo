import { useCallback, useSyncExternalStore } from "react";
import { ttsStore, speakKorean, stopSpeaking, type TTSStatus } from "./tts";
import { useSettings } from "../state/settings";

export function useKoreanTTS(): {
  status: TTSStatus;
  enabled: boolean;
  voiceName: string | null;
  speak: (text: string) => void;
  stop: () => void;
} {
  const snap = useSyncExternalStore(ttsStore.subscribe, ttsStore.getSnapshot);
  const enabled = useSettings((s) => s.audioEnabled);
  const rate = useSettings((s) => s.speechRate);

  const speak = useCallback(
    (text: string) => speakKorean(text, rate),
    [rate],
  );

  return {
    status: snap.status,
    enabled,
    voiceName: snap.voice?.name ?? null,
    speak,
    stop: stopSpeaking,
  };
}
