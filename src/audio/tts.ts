// Korean speechSynthesis voice discovery — module-level singleton so any
// number of AudioButtons share one voiceschanged listener. "no-voice" is a
// designed state (common on Linux without speech-dispatcher voices), not an
// error.

export type TTSStatus = "loading" | "ready" | "no-voice" | "unsupported";

export interface TTSSnapshot {
  status: TTSStatus;
  voice: SpeechSynthesisVoice | null;
}

let snapshot: TTSSnapshot = {
  status:
    typeof window !== "undefined" && "speechSynthesis" in window
      ? "loading"
      : "unsupported",
  voice: null,
};

const listeners = new Set<() => void>();
let initialized = false;

function update(next: TTSSnapshot) {
  snapshot = next;
  listeners.forEach((l) => l());
}

function pickVoice() {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return; // not populated yet — wait for voiceschanged
  const ko = voices.filter((v) => v.lang.toLowerCase().startsWith("ko"));
  const best = ko.find((v) => v.localService) ?? ko[0] ?? null;
  update({ status: best ? "ready" : "no-voice", voice: best });
}

function init() {
  if (initialized || snapshot.status === "unsupported") return;
  initialized = true;
  pickVoice();
  window.speechSynthesis.addEventListener("voiceschanged", pickVoice);
  // Chromium may never fire voiceschanged when the voice list is empty
  window.setTimeout(() => {
    if (snapshot.status === "loading")
      update({ status: "no-voice", voice: null });
  }, 2000);
}

export const ttsStore = {
  subscribe(listener: () => void) {
    init();
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): TTSSnapshot {
    return snapshot;
  },
};

export function speakKorean(text: string, rate: number) {
  const { voice } = snapshot;
  if (!voice) return;
  // cancel() first — Chromium's queue stalls without it
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = "ko-KR";
  u.rate = rate;
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (snapshot.status === "unsupported") return;
  window.speechSynthesis.cancel();
}
