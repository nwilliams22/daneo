import { useEffect, useReducer, useState } from "react";
import type { Word } from "../../../types";
import AudioButton from "../../../components/AudioButton";
import Rom from "../../../components/Rom";
import QuizOptions, { type QuizOptionView } from "./QuizOptions";
import WhyWrong from "./WhyWrong";
import { useDrillKeys } from "./useDrillKeys";
import TypingFeedback from "../typing/TypingFeedback";
import KoreanKeyboard from "../typing/KoreanKeyboard";
import {
  composerReduce,
  renderComposer,
  EMPTY_COMPOSER,
} from "../../../lib/hangul/composer";
import { jamoForKey } from "../../../lib/hangul/keymap";

// Shared question components — extracted from ReviewSession so the module
// tests (2026-08-10) render the exact same question UX as the daily review.

export function NextButton({
  onClick,
  label = "Next",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="mt-3.5 w-full rounded-xl bg-ink py-3 text-sm font-bold text-paper"
    >
      {label} <span className="font-normal opacity-70">(Enter)</span>
    </button>
  );
}

/** Shared why-wrong builder for the two glyph→sound kinds (confusable and
 *  cross-font rows have the same c / r / note shape). */
export const glyphExplainWrong =
  <T extends { id: string; c: string; r: string; note: string }>(
    options: T[],
    item: T,
  ) =>
  (pickedId: string) => {
    const p = options.find((o) => o.id === pickedId);
    return p ? (
      <WhyWrong
        picked={{
          title: (
            <>
              <span className="font-korean">{p.c}</span> is {p.r}
            </>
          ),
          body: p.note,
        }}
        answer={{
          title: (
            <>
              <span className="font-korean">{item.c}</span> is {item.r}
            </>
          ),
          body: item.note,
        }}
      />
    ) : null;
  };

/** Shared 4-choice question: prompt above, options below, explanation +
 *  Next after a pick. Keyed by question so per-item state resets itself. */
