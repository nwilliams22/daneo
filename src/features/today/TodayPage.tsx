import { Link } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import PageHeader from "../../components/PageHeader";
import { db } from "../../db/db";
import { useKnownWords } from "../../db/useKnownWords";
import {
  allWords,
  modulesOrdered,
  sentenceById,
  wordById,
} from "../../content";
import { moduleProgress } from "../../lib/gating";
import { moduleLabels } from "../../lib/moduleLabel";
import { PASS_PCT } from "../../lib/moduleTest";
import { dueNow } from "../../lib/srs";
import { accuracy } from "../../lib/stats";
import {
  lastCaught,
  moduleToContinue,
  oldestDueDays,
  planMinutes,
  reviewMinutes,
  studyStreak,
  studyWeek,
  testOwed,
} from "../../lib/today";
import type { TestMiss } from "../../types";

// The landing page (BAD-281, Nick: "here's your plan for today"). Everything
// shown here already existed somewhere — the review queue, the module you are
// in, the test you owe, what the last test caught — scattered across four
// screens. This page is the one place that answers "what do I do now", in the
// order the answer should be acted on.
//
// All of the deciding lives in lib/today.ts and is unit-tested there; this file
// only draws it.

const LABELS = moduleLabels(modulesOrdered);
const TOTAL_WORDS = allWords.filter((w) => w.pos !== "particle").length;
const WEEK_INITIALS = ["M", "T", "W", "T", "F", "S", "S"];

/** Korean plus its gloss for an item a test caught. Module tests only ever
 *  catch words and sentences, so this needs no drill pools. */
function missLabel(m: TestMiss): { ko: string; en: string } | null {
  if (m.kind === "word") {
    const w = wordById.get(m.itemId);
    return w ? { ko: w.ko, en: w.en } : null;
  }
  const s = sentenceById.get(m.itemId);
  if (!s) return null;
  return {
    ko: s.ko.map((c) => c.t).filter(Boolean).join(" "),
    en: s.en.map((c) => c.t).filter(Boolean).join(" "),
  };
}

function Meter({ pct }: { pct: number }) {
  return (
    <span className="inline-block h-1.5 w-24 overflow-hidden rounded-full bg-line align-middle">
      <span
        className="block h-full rounded-full bg-teal"
        style={{ width: `${Math.round(pct)}%` }}
      />
    </span>
  );
}

function SectionLabel({
  children,
  warn,
}: {
  children: React.ReactNode;
  warn?: boolean;
}) {
  return (
    <div
      className={`mb-2 text-[11px] font-semibold tracking-[0.15em] uppercase ${
        warn ? "text-clay" : "text-muted"
      }`}
    >
      {children}
    </div>
  );
}

/** One line in the "Next up" panel. Rows are grouped into a single surface and
 *  separated by a hairline — Slate groups related rows rather than giving each
 *  one its own card (BAD-281). */
