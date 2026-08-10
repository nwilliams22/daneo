import { Link } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import PageHeader from "../../components/PageHeader";
import { modulesOrdered } from "../../content";
import { db } from "../../db/db";
import { useKnownWords } from "../../db/useKnownWords";
import { moduleProgress, isModuleComplete } from "../../lib/gating";
import { PASS_PCT } from "../../lib/moduleTest";

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
        {modulesOrdered.map((m) => {
          const progress = known ? moduleProgress(m, known) : undefined;
          const complete = known ? isModuleComplete(m, known) : false;
          const isReading = m.wordIds.length === 0;
          return (
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
        })}
      </div>
    </div>
  );
}
