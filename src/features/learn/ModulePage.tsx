import { useState } from "react";
import { Link, useParams, Navigate } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { moduleById, moduleMarkdown } from "../../content";
import { splitModuleMarkdown } from "./splitModuleMarkdown";
import { useSettings } from "../../state/settings";
import { useKnownWords } from "../../db/useKnownWords";
import { moduleProgress } from "../../lib/gating";
import { PASS_PCT } from "../../lib/moduleTest";
import type { Module } from "../../types";
import Markdown from "../../components/Markdown";
import PageColumns, { RailBlock } from "../../components/PageColumns";
import VocabChecklist from "./VocabChecklist";
import SentenceList from "./SentenceList";
import MissedBlock from "./MissedBlock";
import ReviewQueueLink from "./ReviewQueueLink";

function HangulSection({ md }: { md: string }) {
  const hangulDone = useSettings((s) => s.hangulDone);
  const [open, setOpen] = useState(!hangulDone);

  return (
    <div className="my-4 overflow-hidden rounded-panel bg-card shadow-panel">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <div className="text-sm font-bold">Part 1 — Hangul (the alphabet)</div>
          <div className="mt-0.5 text-xs text-muted">
            {open
              ? "Tap to collapse"
              : hangulDone
                ? "Marked as already known — tap to review anytime"
                : "Tap to expand"}
          </div>
        </div>
        <span
          className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▾
        </span>
      </button>
      {open && (
        <div className="max-w-read border-t border-line px-4 pb-4">
          <Markdown md={md} />
        </div>
      )}
    </div>
  );
}

/** What the last test caught, with the one-click path to practising it
 *  (Nick, 2026-10-25). Hidden once the list is empty. */
function MissedOnLastTest({ module }: { module: Module }) {
  const result = useLiveQuery(() => db.moduleTests.get(module.id), [module.id]);
  return (
    <MissedBlock
      misses={result?.misses}
      moduleId={module.id}
      title="Missed on your last test"
      ctaLabel="Practice these"
      // The test card above already links to Review — once per page is enough.
      queueLink={false}
    />
  );
}

/** End-of-module test card (Nick, 2026-08-10) — vocab modules only. Stacked
 *  rather than side-by-side because it lives in the rail now (BAD-281): on a
 *  7,000px module page the test used to be a button at the very bottom. */
function TestCta({ module }: { module: Module }) {
  const result = useLiveQuery(() => db.moduleTests.get(module.id), [module.id]);
  const known = useKnownWords();
  const passed = !!result && result.bestPct >= PASS_PCT;
  // The test samples this module's sentences, so it unlocks with them — a
  // finished vocabulary checklist (PROJECT.md §"Known-word gating"). Until
  // then the card shows the distance rather than a button that would hand out
  // sentences built from unlearned words (Nick, 2026-10-26).
  // `known` is undefined until Dexie's first query lands. Offering the button
  // in that gap would flash a link the route then bounces, so the card waits.
  const progress = known ? moduleProgress(module, known) : null;
  const locked = !!progress && progress.done < progress.total;
  const unlocked = !!progress && !locked;
  return (
    <RailBlock title="Module test">
      <div className="text-[13px] leading-relaxed text-muted">
        {locked ? (
          <>
            Unlocks with the vocabulary checklist — every sentence it tests is
            built only from words you've marked as learned ({progress.done}/
            {progress.total} so far).
          </>
        ) : result ? (
          <>
            Best {result.bestPct}%{passed && " · passed"} · {result.attempts}{" "}
            attempt{result.attempts === 1 ? "" : "s"}
          </>
        ) : (
          "A fresh sample of this module's words and sentences — misses feed the review queue."
        )}
      </div>
      {locked && (
        <div className="mt-3 rounded-full border border-line px-4 py-2 text-center text-sm font-bold text-faint">
          Locked
        </div>
      )}
      {unlocked && (
        <Link
          to={`/learn/${module.id}/test`}
          className={`mt-3 block rounded-full px-4 py-2 text-center text-sm font-bold transition-opacity hover:opacity-90 ${
            passed ? "border border-jade text-jade" : "bg-teal text-on-accent"
          }`}
        >
          {result ? "Retake" : "Take the test"}
        </Link>
      )}
      {/* Nick, 2026-10-25: the card said misses "feed the review queue" and
          left him to find them. This is the way there. */}
      <ReviewQueueLink
        misses={result?.misses}
        moduleId={module.id}
        className="mt-2.5"
      />
    </RailBlock>
  );
}

export default function ModulePage() {
  const { moduleId } = useParams();
  const module = moduleId ? moduleById.get(moduleId) : undefined;
  if (!module) return <Navigate to="/learn" replace />;

  const raw = moduleMarkdown[module.contentMd];
  const segments = raw ? splitModuleMarkdown(raw) : [];

  const rail = (
    <>
      <RailBlock title="In this module">
        <dl className="text-[13px]">
          {module.wordIds.length > 0 && (
            <div className="flex justify-between border-b border-line py-2">
              <dt className="text-muted">Words</dt>
              <dd className="tabular-nums">{module.wordIds.length}</dd>
            </div>
          )}
          {module.sentenceIds.length > 0 && (
            <div className="flex justify-between border-b border-line py-2">
              <dt className="text-muted">Sentences</dt>
              <dd className="tabular-nums">{module.sentenceIds.length}</dd>
            </div>
          )}
          <div className="flex justify-between py-2">
            <dt className="text-muted">Ring</dt>
            <dd className="tabular-nums">{module.ring ?? 1}</dd>
          </div>
        </dl>
      </RailBlock>
      {module.wordIds.length > 0 && <TestCta module={module} />}
    </>
  );

  return (
    <PageColumns rail={rail}>
      <Link
        to="/learn"
        className="mb-4 inline-block text-[13px] font-semibold text-muted transition-colors hover:text-ink"
      >
        ← Modules
      </Link>
      {segments.map((seg, i) => {
        switch (seg.kind) {
          // Body text stops at a readable measure even when the window does
          // not; the vocabulary and sentence layers below are lists and use
          // the whole column.
          case "md":
            return (
              <div key={i} className="max-w-read">
                <Markdown md={seg.md} />
              </div>
            );
          case "hangul":
            return <HangulSection key={i} md={seg.md} />;
          case "vocab":
            return <VocabChecklist key={i} module={module} />;
          case "sentences":
            return <SentenceList key={i} module={module} />;
        }
      })}
      {module.wordIds.length > 0 && <MissedOnLastTest module={module} />}
    </PageColumns>
  );
}
