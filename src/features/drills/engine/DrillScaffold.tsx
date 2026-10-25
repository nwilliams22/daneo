import type { ReactNode } from "react";
import { Link } from "react-router";
import PageHeader from "../../../components/PageHeader";
import PageColumns, { RailBlock } from "../../../components/PageColumns";
import MissedStrip, { type MissedChip } from "./MissedStrip";

/** Shared drill chrome: header, control slots, the card panel, the stats
 *  row, and the missed-items strip. Each drill supplies only its body. */
export default function DrillScaffold({
  eyebrow,
  title,
  blurb,
  controls,
  children,
  seen,
  correct,
  pct,
  onReset,
  missed,
}: {
  eyebrow: string;
  title: string;
  blurb?: string;
  controls?: ReactNode;
  children: ReactNode;
  seen: number;
  correct: number;
  pct: number;
  onReset: () => void;
  missed: MissedChip[];
}) {
  // The score and this session's misses sit in the rail (BAD-281): they are
  // about the session rather than about the question on screen, and keeping
  // them out of the main column stops the drill itself from stretching across
  // a 1,120px window.
  const rail = (
    <>
      {controls && <RailBlock title="Settings">{controls}</RailBlock>}
      <RailBlock title="This session">
        <div className="flex items-baseline gap-2 border-b border-line pb-3">
          <span className="font-serif text-[26px] leading-none font-semibold">
            {correct}
          </span>
          <span className="text-[13px] text-muted">
            of {seen} correct{seen > 0 && ` · ${pct}%`}
          </span>
        </div>
        <button
          onClick={onReset}
          className="mt-3 text-[13px] text-muted underline underline-offset-3 transition-colors hover:text-ink"
        >
          Reset
        </button>
      </RailBlock>
      <MissedStrip items={missed} />
    </>
  );

  return (
    <PageColumns rail={rail}>
      <Link
        to="/drill"
        className="mb-4 inline-block text-[13px] font-semibold text-muted transition-colors hover:text-ink"
      >
        ← Drills
      </Link>
      <PageHeader eyebrow={eyebrow} title={title} blurb={blurb} />

      {/* Dancheong draws no card around the drill: a rule above and below it,
          and the space does the rest (BAD-281). */}
      <div className="border-y border-line py-7">{children}</div>
    </PageColumns>
  );
}
