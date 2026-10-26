import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { logDrillResult } from "../../db/repo";
import { dueNow } from "../../lib/srs";
import {
  generateConfusableOptions,
  generateGapOptions,
  generateSentenceOptions,
  generateWordOptions,
  sentenceEnglish,
} from "../../lib/distractors";
import { shuffle } from "../../lib/rng";
import {
  allSentences,
  allWords,
  confusables,
  confusableById,
  fontFaces,
  fontLetterById,
  sentenceById,
  wordById,
} from "../../content";
import type {
  ConfusableItem,
  DrillKind,
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
import GlyphCard from "../drills/engine/GlyphCard";
import WhyWrong from "../drills/engine/WhyWrong";
import {
  ChoiceQuestion,
  TypingQuestion,
  WordMeaningQuestion,
  glyphExplainWrong,
} from "../drills/engine/questions";
import { FACE_FONT, FACE_LABEL, randomAltFace } from "../drills/engine/faceFont";
import RoleLabelQuestion from "../drills/anatomy/RoleLabelQuestion";
import { labelable } from "../../lib/roleLabel";
import { useGapPool, type GapPool } from "../drills/gap/useGapPool";

// Phase A.2 — the daily queue as ONE session mixing every drill kind,
// oldest due first. Each answer goes through logDrillResult, so the FSRS
// card moves the moment you answer; wrong answers come back within minutes
// on the next visit.

export type Question =
  | { key: string; kind: "confusable"; item: ConfusableItem; options: ConfusableItem[] }
  | { key: string; kind: "font"; item: FontLetterRow; options: FontLetterRow[]; face: FontFace }
  | { key: string; kind: "gap"; item: GapItem; options: GapItem[] }
  | { key: string; kind: "anatomy"; item: Sentence; options: Sentence[] }
  | { key: string; kind: "typing"; item: Word }
  | { key: string; kind: "word"; item: Word; options: Word[] }
  | { key: string; kind: "role"; item: Sentence };

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

/** Resolve one card into a renderable question. Null when its item no longer
 *  exists (e.g. a deleted discovery) or can't be asked as that kind. Shared
 *  with the module-test practice session (2026-10-25). */
export function buildQuestion(
  kind: DrillKind,
  itemId: string,
  gapPool: GapPool,
): Question | null {
  const key = `${kind}:${itemId}`;
  if (kind === "confusable") {
    const item = confusableById.get(itemId);
    return item
      ? {
          key,
          kind,
          item,
          options: generateConfusableOptions(item, confusables),
        }
      : null;
  }
  if (kind === "font") {
    const item = fontLetterById.get(itemId);
    return item
      ? {
          key,
          kind,
          item,
          options: fontLetterOptions(item),
          face: randomAltFace(),
        }
      : null;
  }
  if (kind === "gap") {
    const item = gapPool.byId.get(itemId);
    return item
      ? { key, kind, item, options: generateGapOptions(item, gapPool.items) }
      : null;
  }
  if (kind === "anatomy") {
    const item = sentenceById.get(itemId);
    return item
      ? {
          key,
          kind,
          item,
          options: generateSentenceOptions(item, allSentences),
        }
      : null;
  }
  if (kind === "typing") {
    const item = wordById.get(itemId);
    return item ? { key, kind, item } : null;
  }
  if (kind === "word") {
    const item = wordById.get(itemId);
    return item
      ? { key, kind, item, options: generateWordOptions(item, allWords) }
      : null;
  }
  const item = sentenceById.get(itemId);
  return item && labelable(item) ? { key, kind: "role", item } : null;
}

/** Everything due now, oldest first. */
function buildQueue(cards: SrsCard[], gapPool: GapPool): Question[] {
  return dueNow(cards)
    .map((card) => buildQuestion(card.kind, card.itemId, gapPool))
    .filter((q): q is Question => q !== null);
}

const KIND_LABEL: Record<Question["kind"], string> = {
  confusable: "Confusables",
  font: "Cross-font",
  gap: "Literal vs. real",
  anatomy: "Sentence anatomy",
  typing: "Typing",
  word: "Vocabulary",
  role: "Sentence roles",
};

/** Everything around the questions. Defaulted to the daily queue's wording;
 *  the module-test practice session passes its own (2026-10-25). */
export interface SessionChrome {
  eyebrow: string;
  title: string;
  blurb: string;
  backTo: string;
  backLabel: string;
  doneEyebrow: string;
  doneTitle: string;
  doneNote: string;
}

const REVIEW_CHROME: SessionChrome = {
  eyebrow: "한국어 · Daily review",
  title: "Review Queue",
  blurb: "Everything due right now, all drills mixed into one pass.",
  backTo: "/review",
  backLabel: "Review",
  doneEyebrow: "한국어 · Review",
  doneTitle: "Session Complete",
  doneNote:
    "Anything you missed is rescheduled to come back sooner — check in again later today or tomorrow.",
};

export function ReviewSession({
  queue,
  chrome = REVIEW_CHROME,
}: {
  queue: Question[];
  chrome?: SessionChrome;
}) {
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
        <PageHeader eyebrow={chrome.doneEyebrow} title={chrome.doneTitle} />
        <div className="rounded-panel bg-card shadow-panel px-6 py-10 text-center">
          <div className="text-4xl font-bold">
            {correct}/{queue.length}
          </div>
          <div className="mt-1 text-sm text-muted">correct · {pct}%</div>
          <p className="mx-auto mt-3 max-w-xs text-[13px] leading-relaxed text-muted">
            {chrome.doneNote}
          </p>
          <Link
            to={chrome.backTo}
            className="mt-5 inline-block rounded-full bg-teal px-5 py-2 text-sm font-bold text-on-accent transition-opacity hover:opacity-90"
          >
            Back to {chrome.backLabel}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        to={chrome.backTo}
        className="mb-4 inline-block text-[13px] font-semibold text-muted transition-colors hover:text-ink"
      >
        ← {chrome.backLabel}
      </Link>
      <PageHeader
        eyebrow={chrome.eyebrow}
        title={chrome.title}
        blurb={chrome.blurb}
      />

      <div className="mb-3 flex items-center justify-between px-1">
        <span className="text-[11px] font-semibold tracking-[0.15em] text-muted uppercase">
          {KIND_LABEL[q.kind]}
        </span>
        <span className="text-[13px] text-muted">
          <b className="text-ink">{idx + 1}</b> of {queue.length}
        </span>
      </div>

      <div className="rounded-panel bg-card shadow-panel px-5 py-6">
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
            // Same question as the module test's sentence MCQ, so the same
            // layout rule: two columns when the four readings are short.
            columns="auto"
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

        {q.kind === "word" && (
          <WordMeaningQuestion
            key={q.key}
            word={q.item}
            options={q.options}
            onAnswer={answer(q.kind, q.item.id)}
            onNext={next}
          />
        )}

        {q.kind === "role" && (
          <RoleLabelQuestion
            key={q.key}
            sentence={q.item}
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
        <div className="rounded-panel bg-card shadow-panel px-6 py-10 text-center">
          <div className="font-korean text-3xl">✓</div>
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
