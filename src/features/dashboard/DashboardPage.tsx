import { Link } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import PageHeader from "../../components/PageHeader";
import {
  accuracy,
  accuracyByGroup,
  accuracyByFace,
  weakestItems,
} from "../../lib/stats";
import {
  allWords,
  modulesOrdered,
  confusableById,
  sentenceById,
  wordById,
} from "../../content";
import { useKnownWords } from "../../db/useKnownWords";
import { moduleProgress } from "../../lib/gating";
import { dueNow } from "../../lib/srs";
import { useGapPool } from "../drills/gap/useGapPool";
import type { GapItem } from "../../types";

const GROUP_LABELS: Record<string, string> = {
  compound: "Compound vowels",
  vowel: "Look-alike vowels",
  consonant: "Look-alike consonants",
  tense: "Aspirated & tense",
};

function Panel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-panel px-4 py-3.5">
      <div className="mb-2.5 text-[11px] font-semibold tracking-[0.15em] text-muted uppercase">
        {label}
      </div>
      {children}
    </div>
  );
}

function Bar({ pct }: { pct: number }) {
  return (
    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
      <div
        className={`h-full rounded-full ${pct >= 80 ? "bg-teal" : pct >= 50 ? "bg-gold" : "bg-clay"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function labelFor(
  kind: string,
  itemId: string,
  gapById: Map<string, GapItem>,
): { big: string; small: string } {
  if (kind === "confusable") {
    const c = confusableById.get(itemId);
    if (c) return { big: c.c, small: c.r };
  }
  if (kind === "anatomy") {
    const s = sentenceById.get(itemId);
    if (s)
      return {
        big: s.ko.map((c) => c.t).filter(Boolean).join(" "),
        small: s.en.map((c) => c.t).filter(Boolean).join(" "),
      };
  }
  if (kind === "gap") {
    const g = gapById.get(itemId);
    if (g) return { big: g.ko, small: g.real };
  }
  if (kind === "typing" || kind === "word") {
    const w = wordById.get(itemId);
    if (w) return { big: w.ko, small: w.en };
  }
  return { big: itemId, small: kind };
}

export default function DashboardPage() {
  const known = useKnownWords();
  const results = useLiveQuery(() => db.drillResults.toArray(), []);
  const cards = useLiveQuery(() => db.srsCards.toArray(), []);
  const gapPool = useGapPool();
  if (!known || !results || !cards || !gapPool) return null;

  const due = dueNow(cards);

  const totalWords = allWords.filter((w) => w.pos !== "particle").length;
  const overall = accuracy(results);
  const week = accuracy(results, Date.now() - 7 * 24 * 60 * 60 * 1000);
  const groups = accuracyByGroup(
    results,
    "confusable",
    (id) => confusableById.get(id)?.group,
  );
  const weakest = weakestItems(results, 3, 5);
  const faces = accuracyByFace(results);

  return (
    <div>
      <PageHeader
        eyebrow="한국어 · Stats"
        title="Progress"
        blurb="Derived from every drill answer you've given — nothing to configure."
      />

      <div className="flex flex-col gap-3.5">
        {/* Words learned */}
        <Panel label="Words learned">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{known.size}</span>
            <span className="text-sm text-muted">of {totalWords}</span>
          </div>
          <div className="mt-2.5 flex flex-col gap-1.5">
            {modulesOrdered
              .filter((m) => m.wordIds.length > 0)
              .map((m) => {
                const p = moduleProgress(m, known);
                return (
                  <div key={m.id} className="flex items-center gap-2.5">
                    <span className="w-40 truncate text-xs text-muted">
                      {m.title}
                    </span>
                    <Bar pct={p.total ? (p.done / p.total) * 100 : 0} />
                    <span className="w-12 text-right text-xs font-semibold">
                      {p.done}/{p.total}
                    </span>
                  </div>
                );
              })}
          </div>
        </Panel>

        {/* Review queue (Phase A.2) */}
        <Panel label="Review queue">
          {cards.length === 0 ? (
            <p className="text-[13px] text-muted">
              Nothing scheduled yet — every item you drill enters the spaced
              queue automatically.
            </p>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex gap-6">
                <div>
                  <div className="text-3xl font-bold">{due.length}</div>
                  <div className="text-xs text-muted">due now</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{cards.length}</div>
                  <div className="text-xs text-muted">items scheduled</div>
                </div>
              </div>
              {due.length > 0 && (
                <Link
                  to="/review/session"
                  className="rounded-full bg-teal px-4 py-2 text-sm font-bold text-on-accent transition-opacity hover:opacity-90"
                >
                  Start review
                </Link>
              )}
            </div>
          )}
        </Panel>

        {/* Accuracy */}
        <Panel label="Drill accuracy">
          {overall.seen === 0 ? (
            <p className="text-[13px] text-muted">
              No drill answers yet — run any drill and this fills in.
            </p>
          ) : (
            <div className="flex gap-6">
              <div>
                <div className="text-3xl font-bold">{overall.pct}%</div>
                <div className="text-xs text-muted">
                  all time · {overall.correct}/{overall.seen}
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold">
                  {week.seen ? `${week.pct}%` : "—"}
                </div>
                <div className="text-xs text-muted">
                  last 7 days{week.seen ? ` · ${week.correct}/${week.seen}` : ""}
                </div>
              </div>
            </div>
          )}
        </Panel>

        {/* Confusable groups */}
        {groups.length > 0 && (
          <Panel label="Confusable groups">
            <div className="flex flex-col gap-2">
              {groups.map((g) => (
                <div key={g.group} className="flex items-center gap-2.5">
                  <span className="w-40 truncate text-xs text-muted">
                    {GROUP_LABELS[g.group] ?? g.group}
                  </span>
                  <Bar pct={g.pct} />
                  <span className="w-12 text-right text-xs font-semibold">
                    {g.pct}%
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {/* Weakest items */}
        {weakest.length > 0 && (
          <Panel label="Weakest items (3+ attempts)">
            <div className="flex flex-wrap gap-2">
              {weakest.map((w) => {
                const l = labelFor(w.kind, w.itemId, gapPool.byId);
                return (
                  <div
                    key={`${w.kind}:${w.itemId}`}
                    className="flex items-baseline gap-1.5 rounded-lg border border-line bg-paper px-2.5 py-1.5"
                  >
                    <span className="font-korean text-lg leading-none">
                      {l.big}
                    </span>
                    <span className="text-xs text-muted">
                      {l.small} · {w.pct}%
                    </span>
                  </div>
                );
              })}
            </div>
            <Link
              to="/review"
              className="mt-3 inline-block text-xs font-semibold text-teal underline underline-offset-2"
            >
              Go to Review →
            </Link>
          </Panel>
        )}

        {/* Font fluency */}
        <Panel label="Font fluency">
          {faces.length === 0 ? (
            <p className="text-[13px] leading-relaxed text-muted">
              No cross-font data yet — turn on “Mixed fonts” in the confusables
              or gap quiz and non-Gothic answers land here.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {faces.map((f) => (
                <div key={f.face} className="flex items-center gap-2.5">
                  <span className="w-40 truncate text-xs text-muted">
                    {f.face}
                  </span>
                  <Bar pct={f.pct} />
                  <span className="w-12 text-right text-xs font-semibold">
                    {f.pct}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
