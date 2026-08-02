import { Link } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import PageHeader from "../../components/PageHeader";
import { currentlyMissed, type MissedRef } from "../../lib/stats";
import {
  confusableById,
  sentenceById,
  gapById,
  wordById,
  fontLetterById,
} from "../../content";
import type { DrillKind } from "../../types";

interface ResolvedMiss {
  id: string;
  big: string;
  small: string;
}

const KINDS: {
  kind: DrillKind;
  title: string;
  drillTo: string;
  resolve: (itemId: string) => ResolvedMiss | null;
}[] = [
  {
    kind: "confusable",
    title: "Confusables",
    drillTo: "/drill/confusables?review=1",
    resolve: (id) => {
      const c = confusableById.get(id);
      return c ? { id, big: c.c, small: c.r } : null;
    },
  },
  {
    kind: "anatomy",
    title: "Sentence anatomy",
    drillTo: "/drill/anatomy?review=1",
    resolve: (id) => {
      const s = sentenceById.get(id);
      return s
        ? {
            id,
            big: s.ko.map((c) => c.t).filter(Boolean).join(" "),
            small: s.en.map((c) => c.t).filter(Boolean).join(" "),
          }
        : null;
    },
  },
  {
    kind: "gap",
    title: "Literal vs. real",
    drillTo: "/drill/gap?review=1",
    resolve: (id) => {
      const g = gapById.get(id);
      return g ? { id, big: g.ko, small: g.real } : null;
    },
  },
  {
    kind: "typing",
    title: "Typing",
    drillTo: "/drill/typing?review=1",
    resolve: (id) => {
      const w = wordById.get(id);
      return w ? { id, big: w.ko, small: w.en } : null;
    },
  },
  {
    kind: "font",
    title: "Cross-font",
    drillTo: "/drill/fonts",
    resolve: (id) => {
      const l = fontLetterById.get(id);
      return l ? { id, big: l.c, small: l.r } : null;
    },
  },
];

export default function ReviewPage() {
  const results = useLiveQuery(() => db.drillResults.toArray(), []);
  if (!results) return null;

  const missed = currentlyMissed(results);
  const byKind = new Map<DrillKind, MissedRef[]>();
  for (const m of missed) {
    const list = byKind.get(m.kind) ?? [];
    list.push(m);
    byKind.set(m.kind, list);
  }

  const sections = KINDS.map((k) => ({
    ...k,
    items: (byKind.get(k.kind) ?? [])
      .map((m) => k.resolve(m.itemId))
      .filter((x): x is ResolvedMiss => x !== null),
  })).filter((s) => s.items.length > 0);

  return (
    <div>
      <PageHeader
        eyebrow="한국어 · Review"
        title="Review these"
        blurb="Everything whose last answer was wrong, across every drill. Answer an item correctly and it clears itself."
      />

      {sections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-panel px-6 py-12 text-center">
          <div className="font-korean text-4xl">✨</div>
          <div className="mt-3 text-sm font-semibold">Nothing to review</div>
          <p className="mx-auto mt-1.5 max-w-xs text-[13px] leading-relaxed text-muted">
            Miss something in any drill and it will appear here until you
            answer it correctly.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sections.map((s) => (
            <div
              key={s.kind}
              className="rounded-2xl border border-line bg-panel px-4 py-3.5"
            >
              <div className="mb-2.5 flex items-center justify-between">
                <div className="text-[11px] font-semibold tracking-[0.15em] text-clay uppercase">
                  {s.title} · {s.items.length}
                </div>
                <Link
                  to={s.drillTo}
                  className="rounded-full bg-ink px-3.5 py-1.5 text-xs font-bold text-paper transition-opacity hover:opacity-90"
                >
                  Drill these
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {s.items.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-baseline gap-1.5 rounded-lg border border-line bg-paper px-2.5 py-1.5"
                  >
                    <span className="font-korean text-lg leading-none">
                      {m.big}
                    </span>
                    <span className="text-xs text-muted">{m.small}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-5 text-center text-[11.5px] leading-relaxed text-muted">
        Coming in Phase A.2: these items feed a spaced-repetition queue at a
        shortened interval.
      </p>
    </div>
  );
}
