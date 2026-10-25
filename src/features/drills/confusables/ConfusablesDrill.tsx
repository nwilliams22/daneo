import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import { confusables } from "../../../content";
import type { ConfusableItem } from "../../../types";
import {
  generateConfusableOptions,
  generateConfusableTrueFalse,
} from "../../../lib/distractors";
import { useDrillEngine } from "../engine/useDrillEngine";
import { useDrillKeys } from "../engine/useDrillKeys";
import DrillScaffold from "../engine/DrillScaffold";
import QuizOptions from "../engine/QuizOptions";
import GlyphCard from "../engine/GlyphCard";
import WhyWrong from "../engine/WhyWrong";
import { FACE_FONT, FACE_LABEL, randomFace } from "../engine/faceFont";
import Chip from "../../../components/Chip";
import AudioButton from "../../../components/AudioButton";
import { useReviewFilter } from "../../review/useReviewFilter";
import ReviewBanner from "../../review/ReviewBanner";
import ReviewEmpty from "../../review/ReviewEmpty";

const SETS: { key: string; label: string }[] = [
  { key: "all", label: "Everything" },
  { key: "compound", label: "Compound vowels" },
  { key: "vowel", label: "Look-alike vowels" },
  { key: "consonant", label: "Look-alike consonants" },
  { key: "tense", label: "Aspirated & tense" },
];

type Mode = "flashcard" | "quiz";

