import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { currentlyMissed } from "../../lib/stats";
import type { DrillKind } from "../../types";

/** Drills read this to support `?review=1` — a session over only the items
 *  whose latest result in that drill is wrong. `ids` is undefined while
 *  loading (callers should wait before building the engine pool). */
export function useReviewFilter(kind: DrillKind): {
  active: boolean;
  ids: Set<string> | undefined;
} {
  const [params] = useSearchParams();
  const active = params.get("review") === "1";

  const results = useLiveQuery(
    () => (active ? db.drillResults.where("kind").equals(kind).toArray() : []),
    [active, kind],
  );

  const ids = useMemo(() => {
    if (!active) return undefined;
    if (!results) return undefined;
    return new Set(currentlyMissed(results).map((m) => m.itemId));
  }, [active, results]);

  return { active, ids: active ? ids : undefined };
}

/** Shared banner + empty-state helpers for review sessions. */
export function reviewPoolReady(active: boolean, ids: Set<string> | undefined) {
  return !active || ids !== undefined;
}
