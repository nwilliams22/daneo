import { lazy, Suspense, useState } from "react";
import PageHeader from "../../components/PageHeader";
import SavedDeck from "./SavedDeck";
import ResultCard from "./ResultCard";
import LessonSentences from "./LessonSentences";
import { translateCourse } from "./course-api";
import { normalizeCourseInput } from "../../lib/course-input";
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

  // Normalize at the boundary, so an invisible space the learner cannot see
  // never decides whether a lesson sentence is found. The matcher stays exact.
  function run(text: string) {
    const normalized = normalizeCourseInput(text);
    if (!normalized) return;
    setSubmitted(normalized);
    setSavedId(null);
    setOutcome(translateCourse(normalized));
  }

  return (
    <div>
      {TranslatorPage && (
        <button type="button" onClick={() => setModelDev(!modelDev)}
          className="mb-4 text-xs text-muted underline">
          {modelDev ? "Back to the lesson breakdown" : "Model translator · development only"}
        </button>
      )}
      {modelDev && TranslatorPage ? <Suspense fallback={null}><TranslatorPage /></Suspense> : <>
        <PageHeader eyebrow="한국어 · Explore" title="Lesson sentence breakdown"
          blurb="Take a sentence the lessons teach apart: its English meaning, the gloss in Korean order, what each particle is doing, and where the literal and real meanings part ways. Works offline — no AI, download, key or account." />
        <p id="course-scope" className="mb-4 text-sm leading-relaxed text-muted">
          Sentences from the lessons only — nothing is guessed. A new combination of taught
          words, a word outside the course and English input are all refused, and a refusal
          says which word it could not find. Browse the lesson sentences below, or try an example.
        </p>
        <form onSubmit={event => { event.preventDefault(); run(input); }}
          className="flex gap-2 rounded-panel bg-panel shadow-panel p-1.5">
          <input aria-label="Korean course sentence" aria-describedby="course-scope"
            value={input} onChange={event => { setInput(event.target.value); setOutcome(null); }}
            placeholder="Type or pick a Korean sentence from a lesson"
            className="min-w-0 flex-1 bg-transparent px-2.5 py-2 text-[15px] outline-none placeholder:text-muted" />
          <button disabled={!input.trim()} className="rounded-xl bg-teal px-4 py-2 text-sm font-bold text-on-accent disabled:opacity-35">
            Break it down
          </button>
        </form>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {EXAMPLES.map(example => <button key={example} type="button"
            onClick={() => { setInput(example); run(example); }}
            className="rounded-full bg-fill px-2.5 py-1.5 font-korean text-sm text-muted hover:text-ink">
            {example}
          </button>)}
        </div>
        {outcome && (outcome.ok
          ? <ResultCard result={outcome.result} savedId={savedId} onSaved={setSavedId} />
          : <section role="status" className="mt-4 rounded-2xl border border-gold bg-panel p-5">
              <h2 className="font-semibold">
                {outcome.error.untaught?.length ? "Word not found" : "Not a lesson sentence"}
              </h2>
              {outcome.error.untaught?.length
                // Name the word, in the form it was looked up and as it was
                // typed. Echoing the whole sentence back is not a diagnosis.
                ? <div className="mt-2.5 flex flex-wrap items-baseline gap-2">
                    {outcome.error.untaught.map(({ token, word }) => (
                      <span key={token}
                        className="inline-flex items-baseline gap-1.5 rounded-lg border-[1.5px] border-clay bg-paper px-2.5 py-1 font-korean text-lg text-clay">
                        {word}
                        {word !== token && (
                          <span className="text-xs font-normal text-muted">in {token}</span>
                        )}
                      </span>
                    ))}
                  </div>
                : <p className="mt-1 whitespace-pre-wrap break-words font-korean text-lg">{submitted}</p>}
              <p className="mt-3 text-sm leading-relaxed">{outcome.error.message}</p>
            </section>)}
        <LessonSentences onPick={korean => { setInput(korean); run(korean); }} />
        <SavedDeck />
      </>}
    </div>
  );
}
