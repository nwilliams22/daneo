import { useEffect, useRef, useState } from "react";
import { modelDownloader, type ModelCacheOutcome, type ModelDownloadProgress, type ModelStorageDetails } from "../../lib/model-download";
import { localTranslator, type LocalSnapshot } from "../explore/local-api";

const desktop = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
const IDLE_KEY = "daneo-model-idle-seconds";
const choices = [60, 300, 900] as const;
function savedIdle(): number {
  const value = Number(localStorage.getItem(IDLE_KEY));
  return choices.find((choice) => choice === value) ?? 300;
}
function size(bytes: number): string { return `${(bytes / 1024 ** 3).toFixed(2)} GiB`; }

export default function ModelPanel() {
  const [details, setDetails] = useState<ModelStorageDetails | null>(null);
  const [cache, setCache] = useState<ModelCacheOutcome | null>(null);
  const [engine, setEngine] = useState<LocalSnapshot | null>(null);
  const [progress, setProgress] = useState<ModelDownloadProgress | null>(null);
  const [busy, setBusy] = useState<"download" | "delete" | null>(null);
  const [message, setMessage] = useState("");
  const [idle, setIdle] = useState(savedIdle);
  const downloadId = useRef<string | null>(null);
  useEffect(() => {
    if (!desktop) return;
    let active = true;
    void modelDownloader.details().then((value) => { if (active) setDetails(value); }).catch(() => { if (active) setMessage("Model storage is unavailable."); });
    void modelDownloader.setIdleSeconds(idle).catch(() => { if (active) setMessage("Could not set the idle period."); });
    void modelDownloader.state().then((value) => { if (active) setCache(value); }).catch(() => { if (active) setMessage("Could not inspect model storage."); });
    const refresh = () => {
      void localTranslator.state().then((value) => { if (active) setEngine(value); }).catch(() => {});
    };
    refresh();
    const timer = window.setInterval(refresh, 1500);
    return () => { active = false; window.clearInterval(timer); };
  }, [idle]);
  const installed = cache?.ok === true && cache.result.path !== null;
  const state = busy === "download" ? "downloading" : engine?.state === "loading" || engine?.state === "generating"
    ? "loading" : engine?.state === "error" ? "error" : installed ? "ready" : "absent";
  async function download() {
    setBusy("download"); setMessage(""); setProgress(null);
    const requestId = crypto.randomUUID();
    downloadId.current = requestId;
    const result = await modelDownloader.download(requestId, setProgress);
    downloadId.current = null;
    setCache(result); setBusy(null);
    if (!result.ok) setMessage(result.error.message);
  }
  async function remove() {
    setBusy("delete"); setMessage("");
    try {
      const result = await modelDownloader.delete();
      setCache(result);
      if (!result.ok) setMessage(result.error.message);
      else setEngine(await localTranslator.state());
    } catch { setMessage("Could not delete the model."); }
    setBusy(null);
  }
  function changeIdle(seconds: number) {
    localStorage.setItem(IDLE_KEY, String(seconds));
    setIdle(seconds);
  }
  return (
    <section className="mt-4 rounded-2xl border border-line bg-panel p-4" aria-label="Local model">
      <h2 className="text-sm font-semibold">Local model</h2>
      <p className="mt-1 text-xs text-muted">The translator runs on this device. Its model unloads from memory after the idle period.</p>
      <dl className="mt-4 grid gap-2 text-xs sm:grid-cols-[7rem_1fr]">
        <dt className="text-muted">Engine</dt><dd className="font-semibold capitalize">{desktop ? state : "Desktop app required"}{engine?.resident && " · in memory"}</dd>
        <dt className="text-muted">Model</dt><dd>{details?.pin?.filename ?? "No production model selected"}</dd>
        <dt className="text-muted">Disk use</dt><dd>{installed && details?.pin ? size(details.pin.bytes) : "0 GiB"}</dd>
        <dt className="text-muted">Storage</dt><dd className="break-all">{details?.directory ?? "—"}</dd>
        <dt className="text-muted">Verified SHA-256</dt><dd className="break-all font-mono">{installed ? details?.pin?.sha256 : "—"}</dd>
      </dl>
      {progress && busy === "download" && <p className="mt-3 text-xs" role="status">Downloading {size(progress.bytes)} of {size(progress.total)}</p>}
      {message && <p className="mt-3 text-xs text-clay" role="alert">{message}</p>}
      {cache?.ok === false && details?.pin && <p className="mt-3 text-xs text-clay" role="alert">{cache.error.message}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => void download()} disabled={!desktop || !details?.pin || !!busy || installed}
          className="rounded-xl bg-ink px-3.5 py-2 text-[13px] font-semibold text-paper disabled:opacity-40">Download model</button>
        {busy === "download" && <button type="button" onClick={() => { if (downloadId.current) void modelDownloader.cancel(downloadId.current); }} className="rounded-xl border border-line px-3.5 py-2 text-[13px] font-semibold">Cancel</button>}
        <button type="button" onClick={() => void remove()} disabled={!desktop || !installed || !!busy}
          className="rounded-xl border border-line px-3.5 py-2 text-[13px] font-semibold disabled:opacity-40">Delete model</button>
        <label className="ml-auto flex items-center gap-2 text-xs text-muted">Unload after
          <select value={idle} onChange={(event) => changeIdle(Number(event.target.value))} className="rounded-lg border border-line bg-paper px-2 py-1.5 text-ink">
            <option value={60}>1 minute</option><option value={300}>5 minutes</option><option value={900}>15 minutes</option>
          </select>
        </label>
      </div>
    </section>
  );
}
