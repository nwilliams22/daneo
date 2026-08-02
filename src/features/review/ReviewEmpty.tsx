import { Link } from "react-router";

/** Shown when a review session has nothing left to drill. */
export default function ReviewEmpty() {
  return (
    <div>
      <Link
        to="/review"
        className="mb-4 inline-block text-[13px] font-semibold text-muted transition-colors hover:text-ink"
      >
        ← Review
      </Link>
      <div className="rounded-2xl border border-dashed border-line bg-panel px-6 py-10 text-center">
        <div className="font-korean text-3xl">✓</div>
        <div className="mt-3 text-sm font-semibold text-teal">All cleared</div>
        <p className="mx-auto mt-1.5 max-w-xs text-[13px] leading-relaxed text-muted">
          Nothing left to review in this drill — every missed item has been
          answered correctly.
        </p>
      </div>
    </div>
  );
}
