import { sentenceById } from "../../content";
import type { Module, Sentence, Role } from "../../types";
import { useKnownWords } from "../../db/useKnownWords";
import { moduleProgress, isModuleComplete } from "../../lib/gating";
import AudioButton from "../../components/AudioButton";
import Rom from "../../components/Rom";

const ROLE_TEXT: Record<Role, string> = {
  subject: "text-subject",
  object: "text-object",
  place: "text-place",
  verb: "text-verb font-bold",
  other: "text-ink",
};

function SentenceCard({ sentence }: { sentence: Sentence }) {
  const koText = sentence.ko
    .map((c) => c.t)
    .filter(Boolean)
    .join(" ");
  const enText = sentence.en
    .map((c) => c.t)
    .filter(Boolean)
    .join(" ");
  return (
    <div className="rounded-xl border border-line bg-paper px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="font-korean text-[21px] leading-snug">
          {sentence.ko
            .filter((c) => c.t)
            .map((c, i) => (
              <span key={i} className={ROLE_TEXT[c.role]}>
                {c.t}
                {i < sentence.ko.filter((x) => x.t).length - 1 ? " " : ""}
              </span>
            ))}
        </div>
        <AudioButton text={koText} className="mt-0.5" />
      </div>
      {sentence.rom && <Rom text={sentence.rom} className="mt-0.5 block" />}
      <div className="mt-1.5 text-sm font-semibold">{enText}</div>
      <div className="mt-1 text-[13px] leading-relaxed text-muted">
        {sentence.note}
      </div>
    </div>
  );
}

export default function SentenceList({ module }: { module: Module }) {
  const known = useKnownWords();
  if (!known) return null;

  const complete = isModuleComplete(module, known);
  const sentences = module.sentenceIds
    .map((id) => sentenceById.get(id))
    .filter((s): s is Sentence => s !== undefined);

  if (!complete) {
    const p = moduleProgress(module, known);
    return (
      <div className="my-4 rounded-2xl border border-dashed border-line bg-panel px-5 py-6 text-center">
        <div className="text-sm font-semibold text-muted">
          {sentences.length} sentences are waiting.
        </div>
        <p className="mx-auto mt-1 max-w-xs text-[13px] leading-relaxed text-muted">
          Finish the vocabulary checklist above to unlock them — every sentence
          is built only from words you've marked as learned ({p.done}/{p.total}
          &nbsp;so far).
        </p>
      </div>
    );
  }

  return (
    <div className="my-4 flex flex-col gap-2.5">
      {sentences.map((s) => (
        <SentenceCard key={s.id} sentence={s} />
      ))}
    </div>
  );
}