function ConfusablesDrill({
  mode,
  reviewIds,
}: {
  mode: Mode;
  reviewIds?: Set<string>;
}) {
  const [setKey, setSetKey] = useState<string>(reviewIds ? "all" : "compound");
  const [mixFonts, setMixFonts] = useState(false);
  /** Flashcard true/false call, or null before the learner answers. */
  const [said, setSaid] = useState<boolean | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  const buildPool = (key: string) => {
    const base =
      key === "all" ? confusables : confusables.filter((c) => c.group === key);
    return reviewIds ? base.filter((c) => reviewIds.has(c.id)) : base;
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pool = useMemo(() => buildPool(setKey), [setKey, reviewIds]);

  const engine = useDrillEngine<ConfusableItem>({
    kind: "confusable",
    pool,
  });
  const current = engine.current;

  const options = useMemo(
    () => (current ? generateConfusableOptions(current, pool) : []),
    [current, pool],
  );

  // Flashcards are app-graded (BAD-279): one letter, one sound, true or false.
  // `round` counts manual advances, so a letter that comes round again — in a
  // one-item review pool, every time — gets a freshly drawn true/false case,
  // while the card itself stays put while the learner reads it.
  const [round, setRound] = useState(0);
  // The false sound is drawn from the whole set, not the drill pool: a set
  // filter or a one-item review queue decides which letters get tested, not
  // which look-alike may lend its sound. The builder still prefers the
  // target's own group, which is the selected set whenever one is selected.
  const tf = useMemo(
    () => (current ? generateConfusableTrueFalse(current, confusables) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current?.id, engine.index, round],
  );

  const nextCard = () => {
    setRound((r) => r + 1);
    engine.advance();
  };

  // Cross-font difficulty (PROJECT.md §5): one random face per prompt,
  // stable until the engine advances. Non-Gothic answers log their face.
  const face = useMemo(
    () => (mixFonts ? randomFace() : "gothic"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mixFonts, current?.id, engine.index],
  );
  const faceOpt = face === "gothic" ? undefined : face;

  const switchSet = (key: string) => {
    setSetKey(key);
    setSaid(null);
    setPicked(null);
    setRound((r) => r + 1);
    engine.reset(buildPool(key));
  };

  /** The learner calls the shown sound true or false; the app decides who was
   *  right, and that — never a self-report — is what reaches the schedule. */
  const answerFlash = (call: boolean) => {
    if (said !== null || !tf) return;
    setSaid(call);
    // Hold on the reveal card so the contrast gets read before advancing.
    engine.answer(call === tf.isTrue, { advanceAfterMs: null, face: faceOpt });
  };

  const pickQuiz = (id: string) => {
    if (picked || !current) return;
    setPicked(id);
    const ok = id === current.id;
    // Correct keeps the snappy auto-advance; wrong holds for the why-panel.
    engine.answer(ok, { face: faceOpt, advanceAfterMs: ok ? undefined : null });
  };

  // Clear per-item UI state when the engine advances
  const itemKey = current?.id ?? "";
  const [lastItem, setLastItem] = useState(itemKey);
  if (itemKey !== lastItem) {
    setLastItem(itemKey);
    setSaid(null);
    setPicked(null);
  }
  // A one-item pool keeps the same id and index across an advance, so the
  // feedback window — not the item key — is what clears the flashcard call.
  if (said !== null && !engine.answered) setSaid(null);

  useDrillKeys({
    onSpace: mode === "flashcard" && engine.answered ? nextCard : undefined,
    onNumber:
      mode === "flashcard"
        ? said === null
          ? (n) => {
              if (n === 1) answerFlash(false);
              else if (n === 2) answerFlash(true);
            }
          : undefined
        : !picked
          ? (n) => {
              const o = options[n - 1];
              if (o) pickQuiz(o.id);
            }
          : undefined,
    onEnter: engine.answered ? nextCard : undefined,
  });

  if (reviewIds && pool.length === 0) return <ReviewEmpty />;
  if (!current) return null;
  const wrongPick = picked !== null && picked !== current.id;
  const pickedItem = wrongPick ? options.find((o) => o.id === picked) : undefined;

  return (
    <DrillScaffold
      eyebrow="한글 · Confusables"
      title={mode === "flashcard" ? "Look-alike Flashcards" : "Look-alike Quiz"}
      blurb={
        mode === "flashcard"
          ? "One letter, one sound, true or false — a wrong sound always belongs to a look-alike, and the card then shows what gets mistaken for what."
          : "Four sounds, one letter — distractors always come from the same confusable group."
      }
      seen={engine.seen}
      correct={engine.correct}
      pct={engine.pct}
      onReset={() => {
        setSaid(null);
        setPicked(null);
        setRound((r) => r + 1);
        engine.reset();
      }}
      missed={engine.missed.map((m) => ({ id: m.id, big: m.c, small: m.r }))}
      controls={
        <div className="mb-4">
          {reviewIds && <ReviewBanner count={pool.length} />}
          {!reviewIds && (
            <div className="mb-3 flex flex-wrap gap-2">
              {SETS.map((s) => (
                <Chip
                  key={s.key}
                  active={setKey === s.key}
                  onClick={() => switchSet(s.key)}
                >
                  {s.label}
                </Chip>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Chip active={mixFonts} onClick={() => setMixFonts(!mixFonts)}>
              Mixed fonts
            </Chip>
            <Link
              to={
                mode === "flashcard"
                  ? "/drill/confusables/quiz"
                  : "/drill/confusables/flashcards"
              }
              className="ml-auto text-[12px] font-semibold text-muted underline underline-offset-2 transition-colors hover:text-ink"
            >
              {mode === "flashcard" ? "Quiz instead →" : "Flashcards instead →"}
            </Link>
          </div>
        </div>
      }
    >
      {mixFonts && (
        <div className="mb-2 text-center text-[10.5px] tracking-[0.15em] text-muted uppercase">
          {FACE_LABEL[face]}
        </div>
      )}
      <GlyphCard glyph={current.c} faceClass={FACE_FONT[face]} />

      {mode === "flashcard" && tf && (
        <div>
          <div className="mb-3 text-center text-[13px] text-muted">
            This letter is{" "}
            <span className="text-base font-bold text-ink">{tf.sound}</span> —
            true or false? <span className="text-xs">(keys 1–2)</span>
          </div>
          {said === null ? (
            <div className="flex gap-2.5">
              <button
                onClick={() => answerFlash(false)}
                className="flex-1 rounded-xl border border-clay py-3 text-sm font-bold text-clay transition-colors hover:bg-clay hover:text-on-accent"
              >
                False <span className="font-normal opacity-70">(1)</span>
              </button>
              <button
                onClick={() => answerFlash(true)}
                className="flex-1 rounded-xl border border-teal py-3 text-sm font-bold text-teal transition-colors hover:bg-teal hover:text-on-accent"
              >
                True <span className="font-normal opacity-70">(2)</span>
              </button>
            </div>
          ) : (
            <div>
              <div
                className={`text-center text-sm font-bold ${
                  said === tf.isTrue ? "text-teal" : "text-clay"
                }`}
              >
                {said === tf.isTrue ? "Correct" : "Not quite"}
              </div>
              <div className="mt-3 border-t border-line pt-3 text-center">
                <div className="flex items-center justify-center gap-2 text-3xl font-bold tracking-tight">
                  {current.r}
                  <AudioButton text={current.c} />
                </div>
                <div className="mx-auto mt-2 max-w-xs text-[13.5px] leading-relaxed text-muted">
                  {current.note}
                </div>
                {tf.decoy && (
                  <div className="mx-auto mt-2 max-w-xs text-[13.5px] leading-relaxed text-muted">
                    <span className="font-semibold text-ink">{tf.sound}</span> is{" "}
                    <span className="font-korean">{tf.decoy.c}</span> —{" "}
                    {tf.decoy.note}
                  </div>
                )}
              </div>
              <button
                onClick={nextCard}
                className="mt-4 w-full rounded-xl bg-teal py-3 text-sm font-bold text-on-accent"
              >
                Next <span className="font-normal opacity-70">(Enter)</span>
              </button>
            </div>
          )}
        </div>
      )}

      {mode === "quiz" && (
        <div>
          <div className="mb-3 text-center text-[13px] text-muted">
            Which sound is this?{" "}
            <span className="text-xs">(keys 1–4)</span>
          </div>
          <QuizOptions
            options={options.map((o) => ({ id: o.id, label: o.r }))}
            pickedId={picked}
            answerId={current.id}
            onPick={pickQuiz}
          />
          {wrongPick && pickedItem && (
            <div className="mt-3.5 border-t border-line pt-3">
              <WhyWrong
                picked={{
                  title: (
                    <>
                      <span className="font-korean">{pickedItem.c}</span> is{" "}
                      {pickedItem.r}
                    </>
                  ),
                  body: pickedItem.note,
                }}
                answer={{
                  title: (
                    <>
                      <span className="font-korean">{current.c}</span> is{" "}
                      {current.r}
                    </>
                  ),
                  body: current.note,
                }}
              />
              <button
                onClick={engine.advance}
                className="mt-3.5 w-full rounded-xl bg-teal py-3 text-sm font-bold text-on-accent"
              >
                Next <span className="font-normal opacity-70">(Enter)</span>
              </button>
            </div>
          )}
        </div>
      )}
    </DrillScaffold>
  );
}

/** Flashcards and quiz are distinct routes (TASKS.md 2026-08-01, Nick):
 *  /drill/confusables/flashcards and /drill/confusables/quiz. */
export default function ConfusablesDrillRoute() {
  const { mode } = useParams();
  const { active, ids } = useReviewFilter("confusable");
  if (mode !== "flashcards" && mode !== "quiz")
    return <Navigate to="/drill/confusables/flashcards" replace />;
  if (active && !ids) return null; // wait for the missed-item query
  return (
    <ConfusablesDrill
      key={`${mode}:${active ? "review" : "normal"}`}
      mode={mode === "flashcards" ? "flashcard" : "quiz"}
      reviewIds={active ? ids : undefined}
    />
  );
}
