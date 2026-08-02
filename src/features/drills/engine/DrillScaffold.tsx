import type { ReactNode } from "react";
import { Link } from "react-router";
import PageHeader from "../../../components/PageHeader";
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
  return (
    <div>
      <Link
        to="/drill"
        className="mb-4 inline-block text-[13px] font-semibold text-muted transition-colors hover:text-ink"
      >
        ← Drills
      </Link>
      <PageHeader eyebrow={eyebrow} title={title} blurb={blurb} />

      {controls}

      <div className="rounded-2xl border border-line bg-panel px-5 py-6">
        {children}
      </div>

      <div className="mt-3.5 flex items-center justify-between px-1">
        <div className="text-[13px] text-muted">
          <b className="text-ink">{correct}</b>/{seen} correct
          {seen > 0 && <span> · {pct}%</span>}
        </div>
        <button
          onClick={onReset}
          className="text-[13px] text-muted underline underline-offset-3 transition-colors hover:text-ink"
        >
          Reset
        </button>
      </div>

      <MissedStrip items={missed} />
    </div>
  );
}
