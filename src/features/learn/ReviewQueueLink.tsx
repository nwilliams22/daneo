import { Link } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { formatDueIn } from "../../lib/srs";
import { missQueueStatus } from "../../lib/testMisses";
import type { TestMiss } from "../../types";

// The door to the Review tab (Nick, 2026-10-25): he found his Module 1 misses
// in Review only after being told where to look. A sentence saying the queue
// has them is not a path to it — this is the count and the link.

export default function ReviewQueueLink({
  misses,
  moduleId,
  className = "",
}: {
  misses?: TestMiss[];
  moduleId: string;
  className?: string;
}) {
  const cards = useLiveQuery(() => db.srsCards.toArray(), []);
  const { total, due, nextDue } = missQueueStatus(misses, cards ?? []);
  if (total === 0) return null;

  // Wrong answers come back within minutes, so a fresh test's misses are
  // often "in Review" without being due yet — say which.
  const timing =
    nextDue === undefined
      ? "due now"
      : due === 0
        ? `due ${formatDueIn(nextDue)}`
        : `${due} due now, the rest ${formatDueIn(nextDue)}`;

  return (
    <Link
      to={`/review?module=${moduleId}`}
      className={`inline-block text-[12.5px] leading-relaxed font-semibold text-teal underline-offset-2 hover:underline ${className}`}
    >
      {total} item{total === 1 ? "" : "s"} from this test{" "}
      {total === 1 ? "is" : "are"} waiting in Review ({timing}) →
    </Link>
  );
}
