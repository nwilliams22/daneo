import { useMemo, useState } from "react";
import { Link } from "react-router";
import { allSentences } from "../../../content";
import type { Chunk, Role, Sentence } from "../../../types";
import { useKnownWords } from "../../../db/useKnownWords";
import { unlockedSentences } from "../../../lib/gating";
import { logDrillResult } from "../../../db/repo";
import { firstArrangeMismatch } from "../../../lib/feedback";
import { shuffle } from "../../../lib/rng";
import { useDrillKeys } from "../engine/useDrillKeys";
import DrillScaffold from "../engine/DrillScaffold";
import ModeToggle from "../../../components/ModeToggle";
import AudioButton from "../../../components/AudioButton";
import Rom from "../../../components/Rom";
import { useReviewFilter } from "../../review/useReviewFilter";
import ReviewBanner from "../../review/ReviewBanner";
import ReviewEmpty from "../../review/ReviewEmpty";

const ROLE_COLOR: Record<Role, { text: string; border: string }> = {
  subject: { text: "text-subject", border: "border-subject" },
  object: { text: "text-object", border: "border-object" },
  place: { text: "text-place", border: "border-place" },
  verb: { text: "text-verb", border: "border-verb" },
  other: { text: "text-ink", border: "border-ink" },
};

const ROLE_LEGEND: { role: Role; dot: string; label: string }[] = [
  { role: "subject", dot: "bg-subject", label: "subject" },
  { role: "object", dot: "bg-object", label: "object" },
  { role: "place", dot: "bg-place", label: "place" },
  { role: "verb", dot: "bg-verb", label: "verb" },
];

type Mode = "study" | "arrange";

/** Arrange-mode answer = the gloss chunks minus droppables/parentheticals. */
const arrangeAnswer = (s: Sentence) =>
  s.gloss.filter((c) => c.t && !c.t.startsWith("("));

function Layer({
  label,
  chunks,
  layer,
  highlight,
  onTap,
}: {
  label: string;
  chunks: Chunk[];
  layer: "en" | "gloss" | "ko";
  highlight: string | null;
  onTap: (id: string) => void;
}) {
  return (
    <div className="mb-2.5">
      <div className="mb-1 pl-1 text-[10px] tracking-[0.15em] text-muted uppercase">
        {label}
      </div>
      <div>
        {chunks
          .filter((c) => c.t)
          .map((c) => {
            const active = highlight === c.id;
            const color = ROLE_COLOR[c.role];
            return (
              <button
                key={c.id}
                onClick={() => onTap(c.id)}
                className={`m-0.5 inline-block rounded-lg border-[1.5px] px-2.5 py-1 leading-snug transition-colors ${
                  layer === "ko" ? "font-korean text-2xl" : "text-[15px]"
                } ${c.role === "verb" ? "font-bold" : "font-medium"} ${color.text} ${
                  active ? `${color.border} bg-ink/5` : "border-transparent"
                }`}
              >
                {c.t}
              </button>
            );
          })}
      </div>
    </div>
  );
}

