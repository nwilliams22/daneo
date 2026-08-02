import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../../db/db";
import { gapItems } from "../../../content";
import { discoveredGapItems } from "../../../lib/discovered";
import type { GapItem } from "../../../types";

export interface GapPool {
  /** Content gap items + discovered (saved-translation) items. */
  items: GapItem[];
  byId: Map<string, GapItem>;
}

/** The live Gap deck: static content plus translator discoveries.
 *  Undefined while the savedTranslations query loads. */
export function useGapPool(): GapPool | undefined {
  const saved = useLiveQuery(() => db.savedTranslations.toArray(), []);
  return useMemo(() => {
    if (!saved) return undefined;
    const items = [...gapItems, ...discoveredGapItems(saved)];
    return { items, byId: new Map(items.map((g) => [g.id, g])) };
  }, [saved]);
}
