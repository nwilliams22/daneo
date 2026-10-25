import { snapshot } from "../../db/repo";
import { getPersistedSettings } from "../../state/settings";
import { saveBackup } from "./saveBackup";
import { serializeSnapshot, snapshotFilename } from "../../lib/exportImport";

export type BackupStatus = { tone: "ok" | "error"; text: string };

/** Writes a full backup file and reports what happened in words. Shared by
 *  the Backup panel and the "export first" offer inside Reset all progress,
 *  so there is one export path to keep correct. */
export async function exportBackupFile(): Promise<BackupStatus> {
  try {
    const snap = await snapshot(getPersistedSettings());
    const result = await saveBackup(
      serializeSnapshot(snap),
      snapshotFilename(),
    );
    return {
      tone: "ok",
      text:
        result.kind === "saved"
          ? `Saved ${result.path}.`
          : result.kind === "cancelled"
            ? "Export cancelled. No backup was saved."
            : "Download requested. Check your browser's downloads for the backup file.",
    };
  } catch {
    return {
      tone: "error",
      text: "Export failed. The backup was not completed — try again or use Copy JSON.",
    };
  }
}