function AnatomyDrill({ reviewIds }: { reviewIds?: Set<string> }) {
  const known = useKnownWords();
  const pool = useMemo(() => {
    const base = known ? unlockedSentences(allSentences, known) : [];
    return reviewIds ? base.filter((s) => reviewIds.has(s.id)) : base;
  }, [known, reviewIds]);

  const [si, setSi] = useState(0);
  const [mode, setMode] = useState<Mode>(reviewIds ? "arrange" : "study");
  const [highlight, setHighlight] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Chunk[]>([]);
  const [bank, setBank] = useState<Chunk[]>([]);
  const [checked, setChecked] = useState(false);
  const [seen, setSeen] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [missed, setMissed] = useState<Sentence[]>([]);

  const s = pool[Math.min(si, Math.max(0, pool.length - 1))];
  const answer = useMemo(() => (s ? arrangeAnswer(s) : []), [s]);

  const setupArrange = (sentence: Sentence) => {
    setBank(shuffle(arrangeAnswer(sentence)));
    setPlaced([]);
    setChecked(false);
  };

  const goTo = (i: number) => {
    setSi(i);
    setHighlight(null);
    const target = pool[i];
    if (target) setupArrange(target);
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setHighlight(null);
    if (s) setupArrange(s);
  };

  const place = (chunk: Chunk) => {
    if (checked) return;
    setBank((b) => b.filter((x) => x !== chunk));
    setPlaced((p) => [...p, chunk]);
  };

  const unplace = (chunk: Chunk) => {
    if (checked) return;
    setPlaced((p) => p.filter((x) => x !== chunk));
    setBank((b) => [...b, chunk]);
  };

  const isCorrect =
    placed.length === answer.length &&
    placed.every((c, i) => c.t === answer[i]!.t);
  const mismatch =
    checked && !isCorrect ? firstArrangeMismatch(placed, answer) : null;

  const check = () => {
    if (!s || checked || placed.length !== answer.length) return;
    setChecked(true);
    setSeen((n) => n + 1);
    if (isCorrect) setCorrect((c) => c + 1);
    else
      setMissed((m) => (m.some((x) => x.id === s.id) ? m : [...m, s]));
    logDrillResult({ kind: "anatomy", itemId: s.id, correct: isCorrect });
  };

  useDrillKeys({
    enabled: mode === "arrange",
    onNumber: !checked
      ? (n) => {
          const chunk = bank[n - 1];
          if (chunk) place(chunk);
        }
      : undefined,
    onEnter: () => {
      if (!checked) check();
      else goTo((si + 1) % pool.length);
    },
    onBackspace: !checked
      ? () => {
          const last = placed[placed.length - 1];
          if (last) unplace(last);
        }
      : undefined,
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
          <div className="font-korean text-3xl">문</div>
          <div className="mt-3 text-sm font-semibold">
            No sentences unlocked yet
          </div>
          <p className="mx-auto mt-1.5 max-w-xs text-[13px] leading-relaxed text-muted">
            Sentence anatomy only ever shows you sentences built from words you
            know. Check words off in{" "}
            <Link to="/learn" className="font-semibold text-teal underline">
              Learn
            </Link>{" "}
            to unlock them.
          </p>
        </div>
      </div>
    );
  }

  if (!s) return null;
  const koText = s.ko.map((c) => c.t).filter(Boolean).join(" ");

  return (
    <DrillScaffold
      eyebrow="한국어 · Sentence anatomy"
      title="How Korean Orders a Sentence"
      blurb="English → English in Korean order → Korean. Tap any piece to trace it through all three layers."
      seen={seen}
      correct={correct}
      pct={seen ? Math.round((correct / seen) * 100) : 0}
      onReset={() => {
        setSeen(0);
        setCorrect(0);
        setMissed([]);
        goTo(0);
      }}
      missed={missed.map((m) => ({
        id: m.id,
        big: m.ko.map((c) => c.t).filter(Boolean).join(" "),
        small: m.en.map((c) => c.t).filter(Boolean).join(" "),
      }))}
      controls={
        <div className="mb-4">
          {reviewIds && <ReviewBanner count={pool.length} />}
          <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5">
            {pool.map((x, i) => (
              <button
                key={x.id}
                onClick={() => goTo(i)}
                className={`h-8 w-8 rounded-full border text-[13px] font-semibold transition-colors ${
                  si === i
                    ? "border-ink bg-ink text-paper"
                    : "border-line text-muted hover:text-ink"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <ModeToggle
            className="ml-auto"
            modes={[
              { value: "study", label: "Study" },
              { value: "arrange", label: "Arrange" },
            ]}
            value={mode}
            onChange={switchMode}
          />
          </div>
        </div>
      }
    >
      {mode === "study" ? (
        <div>
          <Layer
            label="Natural English"
            chunks={s.en}
            layer="en"
            highlight={highlight}
            onTap={(id) => setHighlight(highlight === id ? null : id)}
          />
          <div className="my-1 text-center text-sm text-muted">
            ↓ rearrange, attach particles
          </div>
          <Layer
            label="English, Korean order"
            chunks={s.gloss}
            layer="gloss"
            highlight={highlight}
            onTap={(id) => setHighlight(highlight === id ? null : id)}
          />
          <div className="my-1 text-center text-sm text-muted">
            ↓ swap in the Korean words
          </div>
          <Layer
            label="Korean"
            chunks={s.ko}
            layer="ko"
            highlight={highlight}
            onTap={(id) => setHighlight(highlight === id ? null : id)}
          />
          <div className="mt-3 flex items-start justify-between gap-2 border-t border-line pt-3.5">
            <p className="text-[13.5px] leading-relaxed text-muted">{s.note}</p>
            <AudioButton text={koText} />
          </div>
          {s.rom && <Rom text={s.rom} className="mt-1.5 block" />}
        </div>
      ) : (
        <div>
          <div className="text-[15px] font-semibold">
            {s.en.map((c) => c.t).filter(Boolean).join(" ")}
          </div>
          <div className="mt-0.5 mb-3.5 text-[12.5px] text-muted">
            Arrange the pieces in Korean order.{" "}
            <span className="text-[11px]">(1–4 place · Backspace undo · Enter check)</span>
          </div>

          {/* Answer slots */}
          <div
            className={`mb-3 min-h-13 rounded-xl border-[1.5px] border-dashed bg-paper p-2 ${
              checked ? (isCorrect ? "border-teal" : "border-clay") : "border-line"
            }`}
          >
            {placed.map((c, i) => {
              const color = ROLE_COLOR[c.role];
              return (
                <button
                  key={`${c.id}-${i}`}
                  onClick={() => unplace(c)}
                  className={`m-1 inline-block rounded-lg border-[1.5px] bg-panel px-3 py-1.5 text-[15px] font-semibold ${color.text} ${color.border}`}
                >
                  {c.t}
                </button>
              );
            })}
          </div>

          {/* Bank */}
          <div className="mb-3.5">
            {bank.map((c, i) => (
              <button
                key={`${c.id}-${i}`}
                onClick={() => place(c)}
                className="m-1 inline-block rounded-lg border border-line bg-paper px-3 py-1.5 text-[15px] font-semibold text-ink transition-colors hover:border-muted"
              >
                {c.t}
              </button>
            ))}
            {bank.length === 0 && placed.length === 0 && (
              <span className="text-[13px] text-muted">Nothing to place.</span>
            )}
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={() => setupArrange(s)}
              className="flex-1 rounded-xl border border-line py-3 text-sm font-semibold text-muted transition-colors hover:text-ink"
            >
              Reset
            </button>
            <button
              onClick={check}
              disabled={placed.length !== answer.length || checked}
              className={`flex-[2] rounded-xl py-3 text-sm font-bold text-on-accent transition-opacity ${
                placed.length === answer.length && !checked
                  ? "bg-teal hover:opacity-90"
                  : "bg-teal/35"
              }`}
            >
              Check order
            </button>
          </div>

          {checked && (
            <div
              className={`mt-3 text-[13.5px] leading-relaxed font-semibold ${
                isCorrect ? "text-teal" : "text-clay"
              }`}
            >
              {isCorrect ? (
                <>
                  Correct — in Korean:{" "}
                  <span className="font-korean text-[17px] text-ink">
                    {koText}
                  </span>
                  <AudioButton text={koText} className="ml-1" />
                </>
              ) : (
                <>
                  Not quite. Korean order:{" "}
                  <span className="text-ink">
                    {answer.map((c) => c.t).join(" · ")}
                  </span>
                  {mismatch && (
                    <div className="mt-1.5 font-normal text-muted">
                      Slot {mismatch.index + 1}: you placed{" "}
                      <b className={ROLE_COLOR[mismatch.placed.role].text}>
                        {mismatch.placed.t}
                      </b>{" "}
                      ({mismatch.placed.role}) where{" "}
                      <b className={ROLE_COLOR[mismatch.answer.role].text}>
                        {mismatch.answer.t}
                      </b>{" "}
                      ({mismatch.answer.role}) goes.
                    </div>
                  )}
                </>
              )}
              <button
                onClick={() => goTo((si + 1) % pool.length)}
                className="mt-3 block w-full rounded-xl bg-ink py-3 text-sm font-bold text-paper"
              >
                Next sentence <span className="font-normal opacity-70">(Enter)</span>
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-wrap justify-center gap-4">
        {ROLE_LEGEND.map((r) => (
          <span key={r.role} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${r.dot}`} />
            <span className="text-[11.5px] text-muted">{r.label}</span>
          </span>
        ))}
      </div>
    </DrillScaffold>
  );
}

export default function AnatomyDrillRoute() {
  const { active, ids } = useReviewFilter("anatomy");
  if (active && !ids) return null;
  return (
    <AnatomyDrill
      key={active ? "review" : "normal"}
      reviewIds={active ? ids : undefined}
    />
  );
}
