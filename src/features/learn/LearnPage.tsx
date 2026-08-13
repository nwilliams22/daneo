import { Link } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import PageHeader from "../../components/PageHeader";
import { modulesOrdered } from "../../content";
import { db } from "../../db/db";
import { useKnownWords } from "../../db/useKnownWords";
import { moduleProgress, isModuleComplete } from "../../lib/gating";
import { PASS_PCT } from "../../lib/moduleTest";

// Ring section headers (CURRICULUM.md §1). Dividers render only once the
// list actually spans more than one ring, so Ring 1 never wears a lone label.
const RING_META: Record<number, { label: string; blurb: string }> = {
  1: {
    label: "Ring 1 · Beginner",
    blurb: "The full grammar engine and your first ~1,000 words.",
  },
  2: {
    label: "Ring 2 · Intermediate",
    blurb: "Quoting, passives, and the NIKL grade-B vocabulary — ~1,700 words deeper.",
  },
  3: {
    label: "Ring 3 · Advanced",
    blurb: "The rest of the list — full learner-list coverage.",
  },
};

// Vocab modules and readings number themselves separately, so "Module N"
// always matches the numbers the course prose refers to — interludes can
// never shift them (Nick, 2026-08-02).
const LABELS: Record<string, string> = (() => {
  let moduleN = 0;
  let readingN = 0;
  return Object.fromEntries(
    modulesOrdered.map((m) => [
      m.id,
      // Appendices (ids s1, s2, …) sit outside the numbered course —
      // CURRICULUM.md's "living content" shelf.
      m.id.startsWith("s")
        ? `Appendix ${m.id.toUpperCase()}`
        : m.wordIds.length === 0
          ? `Reading ${++readingN}`
          : `Module ${++moduleN}`,
    ]),
  );
})();

const multiRing =
  new Set(modulesOrdered.map((m) => m.ring ?? 1)).size > 1;

export default function LearnPage() {
  const known = useKnownWords();
  const tests = useLiveQuery(async () => {
    const rows = await db.moduleTests.toArray();
    return new Map(rows.map((r) => [r.moduleId, r]));
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="한국어 · Learn"
        title="Modules"
        blurb="Words first, then the glue, then sentences built only from words you know."
      />
      <div className="flex flex-col gap-3">
        {modulesOrdered.map((m, i) => {
          const progress = known ? moduleProgress(m, known) : undefined;
          const complete = known ? isModuleComplete(m, known) : false;
          const isReading = m.wordIds.length === 0;
          const ring = m.ring ?? 1;
          const prevRing = i > 0 ? (modulesOrdered[i - 1].ring ?? 1) : null;
          const divider =
            multiRing && ring !== prevRing ? RING_META[ring] : undefined;
          const card = (
            <Link
              key={m.id}
              to={`/learn/${m.id}`}
              className="group rounded-2xl border border-line bg-panel px-5 py-4 transition-colors hover:border-teal"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] tracking-[0.2em] text-muted uppercase">
                    {LABELS[m.id]}
                  </div>
                  <div className="mt-1 text-[15px] font-bold">{m.title}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {!isReading &&
                    (() => {
                      const t = tests?.get(m.id);
                      return t ? (
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                            t.bestPct >= PASS_PCT
                              ? "border-teal text-teal"
                              : "border-line text-muted"
                          }`}
                          title={`Module test — best ${t.bestPct}%`}
                        >
                          {t.bestPct >= PASS_PCT ? "✓ " : ""}
                          {t.bestPct}%
                        </span>
                      ) : null;
                    })()}
                  {!isReading && progress && (
                    <div
                      className={`rounded-full border px-3 py-1 text-xs font-bold ${
                        complete
                          ? "border-teal bg-teal text-on-accent"
                          : "border-line text-muted"
                      }`}
                    >
                      {progress.done}/{progress.total}
                    </div>
                  )}
                </div>
              </div>
              {!isReading && !complete && (
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-teal transition-all"
                    style={{
                      width: progress
                        ? `${(progress.done / Math.max(1, progress.total)) * 100}%`
                        : "0%",
                    }}
                  />
                </div>
              )}
            </Link>
          );
          if (!divider) return card;
          return (
            <div key={m.id} className="contents">
              <div className={i > 0 ? "mt-3" : ""}>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold tracking-[0.25em] text-teal uppercase">
                    {divider.label}
                  </span>
                  <div className="h-px flex-1 bg-line" />
                </div>
                <p className="mt-1 text-xs text-muted">{divider.blurb}</p>
              </div>
              {card}
            </div>
          );
        })}
      </div>
    </div>
  );
}
