import { useMemo, useState } from "react";
import { gapCats } from "../../../content";
import type { GapItem } from "../../../types";
import { generateGapOptions } from "../../../lib/distractors";
import { DISCOVERED_PREFIX } from "../../../lib/discovered";
import { useDrillEngine } from "../engine/useDrillEngine";
import { useDrillKeys } from "../engine/useDrillKeys";
import DrillScaffold from "../engine/DrillScaffold";
import QuizOptions from "../engine/QuizOptions";
import { FACE_FONT, randomFace } from "../engine/faceFont";
import Chip from "../../../components/Chip";
import ModeToggle from "../../../components/ModeToggle";
import AudioButton from "../../../components/AudioButton";
import Rom from "../../../components/Rom";
import { useReviewFilter } from "../../review/useReviewFilter";
import ReviewBanner from "../../review/ReviewBanner";
import ReviewEmpty from "../../review/ReviewEmpty";
import { useGapPool } from "./useGapPool";

const CATS: { key: (typeof gapCats)[number]; label: string; color: string; border: string }[] = [
  { key: "structure", label: "Grammar mismatches", color: "text-teal", border: "border-l-teal" },
  { key: "phrase", label: "Literal vs. actual", color: "text-clay", border: "border-l-clay" },
  { key: "concept", label: "Untranslatables", color: "text-gold", border: "border-l-gold" },
];

type Mode = "browse" | "quiz";

function BrowseCard({ item }: { item: GapItem }) {
  const [open, setOpen] = useState(false);
  const cat = CATS.find((c) => c.key === item.cat)!;
  return (
    <button
      onClick={() => setOpen(!open)}
      className={`w-full rounded-xl border border-line border-l-[3px] bg-panel px-4 py-3.5 text-left transition-colors ${cat.border}`}
    >
      <div className="flex items-baseline justify-between gap-2.5">
        <span className="flex items-center gap-1 font-korean text-[20px] font-semibold">
          {item.ko}
          <AudioButton text={item.ko} />
        </span>
        <Rom text={item.rom} className="shrink-0" />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px]">
        <span
          className={`text-muted ${open ? "line-through decoration-clay" : ""}`}
        >
          “{item.lit}”
        </span>
        <span className="text-muted">→</span>
        <span className={`font-bold ${cat.color}`}>{item.real}</span>
      </div>
      {open && (
        <div className="mt-2.5 border-t border-line pt-2.5 text-[13.5px] leading-relaxed text-muted">
          {item.note}
        </div>
      )}
    </button>
  );
}

