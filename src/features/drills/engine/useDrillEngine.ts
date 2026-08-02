import { useCallback, useEffect, useRef, useState } from "react";
import { logDrillResult } from "../../../db/repo";
import { shuffle } from "../../../lib/rng";
import type { DrillKind, FontFace } from "../../../types";

// The single funnel every drill answers through: session stats, the missed
// strip, the Dexie result row, and auto-advance timing all happen here.
// Pools are pre-gated by callers — the engine never sees locked items.

export interface DrillEngine<T extends { id: string }> {
  current: T | undefined;
  index: number;
  total: number;
  seen: number;
  correct: number;
  pct: number;
  missed: T[];
  /** True between answering and advancing (feedback window). */
  answered: boolean;
  answer: (
    ok: boolean,
    opts?: { advanceAfterMs?: number; face?: FontFace },
  ) => void;
  advance: () => void;
  reset: (pool?: T[]) => void;
}

export function useDrillEngine<T extends { id: string }>(opts: {
  kind: DrillKind;
  pool: T[];
  /** Log results to Dexie (default true). */
  log?: boolean;
  /** Reshuffle and continue after the last item (default true). */
  loop?: boolean;
}): DrillEngine<T> {
  const { kind, pool, log = true, loop = true } = opts;
  const [order, setOrder] = useState<T[]>(() => shuffle(pool));
  const [index, setIndex] = useState(0);
  const [seen, setSeen] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [missed, setMissed] = useState<T[]>([]);
  const [answered, setAnswered] = useState(false);
  const timer = useRef<number | null>(null);

  const clearTimer = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };
  useEffect(() => clearTimer, []);

  const advance = useCallback(() => {
    clearTimer();
    setAnswered(false);
    const next = index + 1;
    if (next < order.length) {
      setIndex(next);
    } else if (loop) {
      setOrder(shuffle(order));
      setIndex(0);
    }
  }, [index, order, loop]);

  const answer = useCallback<DrillEngine<T>["answer"]>(
    (ok, o) => {
      const cur = order[index];
      if (!cur || answered) return;
      setAnswered(true);
      setSeen((s) => s + 1);
      if (ok) setCorrect((c) => c + 1);
      else
        setMissed((m) =>
          m.some((x) => x.id === cur.id) ? m : [...m, cur],
        );
      if (log)
        logDrillResult({ kind, itemId: cur.id, correct: ok, face: o?.face });
      const delay = o?.advanceAfterMs ?? (ok ? 650 : 1300);
      if (delay <= 0) advance();
      else timer.current = window.setTimeout(advance, delay);
    },
    [order, index, answered, log, kind, advance],
  );

  const reset = useCallback(
    (nextPool?: T[]) => {
      clearTimer();
      setOrder(shuffle(nextPool ?? pool));
      setIndex(0);
      setSeen(0);
      setCorrect(0);
      setMissed([]);
      setAnswered(false);
    },
    [pool],
  );

  return {
    current: order[index],
    index,
    total: order.length,
    seen,
    correct,
    pct: seen ? Math.round((correct / seen) * 100) : 0,
    missed,
    answered,
    answer,
    advance,
    reset,
  };
}
