import { Link } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import PageHeader from "../../components/PageHeader";
import PageColumns, { RailBlock, RailStat } from "../../components/PageColumns";
import { db } from "../../db/db";
import { useKnownWords } from "../../db/useKnownWords";
import {
  allWords,
  modulesOrdered,
  sentenceById,
  wordById,
} from "../../content";
import { isModuleComplete, moduleProgress } from "../../lib/gating";
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
const VOCAB_MODULES = modulesOrdered.filter((m) => m.wordIds.length > 0);
const DAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

/** A shortcut straight into a drill. The nav only reaches the hub, so these
 *  are the one place "practise something now" is one click. */
const QUICK_DRILLS = [
  { to: "/drill/confusables/quiz", label: "Confusables · Quiz" },
  { to: "/drill/anatomy?mode=label", label: "Sentence Roles" },
  { to: "/drill/typing", label: "Typing" },
];

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
        className="block h-full rounded-full bg-meter"
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
      className={`mb-2 text-[10px] tracking-[0.22em] uppercase ${
        warn ? "text-clay" : "text-muted"
      }`}
    >
      {children}
    </div>
  );
}

/** One line in the "Next up" list. Rows share one ruled band and are separated
 *  by a hairline — Dancheong gives nothing its own card, and marks the row you
 *  should act on with a vermilion edge rather than a fill (BAD-281). */
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
      className={`flex items-center justify-between gap-4 border-b border-b-line py-4 transition-colors last:border-b-0 hover:bg-fill ${
        highlight ? "border-l-2 border-l-teal pl-4" : "border-l-2 border-l-transparent pl-4"
      }`}
    >
      <div className="min-w-0">
        <div className="text-[10px] tracking-[0.2em] text-muted uppercase">
          {kicker}
        </div>
        <div className="mt-1 truncate font-serif text-[17px] font-semibold">
          {title}
        </div>
        <div className="mt-1.5 flex items-center gap-2 text-xs text-muted">
          {meta}
        </div>
      </div>
      <span className="shrink-0 rounded-full border border-faint px-3.5 py-1.5 text-[13px] font-semibold">
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

  const modulesDone = VOCAB_MODULES.filter((m) =>
    isModuleComplete(m, known),
  ).length;

  // The rail: everything that is true about the learner rather than about
  // today. It used to sit under the plan as a strip; beside it, it fills the
  // width the page was wasting and the plan still ends where it ends.
  const rail = (
    <>
      <RailBlock title="This week">
        <div className="flex gap-2">
          {week.map((on, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (week.length - 1 - i));
            const today = i === week.length - 1;
            return (
              <span key={i} className="flex flex-1 flex-col items-center gap-2">
                <span
                  className={`h-2 w-full rounded-full ${
                    on ? "bg-meter" : today ? "bg-muted" : "bg-line"
                  }`}
                />
                <span
                  className={`text-[10px] ${today ? "text-ink" : "text-faint"}`}
                >
                  {DAY_INITIALS[d.getDay()]}
                </span>
              </span>
            );
          })}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          {streak > 0
            ? `${streak} day${streak === 1 ? "" : "s"} in a row. A day counts once you answer anything.`
            : "A day fills in once you answer anything — a review, a drill, a test."}
        </p>
      </RailBlock>

      <RailBlock title="Your progress">
        <RailStat
          value={known.size}
          label={`of ${TOTAL_WORDS} words`}
          meter={(known.size / TOTAL_WORDS) * 100}
        />
        <RailStat
          value={modulesDone}
          label={`of ${VOCAB_MODULES.length} modules`}
          meter={(modulesDone / VOCAB_MODULES.length) * 100}
        />
        <RailStat
          value={overall.seen ? `${overall.pct}%` : "—"}
          label={
            overall.seen ? `drill accuracy · ${overall.seen} answers` : "drill accuracy"
          }
        />
      </RailBlock>

      <RailBlock title="Practise something">
        <div className="border-t border-line">
          {QUICK_DRILLS.map((d) => (
            <Link
              key={d.to}
              to={d.to}
              className="block border-b border-line py-2.5 text-[13.5px] transition-colors hover:text-teal"
            >
              {d.label}
            </Link>
          ))}
        </div>
        <Link
          to="/drill"
          className="mt-3 inline-block text-[13px] font-semibold text-muted transition-colors hover:text-ink"
        >
          All drills &rarr;
        </Link>
      </RailBlock>
    </>
  );

  return (
    <PageColumns rail={rail}>
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
          anything in it. Dancheong never fills a block to say "this one
          matters" — it runs a vermilion rule down the left of it and sets the
          count big in the serif face. The accent is spent here and nowhere
          else on this page. */}
      {due.length > 0 ? (
        <div className="mb-7 flex items-center justify-between gap-4 border-l-2 border-teal pl-5">
          <div className="flex items-baseline gap-4">
            <div className="font-serif text-5xl leading-none font-semibold text-teal">
              {due.length}
            </div>
            <div>
              <div className="text-[15px] font-semibold">
                {due.length === 1
                  ? "item due for review"
                  : "words and letters due for review"}
              </div>
              <div className="mt-1 text-[13px] text-muted">
                About {reviewMinutes(due.length)} minute
                {reviewMinutes(due.length) === 1 ? "" : "s"}
                {waited > 0 &&
                  ` · the oldest has waited ${waited} day${waited === 1 ? "" : "s"}`}
              </div>
            </div>
          </div>
          <Link
            to="/review/session"
            className="shrink-0 rounded-full bg-teal px-4 py-2 text-sm font-bold text-on-accent transition-opacity hover:opacity-90"
          >
            Start review
          </Link>
        </div>
      ) : (
        <div className="mb-7 border-l-2 border-line pl-5 text-[13.5px] text-muted">
          {cards.length === 0
            ? "Nothing is scheduled yet — every item you drill enters the review queue automatically."
            : "The review queue is clear. Anything you drill today comes back when it is due."}
        </div>
      )}

      {(next || owed) && (
        <section className="mb-7">
          <SectionLabel>Next up</SectionLabel>
          <div className="border-t border-line">
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
        <section className="mb-7">
          <SectionLabel warn>
            What {LABELS[caughtModule.id]}&rsquo;s test caught
          </SectionLabel>
          {/* No chips: the words themselves, Korean in the serif face with the
              gloss under it, the way a vocabulary list is set in print. */}
          <div className="flex flex-wrap gap-x-7 gap-y-3.5 border-t border-line pt-3.5">
            {caught.misses.slice(0, 8).map((m) => {
              const l = missLabel(m);
              if (!l) return null;
              return (
                <span key={`${m.kind}:${m.itemId}`} className="block">
                  <span className="block font-myeongjo text-[21px] leading-tight">
                    {l.ko}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {l.en}
                  </span>
                </span>
              );
            })}
          </div>
          <Link
            to={`/learn/${caughtModule.id}/practice`}
            className="mt-4 inline-block border-b border-teal/40 text-[13px] font-semibold text-teal"
          >
            Practice these {caught.misses.length} &rarr;
          </Link>
        </section>
      )}

      {/* The streak, the word count and this week used to be a strip under
          here. They are in the rail now — see components/PageColumns. */}
      <div className="flex items-baseline gap-3 border-t border-line pt-4 text-[13px] text-muted">
        <span className="font-serif text-[22px] leading-none font-semibold text-ink">
          {streak}
        </span>
        <span>day streak</span>
        <Link
          to="/dashboard"
          className="ml-auto font-semibold transition-colors hover:text-ink"
        >
          All your numbers &rarr;
        </Link>
      </div>
    </PageColumns>
  );
}
