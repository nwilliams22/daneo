import { useEffect, useRef, useState } from "react";
import { saveTranslation } from "../../db/repo";
import TranslationError from "./TranslationError";
import PageHeader from "../../components/PageHeader";
import AudioButton from "../../components/AudioButton";
import Rom from "../../components/Rom";
import { translate, type TranslateError } from "./api";
import { localTranslator, type LocalState } from "./local-api";
import type { Role, TranslationResult } from "../../types";

import SavedDeck from "./SavedDeck";

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

const ROLE_TEXT: Record<Role, string> = {
  subject: "text-teal border-teal",
  object: "text-clay border-clay",
  place: "text-gold border-gold",
  verb: "text-ink border-ink",
  other: "text-ink border-line",
};

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4">
      <div className="mb-1.5 text-[10px] tracking-[0.15em] text-muted uppercase">
        {label}
      </div>
      {children}
    </div>
  );
}

function ResultCard({
  result,
  onSaved,
  savedId,
}: {
  result: TranslationResult;
  onSaved: (id: number) => void;
  savedId: number | null;
}) {
  const hasGap = result.literal_gap.trim().length > 0;

  return (
    <div className="mt-4 rounded-2xl border border-line bg-panel px-5 py-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 font-korean text-[26px] leading-snug font-semibold">
            {result.korean}
            <AudioButton text={result.korean} />
          </div>
          <Rom text={result.romanization} className="mt-0.5 block" />
        </div>
        <button
          onClick={async () => {
            if (savedId !== null) return;
            const id = await saveTranslation(result);
            onSaved(Number(id));
          }}
          disabled={savedId !== null}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-opacity ${
            savedId !== null
              ? "bg-teal/20 text-teal"
              : "bg-ink text-paper hover:opacity-90"
          }`}
        >
          {savedId !== null ? "Saved ✓" : "Save to deck"}
        </button>
      </div>

      <div className="mt-3 text-[15.5px] font-semibold">
        “{result.natural_english}”
      </div>

      {result.gloss.length > 0 && (
        <Section label="English, in Korean order">
          <div className="flex flex-wrap gap-1.5">
            {result.gloss.map((g, i) => (
              <span
                key={i}
                title={g.chunk}
                className={`inline-flex items-baseline gap-1.5 rounded-lg border-[1.5px] bg-paper px-2.5 py-1 text-sm font-semibold ${ROLE_TEXT[g.role]}`}
              >
                {g.gloss}
                <span className="font-korean text-xs font-normal text-muted">
                  {g.chunk}
                </span>
              </span>
            ))}
          </div>
        </Section>
      )}

      {result.particles.length > 0 && (
        <Section label="What the particles are doing">
          <div className="flex flex-col gap-1.5">
            {result.particles.map((p, i) => (
              <div key={i} className="flex items-baseline gap-2.5">
                <span className="min-w-9 shrink-0 font-korean text-[15px] font-bold text-teal">
                  {p.particle}
                </span>
                <span className="text-[13px] leading-relaxed text-muted">
                  {p.job}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {hasGap && (
        <Section label="Literal vs. real">
          <div className="border-l-[3px] border-clay pl-3 text-[13.5px] leading-relaxed">
            {result.literal_gap}
          </div>
        </Section>
      )}

      {result.cultural_note.trim().length > 0 && (
        <Section label="Cultural note">
          <div className="border-l-[3px] border-gold pl-3 text-[13.5px] leading-relaxed">
            {result.cultural_note}
          </div>
        </Section>
      )}

      {savedId !== null && hasGap && (
        <p className="mt-4 text-center text-[11.5px] text-muted">
          Saved — and because it has a literal-vs-real gap, it's now in the Gap
          deck and the review schedule.
        </p>
      )}
    </div>
  );
}

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
