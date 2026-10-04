import { Link } from "react-router";
import type { TutorReply } from "./tutor";

export default function TutorAnswer({ reply }: { reply: TutorReply }) {
  return <section className="mt-5 rounded-2xl border border-line bg-panel p-5" aria-label="Tutor answer">
    <p className="text-[11px] font-semibold tracking-[0.15em] text-muted uppercase">Local explanation · Check the lessons</p>
    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{reply.answer}</p>
    {reply.examples.length > 0 && <div className="mt-5 border-t border-line pt-4">
      <p className="mb-2 text-xs font-semibold text-muted">Examples from your unlocked lessons</p>
      {reply.examples.map((sentence) => <div key={sentence.id} className="mb-2 rounded-xl bg-paper p-3">
        <p className="font-korean text-lg">{sentence.ko.map((chunk) => chunk.t).join(" ")}</p>
        <p className="text-sm text-muted">{sentence.en.map((chunk) => chunk.t).join(" ")}</p>
      </div>)}
    </div>}
    <p className="mt-4 text-xs text-muted">The local model can make mistakes. <Link to="/learn" className="font-semibold text-teal underline">Check the curriculum</Link> for the taught form.</p>
  </section>;
}
