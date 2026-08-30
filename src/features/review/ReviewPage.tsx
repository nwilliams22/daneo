import { Link } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import PageHeader from "../../components/PageHeader";
import {
  currentlyMissed,
  missedWordsByModule,
  type MissedRef,
} from "../../lib/stats";
import { dueNow, nextDueAt } from "../../lib/srs";
import {
  confusableById,
  sentenceById,
  wordById,
  fontLetterById,
  modulesOrdered,
} from "../../content";
import { useGapPool, type GapPool } from "../drills/gap/useGapPool";
import type { DrillKind, GapItem, Word } from "../../types";

interface ResolvedMiss {
  id: string;
  big: string;
  small: string;
}

const sentenceMiss = (id: string): ResolvedMiss | null => {
  const s = sentenceById.get(id);
  return s
    ? {
        id,
        big: s.ko.map((c) => c.t).filter(Boolean).join(" "),
        small: s.en.map((c) => c.t).filter(Boolean).join(" "),
      }
    : null;
};

const kindSections = (
  gapById: Map<string, GapItem>,
): {
  kind: DrillKind;
  title: string;
  drillTo: string;
  resolve: (itemId: string) => ResolvedMiss | null;
}[] => [
  {
    kind: "confusable",
    title: "Confusables",
    drillTo: "/drill/confusables/quiz?review=1",
    resolve: (id) => {
      const c = confusableById.get(id);
      return c ? { id, big: c.c, small: c.r } : null;
    },
  },
  {
    kind: "anatomy",
    title: "Sentence anatomy",
    drillTo: "/drill/anatomy?review=1",
    resolve: sentenceMiss,
  },
  {
    kind: "role",
    title: "Sentence roles",
    drillTo: "/drill/anatomy?review=1&mode=label",
    resolve: sentenceMiss,
  },
  {
    kind: "gap",
    title: "Literal vs. real",
    drillTo: "/drill/gap/quiz?review=1",
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

function formatWhen(ms: number): string {
  const d = ms - Date.now();
  if (d < 60_000) return "in under a minute";
  if (d < 60 * 60_000) return `in ${Math.round(d / 60_000)} min`;
  if (d < 24 * 60 * 60_000) return `in about ${Math.round(d / 3_600_000)} h`;
  return `on ${new Date(ms).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })}`;
}

/** The Phase A.2 daily-queue banner: due count + entry into the session. */
function DueQueuePanel() {
  const cards = useLiveQuery(() => db.srsCards.toArray(), []);
  if (!cards) return null;

  const due = dueNow(cards);
  const next = nextDueAt(cards);

  return (
    <div className="mb-4 rounded-2xl border border-line bg-panel px-4 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold tracking-[0.15em] text-teal uppercase">
            Daily review
          </div>
          {due.length > 0 ? (
            <div className="mt-1 text-sm">
              <b>{due.length}</b> item{due.length === 1 ? "" : "s"} due — all
              drills, one pass.
            </div>
          ) : (
            <div className="mt-1 text-sm text-muted">
              All caught up.
              {next !== undefined && (
                <span> Next review {formatWhen(next)}.</span>
              )}
              {next === undefined && cards.length === 0 && (
                <span> Drill anything and it enters the schedule.</span>
              )}
            </div>
          )}
        </div>
        {due.length > 0 && (
          <Link
            to="/review/session"
            className="shrink-0 rounded-full bg-teal px-4 py-2 text-sm font-bold text-on-accent transition-opacity hover:opacity-90"
          >
            Start review
          </Link>
        )}
      </div>
    </div>
  );
}

function MissedSections({ gapPool }: { gapPool: GapPool }) {
  const results = useLiveQuery(() => db.drillResults.toArray(), []);
  if (!results) return null;

  const missed = currentlyMissed(results);
  const byKind = new Map<DrillKind, MissedRef[]>();
  for (const m of missed) {
    const list = byKind.get(m.kind) ?? [];
    list.push(m);
    byKind.set(m.kind, list);
  }

  const drillSections = kindSections(gapPool.byId).map((k) => ({
    key: k.kind,
    title: k.title,
    drillTo: k.drillTo,
    cta: "Drill these",
    items: (byKind.get(k.kind) ?? [])
      .map((m) => k.resolve(m.itemId))
      .filter((x): x is ResolvedMiss => x !== null),
  }));

  // Vocab-MCQ misses (kind "word") come from module tests, so the re-drill
  // route is per module: one card per module, its test as the CTA.
  const wordsByModule = missedWordsByModule(
    missed,
    (id) => wordById.get(id)?.moduleId,
  );
  const vocabSections = modulesOrdered
    .filter((m) => wordsByModule.has(m.id))
    .map((m) => ({
      key: `word:${m.id}`,
      title: `Vocabulary · ${m.title}`,
      drillTo: `/learn/${m.id}/test`,
      cta: "Retake test",
      items: (wordsByModule.get(m.id) ?? [])
        .map((id) => wordById.get(id))
        .filter((w): w is Word => w !== undefined)
        .map((w) => ({ id: w.id, big: w.ko, small: w.en })),
    }));

  const sections = [...drillSections, ...vocabSections].filter(
    (s) => s.items.length > 0,
  );

  if (sections.length === 0)
    return (
      <div className="rounded-2xl border border-dashed border-line bg-panel px-6 py-12 text-center">
        <div className="font-korean text-4xl">✨</div>
        <div className="mt-3 text-sm font-semibold">Nothing to review</div>
        <p className="mx-auto mt-1.5 max-w-xs text-[13px] leading-relaxed text-muted">
          Miss something in any drill or module test and it will appear here
          until you answer it correctly.
        </p>
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      {sections.map((s) => (
        <div
          key={s.key}
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
              {s.cta}
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
  );
}

export default function ReviewPage() {
  const gapPool = useGapPool();
  if (!gapPool) return null;

  return (
    <div>
      <PageHeader
        eyebrow="한국어 · Review"
        title="Review"
        blurb="The spaced queue brings items back as their intervals run out; the strip below tracks anything whose last answer was wrong."
      />

      <DueQueuePanel />
      <MissedSections gapPool={gapPool} />

      <p className="mt-5 text-center text-[11.5px] leading-relaxed text-muted">
        Wrong answers reschedule to come back within minutes; correct answers
        push items days, then weeks, out.
      </p>
    </div>
  );
}
