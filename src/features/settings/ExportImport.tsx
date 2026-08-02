import { useRef, useState } from "react";
import { snapshot, restore } from "../../db/repo";
import { useSettings, getPersistedSettings } from "../../state/settings";
import {
  serializeSnapshot,
  parseSnapshot,
  snapshotFilename,
} from "../../lib/exportImport";

type Status = { tone: "ok" | "error"; text: string } | null;

/** Backup/restore of all learner state. Everything lives in this device's
 *  IndexedDB — until Phase B sync exists, this file IS the safety net. */
export default function ExportImport() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>(null);
  const restoreSettings = useSettings((s) => s.restoreSettings);

  const doExport = async () => {
    const snap = await snapshot(getPersistedSettings());
    const text = serializeSnapshot(snap);
    try {
      const blob = new Blob([text], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = snapshotFilename();
      a.click();
      URL.revokeObjectURL(url);
      setStatus({ tone: "ok", text: `Saved ${snapshotFilename()}.` });
    } catch {
      setStatus({ tone: "error", text: "Download failed — try Copy instead." });
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
          className="rounded-xl bg-ink px-3.5 py-2 text-[13px] font-semibold text-paper transition-opacity hover:opacity-90"
        >
          Export file
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