function GapDrill({
  reviewIds,
  allItems,
}: {
  reviewIds?: Set<string>;
  allItems: GapItem[];
}) {
  const [mode, setMode] = useState<Mode>(reviewIds ? "quiz" : "browse");
  const [cat, setCat] = useState<(typeof gapCats)[number]>("structure");
  const [mixFonts, setMixFonts] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);

  const pool = useMemo(
    () =>
      reviewIds ? allItems.filter((g) => reviewIds.has(g.id)) : allItems,
    [reviewIds, allItems],
  );
  const engine = useDrillEngine<GapItem>({ kind: "gap", pool });
  const q = engine.current;

  const options = useMemo(
    () => (q ? generateGapOptions(q, allItems) : []),
    [q, allItems],
  );

  const face = useMemo(
    () => (mixFonts ? randomFace() : "gothic"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mixFonts, q?.id, engine.index],
  );

  // reset per-item pick state as the engine advances
  const [lastItem, setLastItem] = useState(q?.id ?? "");
  if ((q?.id ?? "") !== lastItem) {
    setLastItem(q?.id ?? "");
    setPicked(null);
  }

  const pick = (id: string) => {
    if (picked || !q) return;
    setPicked(id);
    engine.answer(id === q.id, {
      advanceAfterMs: null, // wait for Next
      face: face === "gothic" ? undefined : face,
    });
  };

  useDrillKeys({
    enabled: mode === "quiz",
    onNumber: !picked
      ? (n) => {
          const o = options[n - 1];
          if (o) pick(o.id);
        }
      : undefined,
    onEnter: engine.answered ? engine.advance : undefined,
  });

  const browseList = useMemo(
    () => allItems.filter((g) => g.cat === cat),
    [allItems, cat],
  );

  if (reviewIds && pool.length === 0) return <ReviewEmpty />;

  return (
    <DrillScaffold
      eyebrow="한국어 · Lost in translation"
      title="What It Says vs. What It Means"
      blurb="Expressions where word-for-word translation misleads you — the gap between the literal and the real meaning is the lesson."
      seen={engine.seen}
      correct={engine.correct}
      pct={engine.pct}
      onReset={() => {
        setPicked(null);
        engine.reset();
      }}
      missed={engine.missed.map((m) => ({ id: m.id, big: m.ko, small: m.real }))}
      controls={
        <div className="mb-4">
          {reviewIds && <ReviewBanner count={pool.length} />}
          {!reviewIds && (
            <div className="flex flex-wrap items-center gap-2">
              <ModeToggle
                modes={[
                  { value: "browse", label: "Browse" },
                  { value: "quiz", label: "Guess the meaning" },
                ]}
                value={mode}
                onChange={setMode}
              />
              {mode === "quiz" && (
                <Chip active={mixFonts} onClick={() => setMixFonts(!mixFonts)}>
                  Mixed fonts
                </Chip>
              )}
            </div>
          )}
          {mode === "browse" && (
            <div className="mt-3 flex flex-wrap gap-2">
              {CATS.map((c) => (
                <Chip
                  key={c.key}
                  active={cat === c.key}
                  onClick={() => setCat(c.key)}
                >
                  {c.label}
                </Chip>
              ))}
            </div>
          )}
        </div>
      }
    >
      {mode === "browse" ? (
        <div className="-m-2 flex flex-col gap-2.5 p-2">
          {browseList.map((item) => (
            <BrowseCard key={item.id} item={item} />
          ))}
          {cat === "phrase" &&
            browseList.some((i) => i.id.startsWith(DISCOVERED_PREFIX)) && (
              <p className="mt-1 text-center text-[11.5px] text-muted">
                Includes discoveries saved from the translator.
              </p>
            )}
          <p className="mt-1 text-center text-[11.5px] text-muted">
            Tap a card for the story behind it.
          </p>
        </div>
      ) : (
        q && (
          <div>
            <div className="text-center">
              <div
                className={`flex items-center justify-center gap-1 text-[28px] font-semibold ${FACE_FONT[face]}`}
              >
                {q.ko}
                <AudioButton text={q.ko} />
              </div>
              <Rom text={q.rom} className="mt-0.5 block" />
              <div className="mt-3 text-sm text-muted">
                literally: <i>“{q.lit}”</i>
              </div>
              <div className="mt-2.5 mb-3.5 text-[12.5px] text-muted">
                …but what does it really mean?{" "}
                <span className="text-[11px]">(keys 1–4)</span>
              </div>
            </div>
            <QuizOptions
              columns={1}
              options={options.map((o) => ({ id: o.id, label: o.real }))}
              pickedId={picked}
              answerId={q.id}
              onPick={pick}
            />
            {picked && (
              <div className="mt-3.5 border-t border-line pt-3">
                <p className="text-[13.5px] leading-relaxed text-muted">
                  {q.note}
                </p>
                <button
                  onClick={engine.advance}
                  className="mt-3.5 w-full rounded-xl bg-ink py-3 text-sm font-bold text-paper"
                >
                  Next <span className="font-normal opacity-70">(Enter)</span>
                </button>
              </div>
            )}
          </div>
        )
      )}
    </DrillScaffold>
  );
}

export default function GapDrillRoute() {
  const { active, ids } = useReviewFilter("gap");
  const gapPool = useGapPool();
  if ((active && !ids) || !gapPool) return null;
  return (
    <GapDrill
      key={active ? "review" : "normal"}
      reviewIds={active ? ids : undefined}
      allItems={gapPool.items}
    />
  );
}
