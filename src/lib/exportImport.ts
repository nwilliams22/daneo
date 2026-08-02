import { exportSnapshotSchema } from "./schemas";
import type { ExportSnapshot } from "../types";

// Pure halves of backup/restore — the Dexie IO lives in db/repo.ts.

export function snapshotFilename(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `daneo-backup-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
}

export function serializeSnapshot(snap: ExportSnapshot): string {
  return JSON.stringify(snap, null, 2);
}

export type ParseResult =
  | { ok: true; snapshot: ExportSnapshot }
  | { ok: false; error: string };

export function parseSnapshot(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file isn't valid JSON." };
  }
  const parsed = exportSnapshotSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      ok: false,
      error: `That doesn't look like a Daneo backup${
        first ? ` (${first.path.join(".")}: ${first.message})` : ""
      }.`,
    };
  }
  return { ok: true, snapshot: parsed.data as ExportSnapshot };
}
