import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import {
  allSentences,
  allWords,
  moduleById,
  sentenceById,
  wordById,
} from "../../content";
import { logDrillResult, recordModuleTest } from "../../db/repo";
import {
  buildModuleTest,
  drillKindFor,
  PASS_PCT,
  scorePct,
  type TestQuestion,
} from "../../lib/moduleTest";
import { sentenceEnglish } from "../../lib/distractors";
import type { Module, Sentence } from "../../types";
import PageHeader from "../../components/PageHeader";
import AudioButton from "../../components/AudioButton";
import Rom from "../../components/Rom";
import WhyWrong from "../drills/engine/WhyWrong";
import {
  ChoiceQuestion,
  TypingQuestion,
  WordMeaningQuestion,
} from "../drills/engine/questions";
import RoleLabelQuestion from "../drills/anatomy/RoleLabelQuestion";

// Module-end test (Nick, 2026-08-10): one pass over a sample of the module's
// vocab and sentences. Answers grade through logDrillResult, so a test is
// also scheduled practice — misses return in the daily review queue.

const KIND_LABEL: Record<TestQuestion["kind"], string> = {
  wordMeaning: "Vocabulary",
  wordPick: "Vocabulary",
  sentence: "Sentences",
  typing: "Typing",
  role: "Sentence roles",
};

function sentenceKo(s: Sentence): string {
  return s.ko.map((c) => c.t).filter(Boolean).join(" ");
}

