import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import { knownSet } from "../lib/gating";

/** Live set of known word ids; undefined while the first query loads. */
export function useKnownWords(): Set<string> | undefined {
  const rows = useLiveQuery(() => db.knownWords.toArray(), []);
  return useMemo(() => (rows ? knownSet(rows) : undefined), [rows]);
}
