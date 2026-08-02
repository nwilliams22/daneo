import { wordById } from "../../content";
import type { Module, Word } from "../../types";
import { useKnownWords } from "../../db/useKnownWords";
import { markWordKnown, unmarkWordKnown } from "../../db/repo";
import AudioButton from "../../components/AudioButton";
import Rom from "../../components/Rom";

const GROUPS: { pos: Word["pos"][]; label: string }[] = [
  { pos: ["noun"], label: "Nouns & pronouns" },
  { pos: ["verb"], label: "Verbs" },
  { pos: ["adj"], label: "Describing words" },
  { pos: ["phrase"], label: "Survival phrases" },
];

export default function VocabChecklist({ module }: { module: Module }) {
  const known = useKnownWords();
  const words = module.wordIds
    .map((id) => wordById.get(id))
    .filter((w): w is Word => w !== undefined);

  if (!known) return null;
  const done = words.filter((w) => known.has(w.id)).length;
  const complete = done === words.length;

  return (
    <div className="my-4 rounded-2xl border border-line bg-panel p-4">
      <div className="mb-3 flex items-baseline justify-between px-1">
        <div className="text-[11px] font-semibold tracking-[0.2em] text-muted uppercase">
          Vocabulary checklist
        </div>
        <div
          className={`text-sm font-bold ${complete ? "text-teal" : "text-muted"}`}
        >
          {done}/{words.length}
        </div>
      </div>

      {GROUPS.map((g) => {
        const groupWords = words.filter((w) => g.pos.includes(w.pos));
        if (groupWords.length === 0) return null;
        return (
          <div key={g.label} className="mb-3 last:mb-0">
            <div className="mb-1.5 px-1 text-xs font-semibold text-muted">
              {g.label}
            </div>
            <div className="overflow-hidden rounded-xl border border-line">
              {groupWords.map((w) => {
                const isKnown = known.has(w.id);
                return (
                  <button
                    key={w.id}
                    onClick={() =>
                      isKnown ? unmarkWordKnown(w.id) : markWordKnown(w.id)
                    }
                    className={`flex w-full items-center gap-3 border-b border-line px-3 py-2 text-left transition-colors last:border-b-0 ${
                      isKnown ? "bg-paper" : "bg-transparent hover:bg-paper/60"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold transition-colors ${
                        isKnown
                          ? "border-teal bg-teal text-on-accent"
                          : "border-line text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                    <span className="font-korean text-lg leading-tight font-medium">
                      {w.ko}
                    </span>
                    <Rom text={w.rom} />
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
        <div className="mt-3 rounded-xl border border-teal/40 bg-teal/10 px-3 py-2 text-center text-[13px] font-semibold text-teal">
          All words checked — this module's sentences and drills are unlocked.
        </div>
      )}
    </div>
  );
}
