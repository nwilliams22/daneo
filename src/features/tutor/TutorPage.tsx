import { useEffect, useRef, useState } from "react";
import PageHeader from "../../components/PageHeader";
import { askLocalTutor } from "./local-tutor";
import { readTutorContext, type TutorReply } from "./tutor";
import TutorAnswer from "./TutorAnswer";

export default function TutorPage() {
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState<TutorReply | null>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef<AbortController | null>(null);

  useEffect(() => () => pending.current?.abort(), []);

  async function ask() {
    const text = question.trim();
    if (!text || pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    setReply(null);
    setError("");
    setProgress("Reading your progress…");
    try {
      const context = await readTutorContext();
      if (controller.signal.aborted) return;
      setProgress("Loading the local model…");
      const answer = await askLocalTutor(crypto.randomUUID(), text, context, controller.signal, (state) => {
        if (!controller.signal.aborted) setProgress(state === "generating" ? "Thinking locally…" : "Loading the local model…");
      });
      if (!controller.signal.aborted) setReply(answer);
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Local tutor unavailable.");
    } finally {
      if (pending.current === controller) {
        pending.current = null;
        setBusy(false);
      }
    }
  }

  function cancel() {
    pending.current?.abort();
    pending.current = null;
    setBusy(false);
    setProgress("");
  }

  return <div>
    <PageHeader eyebrow="Your learning · Local tutor" title="Ask Daneo" blurb="Ask about the words and lessons you have covered. Your progress stays on this device." />
    <form onSubmit={(event) => { event.preventDefault(); void ask(); }} className="rounded-2xl border border-line bg-panel p-4">
      <label htmlFor="tutor-question" className="mb-2 block text-xs font-semibold text-muted">Your question</label>
      <textarea id="tutor-question" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={500} rows={3} placeholder="How do the words I learned fit together?" className="w-full resize-y rounded-xl border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-teal" />
      <div className="mt-3 flex justify-end gap-2">
        {busy && <button type="button" onClick={cancel} className="rounded-full px-4 py-2 text-sm font-semibold text-clay">Cancel</button>}
        <button type="submit" disabled={busy || !question.trim()} className="rounded-full bg-teal px-4 py-2 text-sm font-bold text-on-accent disabled:opacity-40">Ask</button>
      </div>
    </form>
    {busy && <p role="status" className="mt-5 text-sm text-muted">{progress}</p>}
    {error && <p role="alert" className="mt-5 rounded-xl border border-clay/30 bg-clay/10 p-4 text-sm text-clay">{error}</p>}
    {reply && <TutorAnswer reply={reply} />}
  </div>;
}
