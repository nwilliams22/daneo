import { Link } from "react-router";
import MissedStrip from "../drills/engine/MissedStrip";
import type { MissView } from "../../lib/testMisses";

// The one-click path from "I got these wrong" to practising exactly those
// (Nick, 2026-10-25) — used by the test results screen and the module page.

export default function MissedBlock({
  items,
  moduleId,
  title,
  ctaLabel,
}: {
  items: MissView[];
  moduleId: string;
  title: string;
  ctaLabel: string;
}) {
  if (items.length === 0) return null;
  return (
    <MissedStrip
      items={items}
      title={`${title} · ${items.length}`}
      footer={
        <div className="mt-3.5 text-center">
          <Link
            to={`/learn/${moduleId}/practice`}
            className="inline-block rounded-full bg-ink px-5 py-2 text-sm font-bold text-paper transition-opacity hover:opacity-90"
          >
            {ctaLabel}
          </Link>
          <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
            They are in your review queue too — this just puts them first.
            Items leave this list once you answer them correctly.
          </p>
        </div>
      }
    />
  );
}
