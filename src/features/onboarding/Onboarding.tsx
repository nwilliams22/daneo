import { useSettings } from "../../state/settings";

const CHOICES: {
  label: string;
  hint: string;
  hangulDone: boolean;
  romanizationVisible: boolean;
}[] = [
  {
    label: "Not yet",
    hint: "Module 1 starts with the alphabet. Romanization stays on.",
    hangulDone: false,
    romanizationVisible: true,
  },
  {
    label: "Mostly — still slow",
    hint: "The alphabet section starts collapsed. Romanization stays on.",
    hangulDone: true,
    romanizationVisible: true,
  },
  {
    label: "Comfortably",
    hint: "Alphabet collapsed and romanization hidden — Hangul only.",
    hangulDone: true,
    romanizationVisible: false,
  },
];

export default function Onboarding() {
  const completeOnboarding = useSettings((s) => s.completeOnboarding);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 text-ink">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="font-korean text-5xl font-bold">단어</div>
          <div className="mt-2 text-[11px] tracking-[0.3em] text-muted uppercase">
            Daneo · word-first Korean
          </div>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-muted">
            Words first, then a little glue, then sentences built only from
            words you actually know.
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-panel p-5">
          <div className="mb-4 text-center text-base font-semibold">
            Can you already read Hangul?
          </div>
          <div className="flex flex-col gap-2.5">
            {CHOICES.map((c) => (
              <button
                key={c.label}
                onClick={() =>
                  completeOnboarding({
                    hangulDone: c.hangulDone,
                    romanizationVisible: c.romanizationVisible,
                  })
                }
                className="rounded-xl border border-line bg-paper px-4 py-3 text-left transition-colors hover:border-teal"
              >
                <div className="text-sm font-bold">{c.label}</div>
                <div className="mt-0.5 text-xs leading-relaxed text-muted">
                  {c.hint}
                </div>
              </button>
            ))}
          </div>
          <p className="mt-4 text-center text-[11px] text-muted">
            Everything here is reversible in Settings.
          </p>
        </div>
      </div>
    </div>
  );
}
