import { useMemo, useState } from "react";
import { confusables } from "../../../content";
import type { ConfusableItem } from "../../../types";
import { generateConfusableOptions } from "../../../lib/distractors";
import { useDrillEngine } from "../engine/useDrillEngine";
import { useDrillKeys } from "../engine/useDrillKeys";
import DrillScaffold from "../engine/DrillScaffold";
import QuizOptions from "../engine/QuizOptions";
import Chip from "../../../components/Chip";
import ModeToggle from "../../../components/ModeToggle";
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

/** The 원고지-style practice square with crosshair guides. */
function GlyphCard({
  glyph,
  onClick,
}: {
  glyph: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`relative mx-auto mb-5 flex h-40 w-40 items-center justify-center overflow-hidden rounded-2xl border border-line bg-paper ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div className="absolute inset-y-2.5 left-1/2 w-px bg-grid" />
      <div className="absolute inset-x-2.5 top-1/2 h-px bg-grid" />
      <span className="font-korean text-8xl leading-none font-medium select-none">
        {glyph}
      </span>
    </div>
  );
}

function ConfusablesDrill({ reviewIds }: { reviewIds?: Set<string> }) {
  const [setKey, setSetKey] = useState<string>(reviewIds ? "all" : "compound");
  const [mode, setMode] = useState<Mode>(reviewIds ? "quiz" : "flashcard");
  const [revealed, setRevealed] = useState(false);
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

  const switchSet = (key: string) => {
    setSetKey(key);
    setRevealed(false);
    setPicked(null);
    engine.reset(buildPool(key));
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setRevealed(false);
    setPicked(null);
  };

  const gradeFlash = (got: boolean) => {
    setRevealed(false);
    engine.answer(got, { advanceAfterMs: 0 });
  };

  const pickQuiz = (id: string) => {
    if (picked || !current) return;
    setPicked(id);
    engine.answer(id === current.id);
  };

  // Clear per-item UI state when the engine advances
  const itemKey = current?.id ?? "";
  const [lastItem, setLastItem] = useState(itemKey);
  if (itemKey !== lastItem) {
    setLastItem(itemKey);
    setRevealed(false);
    setPicked(null);
  }

  useDrillKeys({
    onSpace:
      mode === "flashcard" && !revealed ? () => setRevealed(true) : undefined,
    onNumber:
      mode === "flashcard"
        ? revealed
          ? (n) => {
              if (n === 1) gradeFlash(false);
              else if (n === 2) gradeFlash(true);
            }
          : undefined
        : !picked
          ? (n) => {
              const o = options[n - 1];
              if (o) pickQuiz(o.id);
            }
          : undefined,
    onEnter: engine.answered ? engine.advance : undefined,
  });

  if (reviewIds && pool.length === 0) return <ReviewEmpty />;
  if (!current) return null;
  const wrongPick = picked !== null && picked !== current.id;

  return (
    <DrillScaffold
      eyebrow="한글 · Confusables"
      title="Look-alike Drill"
      blurb="Train the distinctions, not just the letters. Each reveal shows what it gets mistaken for."
      seen={engine.seen}
      correct={engine.correct}
      pct={engine.pct}
      onReset={() => {
        setRevealed(false);
        setPicked(null);
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
          <ModeToggle
            modes={[
              { value: "flashcard", label: "Flashcard" },
              { value: "quiz", label: "Quiz" },
            ]}
            value={mode}
            onChange={switchMode}
          />
        </div>
      }
    >
      <GlyphCard
        glyph={current.c}
        onClick={
          mode === "flashcard" && !revealed ? () => setRevealed(true) : undefined
        }
      />

      {mode === "flashcard" &&
        (!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="w-full rounded-xl border border-line py-3 text-sm font-semibold text-muted transition-colors hover:text-ink"
          >
            Tap to reveal <span className="text-xs">(Space)</span>
          </button>
        ) : (
          <div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-3xl font-bold tracking-tight">
                {current.r}
                <AudioButton text={current.c} />
              </div>
              <div className="mx-auto mt-2 max-w-xs text-[13.5px] leading-relaxed text-muted">
                {current.note}
              </div>
            </div>
            <div className="mt-4 flex gap-2.5">
              <button
                onClick={() => gradeFlash(false)}
                className="flex-1 rounded-xl border border-clay py-3 text-sm font-bold text-clay transition-colors hover:bg-clay hover:text-on-accent"
              >
                Missed it <span className="font-normal opacity-70">(1)</span>
              </button>
              <button
                onClick={() => gradeFlash(true)}
                className="flex-[1.4] rounded-xl bg-teal py-3 text-sm font-bold text-on-accent transition-opacity hover:opacity-90"
              >
                Got it <span className="font-normal opacity-70">(2)</span>
              </button>
            </div>
          </div>
        ))}

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
          {wrongPick && (
            <div className="mt-3 text-center text-[13px] leading-relaxed text-muted">
              {current.c} is <b className="text-ink">{current.r}</b> —{" "}
              {current.note}
            </div>
          )}
        </div>
      )}
    </DrillScaffold>
  );
}

export default function ConfusablesDrillRoute() {
  const { active, ids } = useReviewFilter("confusable");
  if (active && !ids) return null; // wait for the missed-item query
  return (
    <ConfusablesDrill
      key={active ? "review" : "normal"}
      reviewIds={active ? ids : undefined}
    />
  );
}
