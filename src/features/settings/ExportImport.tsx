import { useRef, useState } from "react";
import { snapshot, restore } from "../../db/repo";
import { useSettings, getPersistedSettings } from "../../state/settings";
import { saveBackup } from "./saveBackup";
import {
  serializeSnapshot,
  parseSnapshot,
  snapshotFilename,
} from "../../lib/exportImport";

type Status = { tone: "ok" | "error"; text: string } | null;

/** Backup/restore of all learner state on this device. */
export default function ExportImport() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>(null);
  const [exporting, setExporting] = useState(false);
  const restoreSettings = useSettings((s) => s.restoreSettings);

  const doExport = async () => {
    if (exporting) return;
    setExporting(true);
    setStatus(null);
    try {
      const snap = await snapshot(getPersistedSettings());
      const result = await saveBackup(serializeSnapshot(snap), snapshotFilename());
      setStatus({
        tone: "ok",
        text: result.kind === "saved" ? `Saved ${result.path}.`
          : result.kind === "cancelled" ? "Export cancelled. No backup was saved."
          : "Download requested. Check your browser's downloads for the backup file.",
      });
    } catch {
      setStatus({ tone: "error", text: "Export failed. The backup was not completed — try again or use Copy JSON." });
    } finally {
      setExporting(false);
    }
  };

  const doCopy = async () => {
    const snap = await snapshot(getPersistedSettings());
    await navigator.clipboard.writeText(serializeSnapshot(snap));
    setStatus({ tone: "ok", text: "Backup JSON copied to clipboard." });
  };

  const doImport = async (file: File) => {
    const parsed = parseSnapshot(await file.text());
    if (!parsed.ok) {
      setStatus({ tone: "error", text: parsed.error });
      return;
    }
    const t = parsed.snapshot.tables;
    const summary = `${t.knownWords.length} known words and ${t.drillResults.length} drill results from ${new Date(parsed.snapshot.exportedAt).toLocaleDateString()}`;
    if (
      !window.confirm(
        `Replace ALL current progress with this backup?\n\nIt contains ${summary}. This cannot be undone.`,
      )
    )
      return;
    await restore(parsed.snapshot);
    restoreSettings(parsed.snapshot.settings);
    setStatus({ tone: "ok", text: `Restored ${summary}.` });
  };

  return (
    <div className="px-4 py-3.5">
      <div className="text-sm font-semibold">Backup</div>
      <div className="mt-0.5 text-xs leading-relaxed text-muted">
        Your progress lives only on this device. Export a backup file before
        clearing app data or moving machines.
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2">
        <button
          onClick={doExport}
          disabled={exporting}
          className="rounded-xl bg-ink px-3.5 py-2 text-[13px] font-semibold text-paper transition-opacity hover:opacity-90"
        >
          {exporting ? "Exporting…" : "Export file"}
        </button>
        <button
          onClick={doCopy}
          className="rounded-xl border border-line px-3.5 py-2 text-[13px] font-semibold text-muted transition-colors hover:text-ink"
        >
          Copy JSON
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="rounded-xl border border-line px-3.5 py-2 text-[13px] font-semibold text-muted transition-colors hover:text-ink"
        >
          Import…
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void doImport(f);
            e.target.value = "";
          }}
        />
      </div>
      {status && (
        <div
          role="status"
          className={`mt-2 text-xs font-semibold ${
            status.tone === "ok" ? "text-teal" : "text-clay"
          }`}
        >
          {status.text}
        </div>
      )}
    </div>
  );
}