export function ChoiceQuestion({
  prompt,
  options,
  answerId,
  explain,
  explainWrong,
  columns = 2,
  nextLabel,
  onAnswer,
  onNext,
}: {
  prompt: React.ReactNode;
  options: QuizOptionView[];
  answerId: string;
  explain: React.ReactNode;
  /** Both-sides feedback for a wrong pick ("why was I wrong") — falls back
   *  to `explain` when absent or when the pick can't be resolved. */
  explainWrong?: (pickedId: string) => React.ReactNode;
  columns?: 1 | 2;
  nextLabel?: string;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const pick = (id: string) => {
    if (picked) return;
    setPicked(id);
    onAnswer(id === answerId);
  };
  useDrillKeys({
    onNumber: !picked
      ? (n) => {
          const o = options[n - 1];
          if (o) pick(o.id);
        }
      : undefined,
    onEnter: picked ? onNext : undefined,
  });
  return (
    <div>
      {prompt}
      <QuizOptions
        options={options}
        pickedId={picked}
        answerId={answerId}
        onPick={pick}
        columns={columns}
      />
      {picked && (
        <div className="mt-3.5 border-t border-line pt-3">
          {(picked !== answerId && explainWrong?.(picked)) || (
            <div className="text-[13.5px] leading-relaxed text-muted">
              {explain}
            </div>
          )}
          <NextButton onClick={onNext} label={nextLabel} />
        </div>
      )}
    </div>
  );
}

/** Production practice for word cards: type the Korean, in-app composition. */
export function TypingQuestion({
  word,
  onAnswer,
  onNext,
}: {
  word: Word;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
}) {
  const [state, dispatch] = useReducer(composerReduce, EMPTY_COMPOSER);
  const [shift, setShift] = useState(false);
  const [answered, setAnswered] = useState<boolean | null>(null);
  const typed = renderComposer(state);

  const submit = () => {
    if (answered !== null || typed.length === 0) return;
    const ok = typed === word.ko;
    setAnswered(ok);
    onAnswer(ok);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Enter") {
        e.preventDefault();
        if (answered !== null) onNext();
        else submit();
        return;
      }
      if (answered !== null) return;
      if (e.key === "Backspace") {
        e.preventDefault();
        dispatch({ type: "backspace" });
        return;
      }
      if (e.key === " ") {
        e.preventDefault();
        dispatch({ type: "space" });
        return;
      }
      const jamo = jamoForKey(e.code, e.shiftKey);
      if (jamo) {
        e.preventDefault();
        dispatch({ type: "jamo", jamo });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <div>
      <div className="text-center">
        <div className="text-[11px] tracking-[0.2em] text-muted uppercase">
          Type this word
        </div>
        <div className="mt-1 flex items-center justify-center gap-1.5 text-xl font-bold">
          {word.en}
          <AudioButton text={word.ko} />
        </div>
        <Rom text={word.rom} className="mt-0.5 block" />
      </div>

      <div
        className={`mx-auto mt-4 flex min-h-16 max-w-sm items-center justify-center rounded-xl border-[1.5px] bg-paper px-4 py-3 ${
          answered === null
            ? "border-line"
            : answered
              ? "border-teal"
              : "border-clay"
        }`}
      >
        <span className="font-korean text-[34px] leading-tight tracking-wide">
          {typed}
          {answered === null && (
            <span className="ml-0.5 inline-block h-8 w-px animate-pulse bg-muted align-middle" />
          )}
        </span>
      </div>

      {answered === null ? (
        <button
          onClick={submit}
          disabled={typed.length === 0}
          className={`mt-3.5 w-full rounded-xl py-3 text-sm font-bold text-on-accent transition-opacity ${
            typed.length > 0 ? "bg-teal hover:opacity-90" : "bg-teal/35"
          }`}
        >
          Check <span className="font-normal opacity-70">(Enter)</span>
        </button>
      ) : answered ? (
        <div className="mt-3.5 text-center">
          <div className="text-sm font-bold text-teal">Correct!</div>
          <NextButton onClick={onNext} />
        </div>
      ) : (
        <TypingFeedback
          typed={typed}
          ko={word.ko}
          rom={word.rom}
          onNext={onNext}
        />
      )}

      <KoreanKeyboard
        shift={shift}
        onShift={setShift}
        onJamo={(j) => dispatch({ type: "jamo", jamo: j })}
        onBackspace={() => dispatch({ type: "backspace" })}
        disabled={answered !== null}
      />
    </div>
  );
}

/** Word-meaning MCQ (the "word" drill kind): 물 → which meaning? Shared by
 *  the module tests and the review queue. */
export function WordMeaningQuestion({
  word,
  options,
  nextLabel,
  onAnswer,
  onNext,
}: {
  word: Word;
  options: Word[];
  nextLabel?: string;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
}) {
  return (
    <ChoiceQuestion
      prompt={
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 font-korean text-[34px] font-semibold">
            {word.ko}
            <AudioButton text={word.ko} />
          </div>
          <Rom text={word.rom} className="mt-0.5 block" />
          <div className="mt-2.5 mb-3.5 text-[12.5px] text-muted">
            What does it mean? <span className="text-[11px]">(keys 1–4)</span>
          </div>
        </div>
      }
      options={options.map((o) => ({ id: o.id, label: o.en }))}
      answerId={word.id}
      explain={
        <>
          <span className="font-korean text-ink">{word.ko}</span> is{" "}
          <b className="text-ink">{word.en}</b>
          {word.notes ? <> — {word.notes}</> : null}
        </>
      }
      explainWrong={(pickedId) => {
        const p = options.find((o) => o.id === pickedId);
        return p ? (
          <WhyWrong
            picked={{
              title: (
                <>
                  “{p.en}” is <span className="font-korean">{p.ko}</span>
                </>
              ),
              body: p.notes ?? <Rom text={p.rom} />,
            }}
            answer={{
              title: (
                <>
                  <span className="font-korean">{word.ko}</span> means “
                  {word.en}”
                </>
              ),
              body: word.notes ?? <Rom text={word.rom} />,
            }}
          />
        ) : null;
      }}
      nextLabel={nextLabel}
      onAnswer={onAnswer}
      onNext={onNext}
    />
  );
}
