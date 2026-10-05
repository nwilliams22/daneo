import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import { deleteTranslation } from "../../db/repo";
import Rom from "../../components/Rom";
import type { SavedTranslation } from "../../types";

export default function SavedDeck() {
  const saved = useLiveQuery(
    () => db.savedTranslations.orderBy("savedAt").reverse().toArray(),
    [],
  );
  const [open, setOpen] = useState<number | null>(null);
  if (!saved || saved.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="mb-2.5 pl-0.5 text-[11px] font-semibold tracking-[0.15em] text-muted uppercase">
        Discovered · {saved.length}
      </div>
      <div className="flex flex-col gap-2">
        {saved.map((t: SavedTranslation) => {
          const isOpen = open === t.id;
          const hasGap = t.result.literal_gap.trim().length > 0;
          return (
            <div
              key={t.id}
              className="rounded-xl border border-line bg-panel px-4 py-3"
            >
              <button
                onClick={() => setOpen(isOpen ? null : (t.id ?? null))}
                className="flex w-full items-baseline justify-between gap-2.5 text-left"
              >
                <span className="flex items-baseline gap-2">
                  <span className="font-korean text-[17px] font-semibold">
                    {t.result.korean}
                  </span>
                  {hasGap && (
                    <span className="rounded-full bg-clay/15 px-2 py-0.5 text-[10px] font-bold text-clay">
                      gap deck
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-xs text-muted">
                  {t.result.natural_english}
                </span>
              </button>
              {isOpen && (
                <div className="mt-2 border-t border-line pt-2">
                  <Rom text={t.result.romanization} className="block" />
                  {hasGap && (
                    <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                      {t.result.literal_gap}
                    </p>
                  )}
                  <button
                    onClick={() => t.id !== undefined && deleteTranslation(t.id)}
                    className="mt-2.5 text-xs font-semibold text-clay underline underline-offset-2"
                  >
                    Remove from deck
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

