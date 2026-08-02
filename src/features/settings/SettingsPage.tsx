import PageHeader from "../../components/PageHeader";
import { useSettings } from "../../state/settings";
import { useKoreanTTS } from "../../audio/useKoreanTTS";
import type { PersistedSettings } from "../../types";

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3.5 last:border-b-0">
      <div>
        <div className="text-sm font-semibold">{label}</div>
        {hint && <div className="mt-0.5 text-xs text-muted">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-6.5 w-11 shrink-0 rounded-full border transition-colors ${
        on ? "border-teal bg-teal" : "border-line bg-paper"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          on ? "left-5" : "left-0.5"
        }`}
      />
    </button>
  );
}

const THEMES: { value: PersistedSettings["theme"]; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

function AudioStatus() {
  const { status, voiceName, speak } = useKoreanTTS();

  if (status === "ready") {
    return (
      <div className="flex items-center gap-3">
        <span className="max-w-40 truncate text-xs text-muted">
          {voiceName}
        </span>
        <button
          onClick={() => speak("안녕하세요")}
          className="rounded-xl border border-line px-3.5 py-2 text-[13px] font-semibold text-muted transition-colors hover:text-ink"
        >
          Test
        </button>
      </div>
    );
  }
  return (
    <span className="max-w-52 text-right text-xs leading-snug text-clay">
      {status === "unsupported"
        ? "Speech synthesis isn't available here."
        : "No Korean voice found on this system. On Linux, install speech-dispatcher with a Korean-capable voice."}
    </span>
  );
}

export default function SettingsPage() {
  const s = useSettings();

  return (
    <div>
      <PageHeader eyebrow="단어 · Settings" title="Settings" />

      <div className="rounded-2xl border border-line bg-panel">
        <Row
          label="Romanization"
          hint="Training wheels — hide it once the Hangul clicks."
        >
          <Toggle
            on={s.romanizationVisible}
            onChange={s.setRomanizationVisible}
            label="Show romanization"
          />
        </Row>

        <Row label="Theme">
          <div className="flex gap-1 rounded-xl border border-line bg-paper p-1">
            {THEMES.map((t) => (
              <button
                key={t.value}
                onClick={() => s.setTheme(t.value)}
                className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                  s.theme === t.value
                    ? "bg-ink text-paper"
                    : "text-muted hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </Row>

        <Row
          label="Audio"
          hint="Korean pronunciation via your system's speech voices."
        >
          <Toggle
            on={s.audioEnabled}
            onChange={s.setAudioEnabled}
            label="Enable audio"
          />
        </Row>

        <Row label="Korean voice" hint="Used by the play buttons on words and sentences.">
          <AudioStatus />
        </Row>

        <Row label="Speech rate" hint="0.9 is a comfortable learner pace.">
          <div className="flex items-center gap-2.5">
            <input
              type="range"
              min={0.5}
              max={1.2}
              step={0.05}
              value={s.speechRate}
              onChange={(e) => s.setSpeechRate(Number(e.target.value))}
              className="w-28 accent-(--teal)"
              aria-label="Speech rate"
            />
            <span className="w-8 text-right text-xs font-semibold text-muted">
              {s.speechRate.toFixed(2)}
            </span>
          </div>
        </Row>

        <Row label="Onboarding" hint="Re-answer the Hangul placement question.">
          <button
            onClick={s.resetOnboarding}
            className="rounded-xl border border-line px-3.5 py-2 text-[13px] font-semibold text-muted transition-colors hover:text-ink"
          >
            Run again
          </button>
        </Row>
      </div>
    </div>
  );
}
