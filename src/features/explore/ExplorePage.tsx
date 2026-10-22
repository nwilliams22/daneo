import { lazy, Suspense, useState } from "react";
import PageHeader from "../../components/PageHeader";
import SavedDeck from "./SavedDeck";
import ResultCard from "./ResultCard";
import { translateCourse } from "./course-api";
import type { TranslateOutcome } from "./translation-contract";

// Vite replaces DEV at build time. Production never imports the AI surface,
// irrespective of saved settings or the model pin.
const TranslatorPage = import.meta.env.DEV
  ? lazy(() => import("./TranslatorPage"))
  : null;

const EXAMPLES = ["저는 물을 마셔요", "친구가 학교에 가요"];

export default function ExplorePage() {
  const [modelDev, setModelDev] = useState(false);
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [outcome, setOutcome] = useState<TranslateOutcome | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);

  function run(text: string) {
    if (!text.trim()) return;
    setSubmitted(text);
    setSavedId(null);
    setOutcome(translateCourse(text));
  }

  return (
    <div>
      {TranslatorPage && (
        <button type="button" onClick={() => setModelDev(!modelDev)}
          className="mb-4 text-xs text-muted underline">
          {modelDev ? "Back to course translator" : "Model translator · development only"}
        </button>
      )}
      {modelDev && TranslatorPage ? <Suspense fallback={null}><TranslatorPage /></Suspense> : <>
        <PageHeader eyebrow="한국어 · Explore" title="Course translator"
          blurb="Explore Korean sentences from the lessons, with English meaning, Korean-order gloss and reviewed notes. Works offline — no AI, download, key or account." />
        <p id="course-scope" className="mb-4 text-sm leading-relaxed text-muted">
          Exact course sentences only, including spacing and punctuation. New combinations,
          words outside the course and English input are not supported. Try an example to start.
        </p>
        <form onSubmit={event => { event.preventDefault(); run(input); }}
          className="flex gap-2 rounded-2xl border border-line bg-panel p-1.5">
          <input aria-label="Korean course sentence" aria-describedby="course-scope"
            value={input} onChange={event => { setInput(event.target.value); setOutcome(null); }}
            placeholder="Copy a Korean sentence from a lesson"
            className="min-w-0 flex-1 bg-transparent px-2.5 py-2 text-[15px] outline-none placeholder:text-muted" />
          <button disabled={!input.trim()} className="rounded-xl bg-teal px-4 py-2 text-sm font-bold text-on-accent disabled:opacity-35">
            Break it down
          </button>
        </form>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {EXAMPLES.map(example => <button key={example} type="button"
            onClick={() => { setInput(example); run(example); }}
            className="rounded-full border border-line px-2.5 py-1.5 font-korean text-sm text-muted hover:text-ink">
            {example}
          </button>)}
        </div>
        {outcome && (outcome.ok
          ? <ResultCard result={outcome.result} savedId={savedId} onSaved={setSavedId} />
          : <section role="status" className="mt-4 rounded-2xl border border-gold bg-panel p-5">
              <h2 className="font-semibold">No reviewed translation</h2>
              <p className="mt-2 text-sm text-muted">Could not resolve this sentence:</p>
              <p className="mt-1 whitespace-pre-wrap break-words font-korean text-lg">{submitted}</p>
              <p className="mt-3 text-sm leading-relaxed">{outcome.error.message}</p>
            </section>)}
        <SavedDeck />
      </>}
    </div>
  );
}
