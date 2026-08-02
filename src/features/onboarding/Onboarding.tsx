import { useState } from "react";
import { useSettings } from "../../state/settings";
import { markWordsKnown } from "../../db/repo";
import { moduleById } from "../../content";
import PlacementQuiz from "./PlacementQuiz";
import type { PlacementOutcome } from "../../lib/placement";

// Onboarding v2 (TASKS.md 2026-08-01, Nick): a short adaptive placement
// quiz replaces the self-reported "can you read Hangul?" — performance
// decides what gets pre-marked (alphabet collapsed, Module 1 vocab).

const OUTCOME_COPY: Record<
  PlacementOutcome["level"],
  { title: string; blurb: string }
> = {
  alphabet: {
    title: "Start with the alphabet",
    blurb:
      "Module 1 opens at Part 1 (Hangul) and romanization stays on. The letters come fast — everything else builds on them.",
  },
  words: {
    title: "You read Hangul",
    blurb:
      "The alphabet section starts collapsed and Module 1's word list is up next. Romanization stays on while the words settle in.",
  },
  glue: {
    title: "You know the words",
    blurb:
      "Module 1's vocabulary is pre-checked, so its sentences and drills are unlocked. Pick up at Part 3 — the particle glue — and romanization is hidden.",
  },
  module2: {
    title: "Module 1 is yours",
    blurb:
      "Its vocabulary is pre-checked and its sentences unlocked. Start straight in on Module 2 — numbers, time, and the past tense. Romanization is hidden.",
  },
};

export default function Onboarding() {
  const completeOnboarding = useSettings((s) => s.completeOnboarding);
  const [screen, setScreen] = useState<"intro" | "quiz" | "result">("intro");
  const [outcome, setOutcome] = useState<PlacementOutcome | null>(null);
  const m1Count = moduleById.get("m1")!.wordIds.length;

  const apply = async (o: PlacementOutcome) => {
    if (o.preMarkWordIds.length > 0) await markWordsKnown(o.preMarkWordIds);
    completeOnboarding({
      hangulDone: o.hangulDone,
      romanizationVisible: o.romanizationVisible,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-8 text-ink">
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

        {screen === "intro" && (
          <div className="rounded-2xl border border-line bg-panel p-5">
            <div className="mb-4 text-center text-base font-semibold">
              Where should you start?
            </div>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() =>
                  completeOnboarding({
                    hangulDone: false,
                    romanizationVisible: true,
                  })
                }
                className="rounded-xl border border-line bg-paper px-4 py-3 text-left transition-colors hover:border-teal"
              >
                <div className="text-sm font-bold">I'm brand new</div>
                <div className="mt-0.5 text-xs leading-relaxed text-muted">
                  Start at the very beginning — the alphabet, romanization on.
                </div>
              </button>
              <button
                onClick={() => setScreen("quiz")}
                className="rounded-xl border border-teal bg-paper px-4 py-3 text-left transition-colors hover:bg-teal/10"
              >
                <div className="text-sm font-bold text-teal">
                  I know some — place me
                </div>
                <div className="mt-0.5 text-xs leading-relaxed text-muted">
                  A 2-minute quiz (letters → words → sentences). Whatever you
                  prove gets checked off, so you don't start from scratch.
                </div>
              </button>
            </div>
            <button
              onClick={() =>
                completeOnboarding({
                  hangulDone: true,
                  romanizationVisible: true,
                })
              }
              className="mt-4 w-full text-center text-[11px] text-muted underline underline-offset-2 transition-colors hover:text-ink"
            >
              Skip the quiz — just collapse the alphabet section
            </button>
            <p className="mt-3 text-center text-[11px] text-muted">
              Everything here is reversible in Settings.
            </p>
          </div>
        )}

        {screen === "quiz" && (
          <PlacementQuiz
            onDone={(o) => {
              setOutcome(o);
              setScreen("result");
            }}
            onCancel={() => setScreen("intro")}
          />
        )}

        {screen === "result" && outcome && (
          <div className="rounded-2xl border border-line bg-panel p-6 text-center">
            <div className="text-[11px] font-semibold tracking-[0.15em] text-teal uppercase">
              Placement result
            </div>
            <div className="mt-2 text-xl font-bold">
              {OUTCOME_COPY[outcome.level].title}
            </div>
            <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-muted">
              {OUTCOME_COPY[outcome.level].blurb}
            </p>
            {outcome.preMarkWordIds.length > 0 && (
              <p className="mt-3 text-[12px] text-muted">
                Pre-checking {m1Count} Module 1 words — uncheck any in Learn if
                you want them back in rotation.
              </p>
            )}
            <button
              onClick={() => apply(outcome)}
              className="mt-5 w-full rounded-xl bg-teal py-3 text-sm font-bold text-on-accent transition-opacity hover:opacity-90"
            >
              Start learning
            </button>
            <button
              onClick={() => setScreen("intro")}
              className="mt-3 w-full text-center text-[11px] text-muted underline underline-offset-2 transition-colors hover:text-ink"
            >
              Retake or start differently
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
