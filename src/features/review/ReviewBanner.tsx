import { Link } from "react-router";

/** Shown at the top of a drill running in `?review=1` mode. */
export default function ReviewBanner({ count }: { count: number }) {
  return (
    <div className="mb-4 flex items-center justify-between rounded-xl border border-clay/40 bg-clay/10 px-3.5 py-2.5">
      <span className="text-[13px] font-semibold text-clay">
        Reviewing {count} missed item{count === 1 ? "" : "s"}
      </span>
      <Link
        to="/review"
        className="text-[12px] font-semibold text-muted underline underline-offset-2 hover:text-ink"
      >
        Back to Review
      </Link>
    </div>
  );
}
