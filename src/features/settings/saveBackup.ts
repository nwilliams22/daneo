import { invoke, isTauri } from "@tauri-apps/api/core";

export type SaveResult =
  | { kind: "saved"; path: string }
  | { kind: "cancelled" }
  | { kind: "requested" };

export async function saveBackup(text: string, filename: string): Promise<SaveResult> {
  if (isTauri()) {
    const path = await invoke<string | null>("export_backup", { text, filename });
    return path === null ? { kind: "cancelled" } : { kind: "saved", path };
  }

  // Browser development has no completion signal for an anchor download.
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  try {
    anchor.click();
  } finally {
    anchor.remove();
    // Keep the Blob alive while the browser consumes the download request.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
  return { kind: "requested" };
}
