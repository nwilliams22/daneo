import { useState } from "react";
import { progressCounts } from "../../db/repo";
import { resetAllProgress } from "./resetProgress";
import { exportBackupFile, type BackupStatus } from "./exportBackup";
import type { ProgressCounts } from "../../types";

type Step = "idle" | "opening" | "confirm" | "working" | "failed";

const EMPTY: ProgressCounts = {
  knownWords: 0,
  drillResults: 0,
  srsCards: 0,
  moduleTests: 0,
  savedTranslations: 0,
};

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

/** What the learner is about to lose, in their own terms. */
function lossList(c: ProgressCounts): string[] {
  return [
    plural(c.knownWords, "known word", "known words"),
    plural(c.drillResults, "drill answer", "drill answers"),
    plural(c.srsCards, "review card", "review cards"),
    plural(c.moduleTests, "module test score", "module test scores"),
    plural(c.savedTranslations, "saved discovery", "saved discoveries"),
  ];
}

/** Settings → Reset all progress. Two deliberate steps: the first opens this
 *  panel and names what will go, the second erases it. A backup is one click
 *  away in the panel, because the wipe cannot be undone. */
export default function ResetProgress({
  reload = () => window.location.reload(),
}: {
  /** Seam for tests — the app must restart to land on onboarding. */
  reload?: () => void;
}) {
  const [step, setStep] = useState<Step>("idle");
  const [counts, setCounts] = useState<ProgressCounts>(EMPTY);
  const [backup, setBackup] = useState<BackupStatus | null>(null);
  const [exporting, setExporting] = useState(false);

  const open = async () => {
    if (step === "opening") return;
    setBackup(null);
    setStep("opening");
    // Count first, then show the panel: a confirmation that flashes "0 known
    // words" at someone about to erase 400 of them is worse than a beat of
    // nothing. An unreadable database still gets the panel, with zeros.
    try {
      setCounts(await progressCounts());
    } catch {
      setCounts(EMPTY);
    }
    setStep("confirm");
  };

  const doExport = async () => {
    if (exporting) return;
    setExporting(true);
    setBackup(await exportBackupFile());
    setExporting(false);
  };

  const doReset = async () => {
    setStep("working");
    try {
      await resetAllProgress();
    } catch {
      setStep("failed");
      return;
    }
    // Reload rather than re-render: every open live query and in-memory cache
    // in the app holds the old learner, and onboarding is what should load.
    reload();
  };

  if (step === "idle" || step === "opening" || step === "failed")
    return (
      <div className="flex items-center justify-between gap-4 px-4 py-3.5">
        <div>
          <div className="text-sm font-semibold">Reset all progress</div>
          <div className="mt-0.5 text-xs text-muted">
            Erase every word, score and review card on this device and start
            over at onboarding. Export a backup first.
          </div>
          {step === "failed" && (
            <div role="status" className="mt-1.5 text-xs font-semibold text-clay">
              Reset failed. Nothing was reloaded — try again, and keep your
              backup.
            </div>
          )}
        </div>
        <button
          onClick={() => void open()}
          disabled={step === "opening"}
          className="shrink-0 rounded-xl border border-clay px-3.5 py-2 text-[13px] font-semibold text-clay transition-colors hover:bg-clay hover:text-paper disabled:opacity-60"
        >
          Reset all progress
        </button>
      </div>
    );

  return (
    <div className="px-4 py-3.5">
      <div className="text-sm font-semibold text-clay">
        Erase all progress on this device?
      </div>
      <div className="mt-1 text-xs leading-relaxed text-muted">
        This deletes, permanently:
      </div>
      <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-xs text-muted">
        {lossList(counts).map((line) => (
          <li key={line}>{line}</li>
        ))}
        <li>
          your settings and onboarding answers — the app restarts at onboarding
        </li>
      </ul>
      <div className="mt-1.5 text-xs leading-relaxed text-muted">
        Downloaded model files are kept. There is no undo: a backup file is the
        only way back.
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2">
        <button
          onClick={() => void doExport()}
          disabled={exporting || step === "working"}
          className="rounded-xl bg-ink px-3.5 py-2 text-[13px] font-semibold text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {exporting ? "Exporting…" : "Export a backup first"}
        </button>
        <button
          onClick={() => setStep("idle")}
          disabled={step === "working"}
          className="rounded-xl border border-line px-3.5 py-2 text-[13px] font-semibold text-muted transition-colors hover:text-ink disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          onClick={() => void doReset()}
          disabled={step === "working"}
          className="rounded-xl bg-clay px-3.5 py-2 text-[13px] font-semibold text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {step === "working" ? "Erasing…" : "Erase everything"}
        </button>
      </div>
      {backup && (
        <div
          role="status"
          className={`mt-2 text-xs font-semibold ${
            backup.tone === "ok" ? "text-teal" : "text-clay"
          }`}
        >
          {backup.text}
        </div>
      )}
    </div>
  );
}
