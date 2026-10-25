import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import PageHeader from "../../components/PageHeader";
import { modulesOrdered, wordById } from "../../content";
import { db } from "../../db/db";
import { useKnownWords } from "../../db/useKnownWords";
import { moduleProgress, isModuleComplete } from "../../lib/gating";
import { moduleLabels } from "../../lib/moduleLabel";
import { PASS_PCT } from "../../lib/moduleTest";
import { moduleToContinue } from "../../lib/today";
import type { Module, ModuleTestResult } from "../../types";

// Nick, BAD-281: "the most cumbersome thing is how much you have to scroll on
// the modules page." This page used to render all 164 modules as tall cards in
// one flat column — about 17,500px of scroll. It is now one line per module,
// with three things doing the shortening:
//
//   1. a ring picker, so only one ring is on screen at a time;
//   2. everything behind where you are folds into a single row, and everything
//      well ahead of you folds into another;
//   3. a search box that reaches any module, reading or word by name, which is
//      what scrolling the long list was really being used for.
//
// Nothing is hidden: every fold opens, and the footer says so.

const LABELS = moduleLabels(modulesOrdered);
const RINGS = [...new Set(modulesOrdered.map((m) => m.ring ?? 1))].sort();

const RING_META: Record<number, { label: string; blurb: string }> = {
  1: {
    label: "Ring 1 · Beginner",
    blurb: "The full grammar engine and your first ~1,000 words.",
  },
  2: {
    label: "Ring 2 · Intermediate",
    blurb:
      "Quoting, passives, and the NIKL grade-B vocabulary — ~1,700 words deeper.",
  },
  3: {
    label: "Ring 3 · Advanced",
    blurb: "The rest of the list — full learner-list coverage.",
  },
};

/** How many modules stay open ahead of where the learner is. Enough to see
 *  what is coming, few enough that the page is a couple of screens. */
const WINDOW = 8;

const ringOf = (m: Module) => m.ring ?? 1;

/** The short badge at the head of a row: the course number for a module, 읽기
 *  for a reading, the code for an appendix. */
function badgeFor(m: Module): string {
  const label = LABELS[m.id];
  if (label.startsWith("Module ")) return label.slice(7);
  if (label.startsWith("Appendix ")) return label.slice(9);
  return "읽기";
}

/** What a search should reach a module through — looking for "water" should
 *  find the module that teaches 물. */
const searchIndex = new Map<string, string>(
  modulesOrdered.map((m) => [
    m.id,
    [
      LABELS[m.id],
      m.title,
      ...m.wordIds.flatMap((id) => {
        const w = wordById.get(id);
        return w ? [w.ko, w.rom, w.en] : [];
      }),
    ]
      .join(" ")
      .toLowerCase(),
  ]),
);

function Meter({ pct }: { pct: number }) {
  return (
    <span className="inline-block h-1.5 w-20 overflow-hidden rounded-full bg-line align-middle">
      <span
        className="block h-full rounded-full bg-meter"
        style={{ width: `${Math.round(pct)}%` }}
      />
    </span>
  );
}

function ModuleRow({
  module,
  known,
  test,
  current,
}: {
  module: Module;
  known: Set<string>;
  test?: ModuleTestResult;
  current: boolean;
}) {
  const isReading = module.wordIds.length === 0;
  const progress = moduleProgress(module, known);
  const complete = isModuleComplete(module, known);
  const toPractice = test?.misses?.length ?? 0;
  const passed = (test?.bestPct ?? 0) >= PASS_PCT;

  return (
    <Link
      to={`/learn/${module.id}`}
      className={`flex items-center gap-3 border-b border-b-line border-l-2 py-2.5 pr-1 pl-3.5 transition-colors last:border-b-0 hover:bg-fill ${
        current ? "border-l-teal" : "border-l-transparent"
      }`}
    >
      <span
        className={`w-9 shrink-0 text-center text-[13px] font-bold text-muted ${
          isReading ? "font-korean text-[12px]" : ""
        }`}
      >
        {badgeFor(module)}
      </span>
      <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">
        {module.title}
      </span>
      {!isReading && (
        <>
          <Meter
            pct={progress.total ? (progress.done / progress.total) * 100 : 0}
          />
          <span className="w-14 shrink-0 text-right text-xs tabular-nums text-muted">
            {progress.done}/{progress.total}
          </span>
        </>
      )}
      <span className="flex w-28 shrink-0 justify-end text-[11px] font-bold">
        {isReading ? (
          <span className="text-faint">read</span>
        ) : toPractice > 0 ? (
          <span
            className="rounded-full bg-warn-wash px-2 py-0.5 text-clay"
            title="Missed on your last module test"
          >
            {toPractice} to practice
          </span>
        ) : complete && !passed ? (
          <span className="rounded-full bg-warn-wash px-2 py-0.5 text-clay">
            test due
          </span>
        ) : passed ? (
          <span className="text-jade">✓ {test?.bestPct}%</span>
        ) : null}
      </span>
    </Link>
  );
}

function Fold({
  open,
  onToggle,
  title,
  right,
}: {
  open: boolean;
  onToggle: () => void;
  title: string;
  right: string;
}) {
  return (
    <button
      onClick={onToggle}
      aria-expanded={open}
      className="flex w-full items-center gap-2.5 border-t border-line py-3 pl-3.5 text-left text-[13px] text-muted transition-colors hover:text-ink"
    >
      <span
        className={`text-[10px] transition-transform ${open ? "rotate-90" : ""}`}
      >
        ▶
      </span>
      <span className="flex-1 font-semibold">{title}</span>
      <span className="text-xs">{right}</span>
    </button>
  );
}

