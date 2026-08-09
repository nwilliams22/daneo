import { useMemo, type ReactNode } from "react";
import { confusables } from "../../../content";
import {
  diffTyping,
  jamoContrast,
  type DiffOp,
  type JamoDiff,
} from "../../../lib/feedback";
import AudioButton from "../../../components/AudioButton";
import Rom from "../../../components/Rom";

// "Why was I wrong" for the typing drill (TASKS.md 2026-08-02, Nick): the
// composition engine diffs the answer jamo-by-jamo, and mix-ups the app
// already trains as confusable pairs get their contrast note attached.

const SLOT_LABEL: Record<JamoDiff["slot"], string> = {
  cho: "first consonant",
  jung: "vowel",
  jong: "batchim",
};

const Ko = ({ children }: { children: ReactNode }) => (
  <span className="font-korean font-semibold text-ink">{children}</span>
);

function jamoLine(op: Extract<DiffOp, { type: "sub" }>, d: JamoDiff): ReactNode {
  const contrast = jamoContrast(d.typed, d.answer, confusables);
  const tail = contrast && (
    <>
      {" "}
      — <Ko>{contrast.typed.c}</Ko> ({contrast.typed.r}) vs{" "}
      <Ko>{contrast.answer.c}</Ko> ({contrast.answer.r}): {contrast.answer.note}
    </>
  );
  if (d.slot === "jong" && !d.typed)
    return (
      <>
        <Ko>{op.typed}</Ko> is missing its batchim — <Ko>{op.answer}</Ko> ends
        in <Ko>{d.answer}</Ko>.{tail}
      </>
    );
  if (d.slot === "jong" && !d.answer)
    return (
      <>
        <Ko>{op.typed}</Ko> has an extra batchim <Ko>{d.typed}</Ko> — it's just{" "}
        <Ko>{op.answer}</Ko>.{tail}
      </>
    );
  return (
    <>
      In <Ko>{op.typed}</Ko>, the {SLOT_LABEL[d.slot]} should be{" "}
      <Ko>{d.answer}</Ko>, not <Ko>{d.typed}</Ko>.{tail}
    </>
  );
}

function opLines(op: DiffOp): ReactNode[] {
  switch (op.type) {
    case "match":
      return [];
    case "missing":
      return [
        op.answer === " " ? (
          <>The word has a space you didn't type.</>
        ) : (
          <>
            You're missing <Ko>{op.answer}</Ko>.
          </>
        ),
      ];
    case "extra":
      return [
        op.typed === " " ? (
          <>There's an extra space.</>
        ) : (
          <>
            <Ko>{op.typed}</Ko> is extra — the word doesn't have it.
          </>
        ),
      ];
    case "sub":
      if (op.jamo.length === 0)
        return [
          <>
            You typed <Ko>{op.typed}</Ko> where <Ko>{op.answer}</Ko> goes.
          </>,
        ];
      return op.jamo.map((d) => jamoLine(op, d));
  }
}

const MAX_LINES = 4;

export default function TypingFeedback({
  typed,
  ko,
  rom,
  onNext,
}: {
  typed: string;
  ko: string;
  rom?: string;
  onNext: () => void;
}) {
  const ops = useMemo(() => diffTyping(typed, ko), [typed, ko]);
  const lines = ops.flatMap(opLines);

  return (
    <div className="mt-3.5">
      <div className="text-center">
        <div className="text-[13.5px] font-semibold text-clay">
          Not quite — it's written:
        </div>
        <div className="mt-1 flex items-center justify-center gap-1 font-korean text-3xl font-semibold">
          <span>
            {ops.map((op, i) =>
              op.type === "match" ? (
                <span key={i}>{op.ch}</span>
              ) : op.type === "extra" ? null : (
                <span key={i} className="text-teal">
                  {op.answer}
                </span>
              ),
            )}
          </span>
          <AudioButton text={ko} />
        </div>
        {rom && <Rom text={rom} className="mt-0.5 block" />}
        <div className="mt-2 text-[13px] text-muted">
          you typed:{" "}
          <span className="font-korean text-[17px]">
            {ops.map((op, i) =>
              op.type === "match" ? (
                <span key={i}>{op.ch}</span>
              ) : op.type === "missing" ? null : (
                <span key={i} className="font-semibold text-clay">
                  {op.typed}
                </span>
              ),
            )}
          </span>
        </div>
      </div>

      {lines.length > 0 && (
        <div className="mx-auto mt-3 max-w-sm rounded-lg border-l-[3px] border-l-clay bg-paper px-3 py-2 text-left">
          <div className="text-[10px] font-semibold tracking-[0.15em] text-clay uppercase">
            What went wrong
          </div>
          <ul className="mt-1 space-y-1 text-[13px] leading-relaxed text-muted">
            {lines.slice(0, MAX_LINES).map((l, i) => (
              <li key={i}>{l}</li>
            ))}
            {lines.length > MAX_LINES && (
              <li>…and {lines.length - MAX_LINES} more.</li>
            )}
          </ul>
        </div>
      )}

      <button
        onClick={onNext}
        className="mt-3.5 w-full rounded-xl bg-ink py-3 text-sm font-bold text-paper"
      >
        Next <span className="font-normal opacity-70">(Enter)</span>
      </button>
    </div>
  );
}
