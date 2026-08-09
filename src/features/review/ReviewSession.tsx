import { useEffect, useReducer, useState } from "react";
import { Link } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { logDrillResult } from "../../db/repo";
import { dueNow } from "../../lib/srs";
import {
  generateConfusableOptions,
  generateGapOptions,
  generateSentenceOptions,
  sentenceEnglish,
} from "../../lib/distractors";
import { shuffle } from "../../lib/rng";
import {
  allSentences,
  confusables,
  confusableById,
  fontFaces,
  fontLetterById,
  sentenceById,
  wordById,
} from "../../content";
import type {
  ConfusableItem,
  FontFace,
  FontLetterRow,
  GapItem,
  Sentence,
  SrsCard,
  Word,
} from "../../types";
import PageHeader from "../../components/PageHeader";
import AudioButton from "../../components/AudioButton";
import Rom from "../../components/Rom";
import QuizOptions, { type QuizOptionView } from "../drills/engine/QuizOptions";
import GlyphCard from "../drills/engine/GlyphCard";
import WhyWrong from "../drills/engine/WhyWrong";
import TypingFeedback from "../drills/typing/TypingFeedback";
import { FACE_FONT, FACE_LABEL, randomAltFace } from "../drills/engine/faceFont";
import { useDrillKeys } from "../drills/engine/useDrillKeys";
import KoreanKeyboard from "../drills/typing/KoreanKeyboard";
import {
  composerReduce,
  renderComposer,
  EMPTY_COMPOSER,
} from "../../lib/hangul/composer";
import { jamoForKey } from "../../lib/hangul/keymap";
import { useGapPool, type GapPool } from "../drills/gap/useGapPool";

// Phase A.2 — the daily queue as ONE session mixing every drill kind,
// oldest due first. Each answer goes through logDrillResult, so the FSRS
// card moves the moment you answer; wrong answers come back within minutes
// on the next visit.

type Question =
  | { key: string; kind: "confusable"; item: ConfusableItem; options: ConfusableItem[] }
  | { key: string; kind: "font"; item: FontLetterRow; options: FontLetterRow[]; face: FontFace }
  | { key: string; kind: "gap"; item: GapItem; options: GapItem[] }
  | { key: string; kind: "anatomy"; item: Sentence; options: Sentence[] }
  | { key: string; kind: "typing"; item: Word };

function fontLetterOptions(target: FontLetterRow): FontLetterRow[] {
  const distractors: FontLetterRow[] = [];
  const used = new Set([target.r]);
  for (const l of shuffle(fontFaces.letters)) {
    if (distractors.length === 3) break;
    if (used.has(l.r)) continue;
    used.add(l.r);
    distractors.push(l);
  }
  return shuffle([target, ...distractors]);
}

/** Resolve due cards into renderable questions; cards whose item no longer
 *  exists (e.g. a deleted discovery) are skipped. */
function buildQueue(cards: SrsCard[], gapPool: GapPool): Question[] {
  const out: Question[] = [];
  for (const card of dueNow(cards)) {
    const key = `${card.kind}:${card.itemId}`;
    if (card.kind === "confusable") {
      const item = confusableById.get(card.itemId);
      if (item)
        out.push({
          key,
          kind: "confusable",
          item,
          options: generateConfusableOptions(item, confusables),
        });
    } else if (card.kind === "font") {
      const item = fontLetterById.get(card.itemId);
      if (item)
        out.push({
          key,
          kind: "font",
          item,
          options: fontLetterOptions(item),
          face: randomAltFace(),
        });
    } else if (card.kind === "gap") {
      const item = gapPool.byId.get(card.itemId);
      if (item)
        out.push({
          key,
          kind: "gap",
          item,
          options: generateGapOptions(item, gapPool.items),
        });
    } else if (card.kind === "anatomy") {
      const item = sentenceById.get(card.itemId);
      if (item)
        out.push({
          key,
          kind: "anatomy",
          item,
          options: generateSentenceOptions(item, allSentences),
        });
    } else if (card.kind === "typing") {
      const item = wordById.get(card.itemId);
      if (item) out.push({ key, kind: "typing", item });
    }
  }
  return out;
}

/** Shared why-wrong builder for the two glyph→sound kinds (confusable and
 *  cross-font rows have the same c / r / note shape). */
const glyphExplainWrong =
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

function NextButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mt-3.5 w-full rounded-xl bg-ink py-3 text-sm font-bold text-paper"
    >
      Next <span className="font-normal opacity-70">(Enter)</span>
    </button>
  );
}

