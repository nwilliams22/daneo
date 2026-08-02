import { useRef, useState } from "react";
import { content, moduleById } from "../../content";
import {
  buildPlacementQuiz,
  nextStage,
  placementOutcome,
  PLACEMENT_COUNT,
  type PlacementOutcome,
  type PlacementQuestion,
  type PlacementStage,
} from "../../lib/placement";
import { sentenceEnglish } from "../../lib/distractors";
import GlyphCard from "../drills/engine/GlyphCard";
import QuizOptions from "../drills/engine/QuizOptions";
import { useDrillKeys } from "../drills/engine/useDrillKeys";

// Renders the adaptive placement (src/lib/placement.ts). Answers are NOT
// logged as drill results — this is assessment, not practice; nothing here
// should seed the review schedule.

const STAGE_LABEL: Record<PlacementStage, string> = {
  hangul: "Reading Hangul",
  vocab: "Module 1 words",
  glue: "Module 1 sentences",
};

const STAGE_PROMPT: Record<PlacementStage, string> = {
  hangul: "Which sound is this?",
  vocab: "What does it mean?",
  glue: "What does it mean?",
};

function answerId(q: PlacementQuestion): string {
  if (q.stage === "hangul") return q.item.id;
  if (q.stage === "vocab") return q.word.id;
  return q.sentence.id;
}

function optionViews(q: PlacementQuestion) {
  if (q.stage === "hangul")
    return q.options.map((o) => ({ id: o.id, label: o.r }));
  if (q.stage === "vocab")
    return q.options.map((o) => ({ id: o.id, label: o.en }));
  return q.options.map((o) => ({ id: o.id, label: sentenceEnglish(o) }));
}

export default function PlacementQuiz({
  onDone,
  onCancel,
}: {
  onDone: (outcome: PlacementOutcome) => void;
  onCancel: () => void;
}) {
  const m1 = moduleById.get("m1")!;
  const [quiz] = useState(() =>
    buildPlacementQuiz({
      confusables: content.confusables,
      words: content.words.filter((w) => m1.wordIds.includes(w.id)),
      sentences: content.sentences.filter((s) => m1.sentenceIds.includes(s.id)),
    }),
  );

  const [stage, setStage] = useState<PlacementStage>("hangul");
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const scores = useRef<{ hangul: number; vocab?: number; glue?: number }>({
    hangul: 0,
  });
  const timer = useRef<number | null>(null);

  const questions = quiz[stage];
  const q = questions[index]!;
  const seen =
    (stage === "hangul" ? 0 : PLACEMENT_COUNT.hangul) +
    (stage === "glue" ? PLACEMENT_COUNT.vocab : 0) +
    index;
  const total =
    PLACEMENT_COUNT.hangul + PLACEMENT_COUNT.vocab + PLACEMENT_COUNT.glue;

  const finish = () => {
    onDone(placementOutcome(scores.current, m1.wordIds));
  };

  const advance = () => {
    timer.current = null;
    setPicked(null);
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      return;
    }
    const score = scores.current[stage] ?? 0;
    const next = nextStage(stage, score);
    if (next === null) {
      finish();
    } else {
      scores.current[next] = 0;
      setStage(next);
      setIndex(0);
    }
  };

  const pick = (id: string) => {
    if (picked) return;
    setPicked(id);
    if (id === answerId(q))
      scores.current[stage] = (scores.current[stage] ?? 0) + 1;
    timer.current = window.setTimeout(advance, 650);
  };

  useDrillKeys({
    onNumber: !picked
      ? (n) => {
          const o = optionViews(q)[n - 1];
          if (o) pick(o.id);
        }
      : undefined,
  });

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="text-[11px] font-semibold tracking-[0.15em] text-muted uppercase">
          {STAGE_LABEL[stage]}
        </span>
        <span className="text-[13px] text-muted">
          <b className="text-ink">{seen + 1}</b> / {total}
        </span>
      </div>

      <div className="rounded-2xl border border-line bg-panel px-5 py-6">
        {q.stage === "hangul" && <GlyphCard glyph={q.item.c} />}

        {q.stage === "vocab" && (
          <div className="mb-5 text-center font-korean text-5xl font-semibold">
            {q.word.ko}
          </div>
        )}

        {q.stage === "glue" && (
          <div className="mb-5 text-center font-korean text-[24px] leading-relaxed font-semibold">
            {q.sentence.ko.map((c) => c.t).filter(Boolean).join(" ")}
          </div>
        )}

        <div className="mb-3 text-center text-[13px] text-muted">
          {STAGE_PROMPT[q.stage]} <span className="text-xs">(keys 1–4)</span>
        </div>

        <QuizOptions
          columns={q.stage === "hangul" ? 2 : 1}
          options={optionViews(q)}
          pickedId={picked}
          answerId={answerId(q)}
          onPick={pick}
        />
      </div>

      <button
        onClick={onCancel}
        className="mt-4 w-full text-center text-[12px] text-muted underline underline-offset-2 transition-colors hover:text-ink"
      >
        Never mind — back to the start options
      </button>
    </div>
  );
}