export default function LearnPage() {
  const known = useKnownWords();
  const tests = useLiveQuery(async () => {
    const rows = await db.moduleTests.toArray();
    return new Map(rows.map((r) => [r.moduleId, r]));
  }, []);

  const current = useMemo(
    () => (known ? moduleToContinue(modulesOrdered, known) : undefined),
    [known],
  );
  const [ring, setRing] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [showDone, setShowDone] = useState(false);
  const [showLater, setShowLater] = useState(false);

  if (!known || !tests) return null;

  // Default to the ring the learner is actually in, not Ring 1 forever.
  const activeRing = ring ?? (current ? ringOf(current) : RINGS[0]);
  const q = query.trim().toLowerCase();
  const matches = q
    ? modulesOrdered.filter((m) => searchIndex.get(m.id)?.includes(q))
    : [];

  const inRing = modulesOrdered.filter((m) => ringOf(m) === activeRing);
  // Modules before the one you are on are behind you; a window of what is next
  // stays open; the rest of the ring folds away.
  const at =
    current && ringOf(current) === activeRing
      ? inRing.findIndex((m) => m.id === current.id)
      : 0;
  const behind = inRing.slice(0, at);
  const openRows = inRing.slice(at, at + WINDOW);
  const later = inRing.slice(at + WINDOW);

  const withWords = modulesOrdered.filter((m) => m.wordIds.length > 0);
  const finished = withWords.filter((m) => isModuleComplete(m, known)).length;
  const currentProgress = current ? moduleProgress(current, known) : undefined;

  const rows = (list: Module[]) => (
    <div className="border-t border-line">
      {list.map((m) => (
        <ModuleRow
          key={m.id}
          module={m}
          known={known}
          test={tests.get(m.id)}
          current={m.id === current?.id}
        />
      ))}
    </div>
  );

  return (
    <div>
      <PageHeader
        eyebrow="한국어 · Learn"
        title="Modules"
        blurb="Words first, then the glue, then sentences built only from words you know."
      />

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Search ${modulesOrdered.length} modules, readings and words…`}
        className="mb-5 w-full border-b border-line bg-transparent py-2.5 text-[14px] outline-none placeholder:text-faint focus:border-teal"
      />

      {q ? (
        <>
          <div className="mb-2 text-[13px] text-muted">
            {matches.length === 0
              ? "Nothing matches — try a Korean word, its romanization, or an English meaning."
              : `${matches.length} of ${modulesOrdered.length} match “${query.trim()}”`}
          </div>
          {matches.length > 0 && rows(matches)}
        </>
      ) : (
        <>
          {current && currentProgress && (
            <Link
              to={`/learn/${current.id}`}
              className="mb-6 flex items-center justify-between gap-4 border-l-2 border-teal py-1 pl-5"
            >
              <div className="min-w-0">
                <div className="text-[10px] tracking-[0.2em] text-muted uppercase">
                  Where you left off
                </div>
                <div className="mt-1 truncate font-serif text-[17px] font-semibold">
                  {LABELS[current.id]} · {current.title}
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-xs text-muted">
                  {currentProgress.total > 0 ? (
                    <>
                      <Meter
                        pct={
                          (currentProgress.done / currentProgress.total) * 100
                        }
                      />
                      <span>
                        {currentProgress.done} of {currentProgress.total} words
                      </span>
                    </>
                  ) : (
                    <span>Reading — no vocabulary to check off</span>
                  )}
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-teal px-4 py-2 text-[13px] font-bold text-on-accent">
                Continue
              </span>
            </Link>
          )}

          {RINGS.length > 1 && (
            <div className="mb-4 flex gap-6 border-b border-line">
              {RINGS.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRing(r);
                    setShowDone(false);
                    setShowLater(false);
                  }}
                  className={`-mb-px border-b-2 pb-2 text-[13px] whitespace-nowrap transition-colors ${
                    r === activeRing
                      ? "border-teal font-semibold text-ink"
                      : "border-transparent text-muted hover:text-ink"
                  }`}
                >
                  Ring {r} ·{" "}
                  {modulesOrdered.filter((m) => ringOf(m) === r).length}
                </button>
              ))}
            </div>
          )}

          <div className="mb-3">
            <div className="text-[10px] tracking-[0.26em] text-muted uppercase">
              {RING_META[activeRing]?.label ?? `Ring ${activeRing}`}
            </div>
            <p className="mt-1 text-xs text-muted">
              {RING_META[activeRing]?.blurb}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {behind.length > 0 && (
              <>
                <Fold
                  open={showDone}
                  onToggle={() => setShowDone((v) => !v)}
                  title={`Everything before here — ${behind.length} item${behind.length === 1 ? "" : "s"}`}
                  right={showDone ? "hide" : "behind you"}
                />
                {showDone && rows(behind)}
              </>
            )}

            {openRows.length > 0 && rows(openRows)}

            {later.length > 0 && (
              <>
                <Fold
                  open={showLater}
                  onToggle={() => setShowLater((v) => !v)}
                  title={`${later.length} more in this ring`}
                  right={showLater ? "hide" : "not started"}
                />
                {showLater && rows(later)}
              </>
            )}
          </div>

          <p className="mt-5 text-xs leading-relaxed text-muted">
            {finished} of {withWords.length} modules done. Nothing is hidden —
            every fold opens, and search reaches any module, reading or word by
            name.
          </p>
        </>
      )}
    </div>
  );
}