/** Shared 4-choice question: prompt above, options below, explanation +
 *  Next after a pick. Keyed by question so per-item state resets itself. */
function ChoiceQuestion({
  prompt,
  options,
  answerId,
  explain,
  explainWrong,
  columns = 2,
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
          <NextButton onClick={onNext} />
        </div>
      )}
    </div>
  );
}

/** Production practice for word cards: type the Korean, in-app composition. */
function TypingQuestion({
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

const KIND_LABEL: Record<Question["kind"], string> = {
  confusable: "Confusables",
  font: "Cross-font",
  gap: "Literal vs. real",
  anatomy: "Sentence anatomy",
  typing: "Typing",
};

function ReviewSession({ queue }: { queue: Question[] }) {
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);

  const q = queue[idx];

  const answer = (kind: Question["kind"], itemId: string) =>
    (ok: boolean, face?: FontFace) => {
      logDrillResult({ kind, itemId, correct: ok, face });
      if (ok) setCorrect((c) => c + 1);
    };
  const next = () => setIdx((i) => i + 1);

  if (!q) {
    const pct = queue.length ? Math.round((correct / queue.length) * 100) : 0;
    return (
      <div>
        <PageHeader eyebrow="한국어 · Review" title="Session Complete" />
        <div className="rounded-2xl border border-line bg-panel px-6 py-10 text-center">
          <div className="text-4xl font-bold">
            {correct}/{queue.length}
          </div>
          <div className="mt-1 text-sm text-muted">correct · {pct}%</div>
          <p className="mx-auto mt-3 max-w-xs text-[13px] leading-relaxed text-muted">
            Anything you missed is rescheduled to come back sooner — check in
            again later today or tomorrow.
          </p>
          <Link
            to="/review"
            className="mt-5 inline-block rounded-full bg-ink px-5 py-2 text-sm font-bold text-paper transition-opacity hover:opacity-90"
          >
            Back to Review
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/review"
        className="mb-4 inline-block text-[13px] font-semibold text-muted transition-colors hover:text-ink"
      >
        ← Review
      </Link>
      <PageHeader
        eyebrow="한국어 · Daily review"
        title="Review Queue"
        blurb="Everything due right now, all drills mixed into one pass."
      />

      <div className="mb-3 flex items-center justify-between px-1">
        <span className="text-[11px] font-semibold tracking-[0.15em] text-muted uppercase">
          {KIND_LABEL[q.kind]}
        </span>
        <span className="text-[13px] text-muted">
          <b className="text-ink">{idx + 1}</b> of {queue.length}
        </span>
      </div>

      <div className="rounded-2xl border border-line bg-panel px-5 py-6">
        {q.kind === "confusable" && (
          <ChoiceQuestion
            key={q.key}
            prompt={
              <>
                <GlyphCard glyph={q.item.c} />
                <div className="mb-3 text-center text-[13px] text-muted">
                  Which sound is this? <span className="text-xs">(keys 1–4)</span>
                </div>
              </>
            }
            options={q.options.map((o) => ({ id: o.id, label: o.r }))}
            answerId={q.item.id}
            explain={
              <>
                {q.item.c} is <b className="text-ink">{q.item.r}</b> —{" "}
                {q.item.note}
              </>
            }
            explainWrong={glyphExplainWrong(q.options, q.item)}
            onAnswer={answer(q.kind, q.item.id)}
            onNext={next}
          />
        )}

        {q.kind === "font" && (
          <ChoiceQuestion
            key={q.key}
            prompt={
              <>
                <GlyphCard glyph={q.item.c} faceClass={FACE_FONT[q.face]} />
                <div className="mb-3 text-center text-[13px] text-muted">
                  Which sound is this, in {FACE_LABEL[q.face]}?{" "}
                  <span className="text-xs">(keys 1–4)</span>
                </div>
              </>
            }
            options={q.options.map((o) => ({ id: o.id, label: o.r }))}
            answerId={q.item.id}
            explain={
              <>
                {q.item.c} is <b className="text-ink">{q.item.r}</b> —{" "}
                {q.item.note}
              </>
            }
            explainWrong={glyphExplainWrong(q.options, q.item)}
            onAnswer={(ok) => answer("font", q.item.id)(ok, q.face)}
            onNext={next}
          />
        )}

        {q.kind === "gap" && (
          <ChoiceQuestion
            key={q.key}
            columns={1}
            prompt={
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 font-korean text-[28px] font-semibold">
                  {q.item.ko}
                  <AudioButton text={q.item.ko} />
                </div>
                <Rom text={q.item.rom} className="mt-0.5 block" />
                <div className="mt-3 text-sm text-muted">
                  literally: <i>“{q.item.lit}”</i>
                </div>
                <div className="mt-2.5 mb-3.5 text-[12.5px] text-muted">
                  …but what does it really mean?{" "}
                  <span className="text-[11px]">(keys 1–4)</span>
                </div>
              </div>
            }
            options={q.options.map((o) => ({ id: o.id, label: o.real }))}
            answerId={q.item.id}
            explain={q.item.note}
            explainWrong={(pickedId) => {
              const p = q.options.find((o) => o.id === pickedId);
              return p ? (
                <WhyWrong
                  picked={{
                    title: (
                      <>
                        “{p.real}” is{" "}
                        <span className="font-korean">{p.ko}</span>
                      </>
                    ),
                    body: <>literally “{p.lit}”</>,
                  }}
                  answer={{
                    title: (
                      <>
                        <span className="font-korean">{q.item.ko}</span> means
                        “{q.item.real}”
                      </>
                    ),
                    body: q.item.note,
                  }}
                />
              ) : null;
            }}
            onAnswer={answer(q.kind, q.item.id)}
            onNext={next}
          />
        )}

        {q.kind === "anatomy" && (
          <ChoiceQuestion
            key={q.key}
            columns={1}
            prompt={
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 font-korean text-[26px] font-semibold">
                  {q.item.ko.map((c) => c.t).filter(Boolean).join(" ")}
                  <AudioButton
                    text={q.item.ko.map((c) => c.t).filter(Boolean).join(" ")}
                  />
                </div>
                {q.item.rom && <Rom text={q.item.rom} className="mt-0.5 block" />}
                <div className="mt-2.5 mb-3.5 text-[12.5px] text-muted">
                  What does it mean?{" "}
                  <span className="text-[11px]">(keys 1–4)</span>
                </div>
              </div>
            }
            options={q.options.map((o) => ({
              id: o.id,
              label: sentenceEnglish(o),
            }))}
            answerId={q.item.id}
            explain={q.item.note}
            explainWrong={(pickedId) => {
              const p = q.options.find((o) => o.id === pickedId);
              const ko = (s: Sentence) =>
                s.ko.map((c) => c.t).filter(Boolean).join(" ");
              return p ? (
                <WhyWrong
                  picked={{
                    title: <>“{sentenceEnglish(p)}” is a different sentence</>,
                    body: (
                      <>
                        that one is{" "}
                        <span className="font-korean text-ink">{ko(p)}</span>
                      </>
                    ),
                  }}
                  answer={{
                    title: (
                      <>
                        <span className="font-korean">{ko(q.item)}</span> = “
                        {sentenceEnglish(q.item)}”
                      </>
                    ),
                    body: q.item.note,
                  }}
                />
              ) : null;
            }}
            onAnswer={answer(q.kind, q.item.id)}
            onNext={next}
          />
        )}

        {q.kind === "typing" && (
          <TypingQuestion
            key={q.key}
            word={q.item}
            onAnswer={answer(q.kind, q.item.id)}
            onNext={next}
          />
        )}
      </div>
    </div>
  );
}

export default function ReviewSessionRoute() {
  const cards = useLiveQuery(() => db.srsCards.toArray(), []);
  const gapPool = useGapPool();
  // Freeze the queue on first load — answering must not reshuffle it.
  const [queue, setQueue] = useState<Question[] | null>(null);
  useEffect(() => {
    if (queue === null && cards && gapPool)
      setQueue(buildQueue(cards, gapPool));
  }, [queue, cards, gapPool]);

  if (!queue) return null;
  if (queue.length === 0)
    return (
      <div>
        <PageHeader eyebrow="한국어 · Review" title="Review Queue" />
        <div className="rounded-2xl border border-dashed border-line bg-panel px-6 py-10 text-center">
          <div className="font-korean text-3xl">✨</div>
          <div className="mt-3 text-sm font-semibold">Nothing due right now</div>
          <p className="mx-auto mt-1.5 max-w-xs text-[13px] leading-relaxed text-muted">
            Drill anything and it enters the schedule — items come due here as
            their intervals run out.
          </p>
          <Link
            to="/review"
            className="mt-4 inline-block text-[13px] font-semibold text-teal underline underline-offset-2"
          >
            ← Back to Review
          </Link>
        </div>
      </div>
    );
  return <ReviewSession queue={queue} />;
}
