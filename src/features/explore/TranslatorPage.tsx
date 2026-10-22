import { useEffect, useRef, useState } from "react";
import TranslationError from "./TranslationError";
import PageHeader from "../../components/PageHeader";
import { translate, type TranslateError } from "./api";
import { localTranslator, type LocalState } from "./local-api";
import type { TranslationResult } from "../../types";

import SavedDeck from "./SavedDeck";
import ResultCard from "./ResultCard";

// Port of korean-curiosity-translator.jsx (PROJECT.md §2) plus the
// save-to-deck loop (§5): any result can be saved; results with a
// literal_gap file into the Gap deck automatically (src/lib/discovered.ts).

const EXAMPLES = [
  "I miss my friend",
  "수고하셨습니다",
  "Have you eaten?",
  "I'm going home now",
  "눈치가 빨라요",
  "This soup hits the spot",
];

export default function TranslatorPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [engine, setEngine] = useState<"local" | "cloud">("local");
  const [localState, setLocalState] = useState<LocalState>("absent");
  const [error, setError] = useState<TranslateError | null>(null);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);
  const request = useRef<string | null>(null);
  const generation = useRef(0);

  useEffect(() => {
    let active = true;
    void localTranslator.state().then((snapshot) => {
      if (active) setLocalState(snapshot.state);
    }).catch(() => {
      if (active) setLocalState("error");
    });
    return () => { active = false; };
  }, []);

  const cancel = () => {
    generation.current += 1;
    if (request.current) void localTranslator.cancel(request.current);
    request.current = null;
    setLoading(false);
    setLocalState("ready");
    setError(null);
  };

  const chooseEngine = (next: "local" | "cloud") => {
    if (next === engine) return;
    if (loading) cancel();
    setEngine(next);
    setResult(null);
    setError(null);
    setSavedId(null);
  };

  const run = async (text?: string) => {
    const query = (text ?? input).trim();
    if (!query || loading) return;
    const current = ++generation.current;
    setLoading(true);
    setError(null);
    setResult(null);
    setSavedId(null);
    const useCloud = import.meta.env.DEV && engine === "cloud";
    const id = crypto.randomUUID();
    if (!useCloud) {
      request.current = id;
      setLocalState("loading");
    }
    const outcome = useCloud
      ? await translate(query)
      : await localTranslator.translate({ requestId: id, input: query }, (progress) => {
          if (generation.current === current) setLocalState(progress.state);
        });
    if (generation.current !== current) return;
    request.current = null;
    if (!useCloud) setLocalState(outcome.ok ? "ready" : outcome.error.code === "model-missing" || outcome.error.code === "desktop-required" ? "absent" : "error");
    if (outcome.ok) setResult(outcome.result);
    else setError(outcome.error);
    setLoading(false);
  };

  return (
    <div>
      <PageHeader
        eyebrow="한국어 · Curiosity translator"
        title="Ask It Anything"
        blurb="Type English or Korean. You get more than a translation — the Korean-order gloss, what each particle is doing, and where the literal meaning and the real meaning part ways."
      />

      {import.meta.env.DEV && (
        <div className="mb-4 flex items-center gap-2 text-xs text-muted" aria-label="Translator engine">
          <span>Engine</span>
          <div className="flex rounded-full border border-line bg-panel p-1">
            {(["local", "cloud"] as const).map((option) => (
              <button key={option} type="button" onClick={() => chooseEngine(option)}
                aria-pressed={engine === option}
                className={`rounded-full px-3 py-1 font-semibold ${engine === option ? "bg-ink text-paper" : "text-muted hover:text-ink"}`}>
                {option === "local" ? "Local" : "Cloud · dev"}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 rounded-2xl border border-line bg-panel p-1.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="e.g. “I miss my friend” or 수고하셨습니다"
          className="flex-1 bg-transparent px-2.5 py-2 text-[15px] outline-none placeholder:text-muted"
        />
        <button
          onClick={() => run()}
          disabled={loading || !input.trim()}
          className={`rounded-xl px-4 py-2 text-sm font-bold text-on-accent transition-opacity ${
            loading || !input.trim() ? "bg-teal/35" : "bg-teal hover:opacity-90"
          }`}
        >
          {loading ? "…" : "Break it down"}
        </button>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => {
              setInput(ex);
              run(ex);
            }}
            className={`rounded-full border border-line px-2.5 py-1.5 text-[12.5px] text-muted transition-colors hover:text-ink ${
              /[가-힣]/.test(ex) ? "font-korean" : ""
            }`}
          >
            {ex}
          </button>
        ))}
      </div>

      {loading && (
        <div className="mt-5 text-center text-[13.5px] text-muted" role="status">
          {engine === "local" ? localState === "generating" ? "Generating locally…" : "Loading the local model…" : "Consulting the language brain…"}
          {engine === "local" && <button type="button" onClick={cancel} className="ml-3 font-semibold text-clay underline underline-offset-2">Cancel</button>}
        </div>
      )}

      {error && (
        <TranslationError error={error} />
      )}

      {result && (
        <ResultCard result={result} savedId={savedId} onSaved={setSavedId} />
      )}

      {!result && !loading && !error && (
        <p className="mt-6 text-center text-xs leading-relaxed text-muted">
          The lessons give you the patterns — this is where your curiosity
          fills in everything else. {import.meta.env.DEV && engine === "cloud" ? <>Needs the developer server: <code className="rounded bg-panel px-1 py-0.5">npm run server</code></> : typeof window !== "undefined" && !("__TAURI_INTERNALS__" in window) ? <>Local needs the desktop app. Start it with <code className="rounded bg-panel px-1 py-0.5">npm run tauri dev</code>.</> : "The local model runs in the desktop app."}
        </p>
      )}

      <SavedDeck />
    </div>
  );
}
