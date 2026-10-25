import { useLiveQuery } from "dexie-react-hooks";
import { wordById } from "../../content";
import { db } from "../../db/db";
import type { Module, Word } from "../../types";
import { useKnownWords } from "../../db/useKnownWords";
import { markWordKnown, unmarkWordKnown } from "../../db/repo";
import { missedWordIds } from "../../lib/testMisses";
import AudioButton from "../../components/AudioButton";
import Rom from "../../components/Rom";

const GROUPS: { pos: Word["pos"][]; label: string }[] = [
  { pos: ["noun", "pronoun"], label: "Nouns & pronouns" },
  { pos: ["determiner"], label: "Determiners" },
  { pos: ["verb"], label: "Verbs" },
  { pos: ["adj"], label: "Describing words" },
  { pos: ["adverb"], label: "Adverbs" },
  { pos: ["connective"], label: "Connectives" },
  { pos: ["phrase"], label: "Survival phrases" },
];

export default function VocabChecklist({ module }: { module: Module }) {
  const known = useKnownWords();
  // Words the last module test caught (2026-10-25). They keep their tick —
  // un-ticking would re-lock the module's sentences and drills (lib/gating) —
  // and carry a "practice" flag instead: checked means studied, not proven.
  const missed = useLiveQuery(
    async () => missedWordIds((await db.moduleTests.get(module.id))?.misses),
    [module.id],
    new Set<string>(),
  );
  const words = module.wordIds
    .map((id) => wordById.get(id))
    .filter((w): w is Word => w !== undefined);

  if (!known) return null;
  const done = words.filter((w) => known.has(w.id)).length;
  const complete = done === words.length;
  const needPractice = words.filter((w) => missed.has(w.id)).length;

  return (
    <div className="my-4 rounded-panel bg-card shadow-panel p-4">
      <div className="mb-3 flex items-baseline justify-between px-1">
        <div className="text-[11px] font-semibold tracking-[0.2em] text-muted uppercase">
          Vocabulary checklist
        </div>
        <div
          className={`text-sm font-bold ${complete ? "text-jade" : "text-muted"}`}
        >
          {done}/{words.length}
        </div>
      </div>

      {needPractice > 0 && (
        <p className="mb-3 px-1 text-[12.5px] leading-relaxed text-muted">
          <b className="text-clay">{needPractice}</b> of these came back wrong
          on your last module test. A tick means you have studied the word —
          the <span className="font-semibold text-clay">practice</span> flag is
          what the test caught.
        </p>
      )}

      {GROUPS.map((g) => {
        const groupWords = words.filter((w) => g.pos.includes(w.pos));
        if (groupWords.length === 0) return null;
        return (
          <div key={g.label} className="mb-3 last:mb-0">
            <div className="mb-1.5 px-1 text-xs font-semibold text-muted">
              {g.label}
            </div>
            <div className="overflow-hidden rounded-xl bg-paper">
              {groupWords.map((w) => {
                const isKnown = known.has(w.id);
                return (
                  <button
                    key={w.id}
                    onClick={() =>
                      isKnown ? unmarkWordKnown(w.id) : markWordKnown(w.id)
                    }
                    className={`flex w-full items-center gap-3 border-b border-line px-3 py-2 text-left transition-colors last:border-b-0 ${
                      isKnown ? "bg-fill" : "bg-transparent hover:bg-fill"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold transition-colors ${
                        isKnown
                          ? "border-jade bg-jade text-on-accent"
                          : "border-line text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                    <span className="font-korean text-lg leading-tight font-medium">
                      {w.ko}
                    </span>
                    <Rom text={w.rom} />
                    {missed.has(w.id) && (
                      <span className="rounded-full border border-clay/60 px-1.5 py-0.5 text-[10px] font-bold tracking-[0.08em] text-clay uppercase">
                        practice
                      </span>
                    )}
                    <span className="ml-auto pl-2 text-right text-[13px] text-muted">
                      {w.en}
                    </span>
                    <AudioButton text={w.ko} />
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {complete && (
        <div className="mt-3 rounded-xl border-t border-jade/40 px-3 pt-2.5 text-center text-[13px] font-semibold text-jade">
          All words checked — this module's sentences and drills are unlocked.
        </div>
      )}
    </div>
  );
}