function Row({
  kicker,
  title,
  meta,
  to,
  action,
  highlight,
}: {
  kicker: string;
  title: string;
  meta: React.ReactNode;
  to: string;
  action: string;
  highlight?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center justify-between gap-4 px-4 py-3.5 border-b border-line transition-colors last:border-b-0 hover:bg-fill ${
        highlight ? "bg-accent-wash" : ""
      }`}
    >
      <div className="min-w-0">
        <div className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
          {kicker}
        </div>
        <div className="mt-0.5 truncate text-[15px] font-bold">{title}</div>
        <div className="mt-1.5 flex items-center gap-2 text-xs text-muted">
          {meta}
        </div>
      </div>
      <span className="shrink-0 rounded-full bg-fill px-3.5 py-1.5 text-[13px] font-bold">
        {action}
      </span>
    </Link>
  );
}

export default function TodayPage() {
  const known = useKnownWords();
  const cards = useLiveQuery(() => db.srsCards.toArray(), []);
  const results = useLiveQuery(() => db.drillResults.toArray(), []);
  const tests = useLiveQuery(() => db.moduleTests.toArray(), []);
  if (!known || !cards || !results || !tests) return null;

  const due = dueNow(cards);
  const waited = oldestDueDays(cards);
  const next = moduleToContinue(modulesOrdered, known);
  const nextProgress = next ? moduleProgress(next, known) : undefined;
  const owed = testOwed(modulesOrdered, known, new Map(tests.map((t) => [t.moduleId, t])));
  const caught = lastCaught(tests);
  const caughtModule = caught ? modulesOrdered.find((m) => m.id === caught.moduleId) : undefined;
  const week = studyWeek(results);
  const streak = studyStreak(results);
  const overall = accuracy(results);

  const waiting =
    (due.length > 0 ? 1 : 0) + (next ? 1 : 0) + (owed ? 1 : 0);
  const minutes = planMinutes({
    due: due.length,
    hasModule: !!next,
    hasTest: !!owed,
  });
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div>
      <PageHeader
        eyebrow={`오늘 · ${today}`}
        title="Here is your plan for today"
        blurb={
          waiting === 0
            ? "Nothing is waiting. Pick anything below, or come back when a review falls due."
            : `${waiting === 1 ? "One thing" : `${waiting} things`} waiting — about ${minutes} minute${minutes === 1 ? "" : "s"} if you do all of them.`
        }
      />

      {/* The one accent moment on the page: the review queue, when it has
          anything in it. Slate spends its blue here and nowhere else. */}
      {due.length > 0 ? (
        <div className="mb-5 flex items-center justify-between gap-4 rounded-panel bg-teal px-5 py-4 text-on-accent shadow-panel">
          <div className="flex items-center gap-4">
            <div className="text-5xl leading-none font-bold">{due.length}</div>
            <div>
              <div className="text-[15px] font-semibold">
                {due.length === 1
                  ? "item due for review"
                  : "words and letters due for review"}
              </div>
              <div className="mt-0.5 text-[13px] opacity-75">
                About {reviewMinutes(due.length)} minute
                {reviewMinutes(due.length) === 1 ? "" : "s"}
                {waited > 0 &&
                  ` · the oldest has waited ${waited} day${waited === 1 ? "" : "s"}`}
              </div>
            </div>
          </div>
          <Link
            to="/review/session"
            className="shrink-0 rounded-full bg-panel px-4 py-2 text-sm font-bold text-teal shadow-panel transition-shadow hover:shadow-lift"
          >
            Start review
          </Link>
        </div>
      ) : (
        <div className="mb-5 rounded-panel bg-panel px-5 py-4 text-[13.5px] text-muted shadow-panel">
          {cards.length === 0
            ? "Nothing is scheduled yet — every item you drill enters the review queue automatically."
            : "The review queue is clear. Anything you drill today comes back when it is due."}
        </div>
      )}

      {(next || owed) && (
        <section className="mb-5">
          <SectionLabel>Next up</SectionLabel>
          <div className="overflow-hidden rounded-panel bg-panel shadow-panel">
            {next && nextProgress && (
              <Row
                highlight
                kicker={`Continue · ${LABELS[next.id]}`}
                title={next.title}
                to={`/learn/${next.id}`}
                action={nextProgress.done > 0 ? "Continue" : "Start"}
                meta={
                  nextProgress.total > 0 ? (
                    <>
                      <Meter
                        pct={(nextProgress.done / nextProgress.total) * 100}
                      />
                      <span>
                        {nextProgress.done} of {nextProgress.total} words
                      </span>
                    </>
                  ) : (
                    <span>Reading — no vocabulary to check off</span>
                  )
                }
              />
            )}
            {owed && (
              <Row
                kicker={`Test waiting · ${LABELS[owed.module.id]}`}
                title={owed.module.title}
                to={`/learn/${owed.module.id}/test`}
                action={owed.result ? "Take it again" : "Take the test"}
                meta={
                  <>
                    {owed.result && (
                      <span className="rounded-full bg-warn-wash px-2 py-0.5 font-semibold text-clay">
                        best {owed.result.bestPct}%
                      </span>
                    )}
                    <span>{PASS_PCT}% passes</span>
                  </>
                }
              />
            )}
          </div>
        </section>
      )}

      {caught && caughtModule && (
        <section className="mb-5">
          <SectionLabel warn>
            What {LABELS[caughtModule.id]}&rsquo;s test caught
          </SectionLabel>
          <div className="flex flex-wrap gap-2">
            {caught.misses.slice(0, 8).map((m) => {
              const l = missLabel(m);
              if (!l) return null;
              return (
                <span
                  key={`${m.kind}:${m.itemId}`}
                  className="flex items-baseline gap-1.5 rounded-xl bg-fill px-2.5 py-1.5"
                >
                  <span className="font-korean text-[15px] font-bold">
                    {l.ko}
                  </span>
                  <span className="text-xs text-muted">{l.en}</span>
                </span>
              );
            })}
          </div>
          <Link
            to={`/learn/${caughtModule.id}/practice`}
            className="mt-3 inline-block text-[13px] font-bold text-teal"
          >
            Practice these {caught.misses.length} &rarr;
          </Link>
        </section>
      )}

      <div className="flex items-center justify-between gap-4 rounded-panel bg-panel px-5 py-4 shadow-panel">
        <div className="flex gap-7">
          <div>
            <div className="text-2xl font-bold">{streak}</div>
            <div className="text-xs text-muted">day streak</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{known.size}</div>
            <div className="text-xs text-muted">of {TOTAL_WORDS} words</div>
          </div>
          <div>
            <div className="text-2xl font-bold">
              {overall.seen ? `${overall.pct}%` : "—"}
            </div>
            <div className="text-xs text-muted">drill accuracy</div>
          </div>
        </div>
        <div className="flex shrink-0 gap-1.5" aria-label="This week">
          {week.map((on, i) => (
            <span
              key={i}
              title={WEEK_INITIALS[(new Date().getDay() + i) % 7]}
              className={`h-2.5 w-2.5 rounded-full ${
                on ? "bg-teal" : i === week.length - 1 ? "bg-muted" : "bg-line"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
