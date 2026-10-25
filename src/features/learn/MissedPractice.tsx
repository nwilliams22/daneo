import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { moduleById } from "../../content";
import { useGapPool } from "../drills/gap/useGapPool";
import {
  ReviewSession,
  buildQuestion,
  type Question,
  type SessionChrome,
} from "../review/ReviewSession";
import PageHeader from "../../components/PageHeader";
import type { Module } from "../../types";

// "Practice these now" (Nick, 2026-10-25): one pass over exactly what the
// module's last test caught, in the same question UX as the daily review.
// Answers grade through logDrillResult like everywhere else, so the items
// stay scheduled AND leave the module's missed list as they come back right.

function chromeFor(module: Module): SessionChrome {
  return {
    eyebrow: `한국어 · ${module.title}`,
    title: "Practice Misses",
    blurb: "Only what your last module test caught — nothing else.",
    backTo: `/learn/${module.id}`,
    backLabel: module.title,
    doneEyebrow: `한국어 · ${module.title}`,
    doneTitle: "Practice Complete",
    doneNote:
      "What you got right here has left the module's missed list. Anything still wrong stays in the review queue and on the list.",
  };
}

function PracticeRun({ module }: { module: Module }) {
  // Wrapped so "still loading" (undefined) is distinct from "no test yet".
  const row = useLiveQuery(
    async () => ({ result: await db.moduleTests.get(module.id) }),
    [module.id],
  );
  const gapPool = useGapPool();
  // Freeze on first load: answering clears misses, which must not shrink the
  // session underneath the learner.
  const [queue, setQueue] = useState<Question[] | null>(null);
  useEffect(() => {
    if (queue === null && row && gapPool)
      setQueue(
        (row.result?.misses ?? [])
          .map((m) => buildQuestion(m.kind, m.itemId, gapPool))
          .filter((q): q is Question => q !== null),
      );
  }, [queue, row, gapPool]);

  if (!queue) return null;
  if (queue.length === 0)
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
          title="Practice Misses"
        />
        <div className="rounded-2xl border border-dashed border-line bg-panel px-6 py-10 text-center">
          <div className="font-korean text-3xl">✨</div>
          <div className="mt-3 text-sm font-semibold">
            Nothing left to practice here
          </div>
          <p className="mx-auto mt-1.5 max-w-xs text-[13px] leading-relaxed text-muted">
            This module's last test left nothing outstanding — take the test
            again and anything it catches lands here.
          </p>
          <Link
            to={`/learn/${module.id}/test`}
            className="mt-4 inline-block rounded-full bg-ink px-5 py-2 text-sm font-bold text-paper transition-opacity hover:opacity-90"
          >
            Take the module test
          </Link>
        </div>
      </div>
    );

  return <ReviewSession queue={queue} chrome={chromeFor(module)} />;
}

export default function MissedPracticeRoute() {
  const { moduleId } = useParams();
  const module = moduleId ? moduleById.get(moduleId) : undefined;
  if (!module) return <Navigate to="/learn" replace />;
  return <PracticeRun module={module} />;
}
