import { useEffect, useMemo, useReducer, useState } from "react";
import { Link } from "react-router";
import { allWords } from "../../../content";
import type { Word } from "../../../types";
import { useKnownWords } from "../../../db/useKnownWords";
import { unlockedWords } from "../../../lib/gating";
import {
  composerReduce,
  renderComposer,
  EMPTY_COMPOSER,
} from "../../../lib/hangul/composer";
import { jamoForKey } from "../../../lib/hangul/keymap";
import { useDrillEngine } from "../engine/useDrillEngine";
import DrillScaffold from "../engine/DrillScaffold";
import KoreanKeyboard from "./KoreanKeyboard";
import TypingFeedback from "./TypingFeedback";
import AudioButton from "../../../components/AudioButton";
import Rom from "../../../components/Rom";
import { useReviewFilter } from "../../review/useReviewFilter";
import ReviewBanner from "../../review/ReviewBanner";
import ReviewEmpty from "../../review/ReviewEmpty";

function TypingDrill({ reviewIds }: { reviewIds?: Set<string> }) {
  const known = useKnownWords();
  const pool = useMemo(() => {
    const base = known ? unlockedWords(allWords, known) : [];
    return reviewIds ? base.filter((w) => reviewIds.has(w.id)) : base;
  }, [known, reviewIds]);

  const engine = useDrillEngine<Word>({ kind: "typing", pool });
  const current = engine.current;

  const [state, dispatch] = useReducer(composerReduce, EMPTY_COMPOSER);
  const [shift, setShift] = useState(false);
  const [imeHint, setImeHint] = useState(false);
  const typed = renderComposer(state);

  // Clear the composer whenever the engine moves to a new item
  const [lastItem, setLastItem] = useState(current?.id ?? "");
  if ((current?.id ?? "") !== lastItem) {
    setLastItem(current?.id ?? "");
    dispatch({ type: "clear" });
    setShift(false);
  }

  const submit = () => {
    if (!current || engine.answered || typed.length === 0) return;
    const ok = typed === current.ko;
    // wrong answers hold for the correction panel; correct auto-advances
    engine.answer(ok, ok ? undefined : { advanceAfterMs: null });
  };

  // Physical keyboard — mapped by physical position (e.code), so no OS
  // Korean IME is needed. If one IS active, we hint to switch it off.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Process") {
        setImeHint(true);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (engine.answered) engine.advance();
        else submit();
        return;
      }
      if (engine.answered) return;
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
    const onComposition = () => setImeHint(true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("compositionstart", onComposition);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("compositionstart", onComposition);
    };
  });

  if (!known) return null;

  if (reviewIds && pool.length === 0) return <ReviewEmpty />;

  if (pool.length === 0) {
    return (
      <div>
        <Link
          to="/drill"
          className="mb-4 inline-block text-[13px] font-semibold text-muted transition-colors hover:text-ink"
        >
          ← Drills
        </Link>
        <div className="rounded-2xl border border-dashed border-line bg-panel px-6 py-10 text-center">
          <div className="font-korean text-3xl">키</div>
          <div className="mt-3 text-sm font-semibold">No words to type yet</div>
          <p className="mx-auto mt-1.5 max-w-xs text-[13px] leading-relaxed text-muted">
            The typing drill uses words you've marked as learned. Check some
            off in{" "}
            <Link to="/learn" className="font-semibold text-teal underline">
              Learn
            </Link>{" "}
            first.
          </p>
        </div>
      </div>
    );
  }

  if (!current) return null;
  const wrong = engine.answered && typed !== current.ko;

  return (
    <DrillScaffold
      eyebrow="한글 · Typing"
      title="Type the Korean"
      blurb="Real 2-beolsik layout — the app composes the syllable blocks. Your physical keyboard works too."
      seen={engine.seen}
      correct={engine.correct}
      pct={engine.pct}
      onReset={() => {
        dispatch({ type: "clear" });
        engine.reset();
      }}
      missed={engine.missed.map((m) => ({ id: m.id, big: m.ko, small: m.en }))}
      controls={reviewIds ? <ReviewBanner count={pool.length} /> : undefined}
    >
      {/* Prompt */}
      <div className="text-center">
        <div className="text-[11px] tracking-[0.2em] text-muted uppercase">
          Type this word
        </div>
        <div className="mt-1 flex items-center justify-center gap-1.5 text-xl font-bold">
          {current.en}
          <AudioButton text={current.ko} />
        </div>
        <Rom text={current.rom} className="mt-0.5 block" />
      </div>

      {/* Composer display */}
      <div
        className={`mx-auto mt-4 flex min-h-16 max-w-sm items-center justify-center rounded-xl border-[1.5px] bg-paper px-4 py-3 ${
          engine.answered
            ? wrong
              ? "border-clay"
              : "border-teal"
            : "border-line"
        }`}
      >
        <span className="font-korean text-[34px] leading-tight tracking-wide">
          {typed}
          {!engine.answered && (
            <span className="ml-0.5 inline-block h-8 w-px animate-pulse bg-muted align-middle" />
          )}
        </span>
      </div>

      {imeHint && (
        <p className="mt-2 text-center text-[11.5px] text-clay">
          Your system Korean keyboard seems active — switch it to English. The
          app does the Hangul composing itself.
        </p>
      )}

      {/* Feedback / submit */}
      {!engine.answered ? (
        <button
          onClick={submit}
          disabled={typed.length === 0}
          className={`mt-3.5 w-full rounded-xl py-3 text-sm font-bold text-on-accent transition-opacity ${
            typed.length > 0 ? "bg-teal hover:opacity-90" : "bg-teal/35"
          }`}
        >
          Check <span className="font-normal opacity-70">(Enter)</span>
        </button>
      ) : wrong ? (
        <TypingFeedback
          typed={typed}
          ko={current.ko}
          rom={current.rom}
          onNext={engine.advance}
        />
      ) : (
        <div className="mt-3.5 text-center text-sm font-bold text-teal">
          Correct!
        </div>
      )}

      <KoreanKeyboard
        shift={shift}
        onShift={setShift}
        onJamo={(j) => dispatch({ type: "jamo", jamo: j })}
        onBackspace={() => dispatch({ type: "backspace" })}
        disabled={engine.answered}
      />
    </DrillScaffold>
  );
}

export default function TypingDrillRoute() {
  const { active, ids } = useReviewFilter("typing");
  if (active && !ids) return null;
  return (
    <TypingDrill
      key={active ? "review" : "normal"}
      reviewIds={active ? ids : undefined}
    />
  );
}