function TestRun({ module }: { module: Module }) {
  const [attempt, setAttempt] = useState(0);
  const questions = useMemo(
    () => buildModuleTest(module, wordById, sentenceById, allWords, allSentences),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- attempt re-rolls the sample
    [module, attempt],
  );
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [recordedPct, setRecordedPct] = useState<number | null>(null);

  const q = questions[idx];
  const last = idx === questions.length - 1;

  const answer = (ok: boolean) => {
    if (!q) return;
    logDrillResult({ kind: drillKindFor(q), itemId: q.item.id, correct: ok });
    const total = correct + (ok ? 1 : 0);
    setCorrect(total);
    // The final answer settles the score — record it here, from the user
    // event (never a render effect), before the results screen shows.
    if (last && recordedPct === null) {
      const pct = scorePct(total, questions.length);
      setRecordedPct(pct);
      recordModuleTest(module.id, pct);
    }
  };
  const next = () => setIdx((i) => i + 1);
  const retake = () => {
    setAttempt((a) => a + 1);
    setIdx(0);
    setCorrect(0);
    setRecordedPct(null);
  };

  if (questions.length === 0) return <Navigate to="/learn" replace />;

  if (!q) {
    const pct = recordedPct ?? scorePct(correct, questions.length);
    const passed = pct >= PASS_PCT;
    return (
      <div>
        <PageHeader eyebrow={`한국어 · ${module.title}`} title="Test Complete" />
        <div className="rounded-2xl border border-line bg-panel px-6 py-10 text-center">
          <div
            className={`text-5xl font-bold ${passed ? "text-teal" : "text-clay"}`}
          >
            {pct}%
          </div>
          <div className="mt-1 text-sm text-muted">
            {correct}/{questions.length} correct ·{" "}
            {passed ? "passed" : `${PASS_PCT}% to pass`}
          </div>
          <p className="mx-auto mt-3 max-w-xs text-[13px] leading-relaxed text-muted">
            {passed
              ? "This module's blocks are holding. Anything you still missed is rescheduled into the review queue."
              : "Not yet — everything you missed is queued for review. Revisit the module, clear the queue, and take it again."}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              onClick={retake}
              className="rounded-full border border-line px-5 py-2 text-sm font-bold transition-colors hover:border-teal"
            >
              Retake (new questions)
            </button>
            <Link
              to={`/learn/${module.id}`}
              className="rounded-full bg-ink px-5 py-2 text-sm font-bold text-paper transition-opacity hover:opacity-90"
            >
              Back to module
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        to={`/learn/${module.id}`}
        className="mb-4 inline-block text-[13px] font-semibold text-muted transition-colors hover:text-ink"
      >
        ← {module.title}
      </Link>
      <PageHeader
        eyebrow={`한국어 · ${module.title}`}
        title="Module Test"
        blurb="A fresh sample of this module's words and sentences — wrong answers feed the review queue."
      />

      <div className="mb-3 flex items-center justify-between px-1">
        <span className="text-[11px] font-semibold tracking-[0.15em] text-muted uppercase">
          {KIND_LABEL[q.kind]}
        </span>
        <span className="text-[13px] text-muted">
          <b className="text-ink">{idx + 1}</b> of {questions.length}
        </span>
      </div>

      <div className="rounded-2xl border border-line bg-panel px-5 py-6">
        {q.kind === "wordMeaning" && (
          <WordMeaningQuestion
            key={q.key}
            word={q.item}
            options={q.options}
            nextLabel={last ? "See results" : undefined}
            onAnswer={answer}
            onNext={next}
          />
        )}

        {q.kind === "wordPick" && (
          <ChoiceQuestion
            key={q.key}
            prompt={
              <div className="text-center">
                <div className="text-[11px] tracking-[0.2em] text-muted uppercase">
                  Pick the Korean
                </div>
                <div className="mt-1 mb-3.5 text-xl font-bold">{q.item.en}</div>
              </div>
            }
            options={q.options.map((o) => ({
              id: o.id,
              label: o.ko,
              korean: true,
            }))}
            answerId={q.item.id}
            explain={
              <>
                “{q.item.en}” is{" "}
                <b className="font-korean text-ink">{q.item.ko}</b> (
                <Rom text={q.item.rom} />)
                {q.item.notes ? <> — {q.item.notes}</> : null}
              </>
            }
            explainWrong={(pickedId) => {
              const p = q.options.find((o) => o.id === pickedId);
              return p ? (
                <WhyWrong
                  picked={{
                    title: (
                      <>
                        <span className="font-korean">{p.ko}</span> is “{p.en}”
                      </>
                    ),
                    body: p.notes ?? <Rom text={p.rom} />,
                  }}
                  answer={{
                    title: (
                      <>
                        “{q.item.en}” is{" "}
                        <span className="font-korean">{q.item.ko}</span>
                      </>
                    ),
                    body: q.item.notes ?? <Rom text={q.item.rom} />,
                  }}
                />
              ) : null;
            }}
            nextLabel={last ? "See results" : undefined}
            onAnswer={answer}
            onNext={next}
          />
        )}

        {q.kind === "sentence" && (
          <ChoiceQuestion
            key={q.key}
            columns={1}
            prompt={
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 font-korean text-[26px] font-semibold">
                  {sentenceKo(q.item)}
                  <AudioButton text={sentenceKo(q.item)} />
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
              return p ? (
                <WhyWrong
                  picked={{
                    title: <>“{sentenceEnglish(p)}” is a different sentence</>,
                    body: (
                      <>
                        that one is{" "}
                        <span className="font-korean text-ink">
                          {sentenceKo(p)}
                        </span>
                      </>
                    ),
                  }}
                  answer={{
                    title: (
                      <>
                        <span className="font-korean">{sentenceKo(q.item)}</span>{" "}
                        = “{sentenceEnglish(q.item)}”
                      </>
                    ),
                    body: q.item.note,
                  }}
                />
              ) : null;
            }}
            nextLabel={last ? "See results" : undefined}
            onAnswer={answer}
            onNext={next}
          />
        )}

        {q.kind === "typing" && (
          <TypingQuestion
            key={q.key}
            word={q.item}
            onAnswer={answer}
            onNext={next}
          />
        )}

        {q.kind === "role" && (
          <RoleLabelQuestion
            key={q.key}
            sentence={q.item}
            nextLabel={last ? "See results" : undefined}
            onAnswer={answer}
            onNext={next}
          />
        )}
      </div>
    </div>
  );
}

export default function ModuleTestRoute() {
  const { moduleId } = useParams();
  const module = moduleId ? moduleById.get(moduleId) : undefined;
  if (!module || module.wordIds.length === 0)
    return <Navigate to="/learn" replace />;
  return <TestRun module={module} />;
}
