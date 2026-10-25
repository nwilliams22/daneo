import { Link } from "react-router";
import MissedStrip from "../drills/engine/MissedStrip";
import ReviewQueueLink from "./ReviewQueueLink";
import { sentenceById, wordById } from "../../content";
import { missViews } from "../../lib/testMisses";
import type { TestMiss } from "../../types";

// The one-click path from "I got these wrong" to practising exactly those
// (Nick, 2026-10-25) — used by the test results screen, the module page and
// the Review tab. `queueLink` carries the link to Review; the module page
// turns it off because its test card already shows one.

export default function MissedBlock({
  misses,
  moduleId,
  title,
  ctaLabel,
  queueLink = true,
  note,
}: {
  misses?: TestMiss[];
  moduleId: string;
  title: string;
  ctaLabel: string;
  queueLink?: boolean;
  note?: string;
}) {
  const items = missViews(misses, wordById, sentenceById);
  if (items.length === 0) return null;
  return (
    <MissedStrip
      items={items}
      title={`${title} · ${items.length}`}
      footer={
        <div className="mt-3.5 text-center">
          <Link
            to={`/learn/${moduleId}/practice`}
            className="inline-block rounded-full bg-teal px-5 py-2 text-sm font-bold text-on-accent transition-opacity hover:opacity-90"
          >
            {ctaLabel}
          </Link>
          {queueLink && (
            <div className="mt-2.5">
              <ReviewQueueLink misses={misses} moduleId={moduleId} />
            </div>
          )}
          <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
            {note ??
              (queueLink
                ? "Practising here puts them first; the queue schedules them anyway."
                : "They are in your review queue too — this just puts them first.")}{" "}
            Items leave this list once you answer them correctly.
          </p>
        </div>
      }
    />
  );
}
