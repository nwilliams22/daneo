import { useMemo, useState } from "react";
import { modulesOrdered, sentenceById } from "../../content";
import { useKnownWords } from "../../db/useKnownWords";
import { sentenceSurface } from "../../lib/corpus-translator";
import Rom from "../../components/Rom";
import type { Sentence } from "../../types";

const SHOWN = 40;

type Group = { moduleId: string; title: string; sentences: Sentence[] };

/** Every lesson sentence, in lesson order, with its Korean surface. */
function allGroups(): Group[] {
  return modulesOrdered.map(module => ({
    moduleId: module.id,
    title: module.title,
    sentences: module.sentenceIds
      .map(id => sentenceById.get(id))
      .filter((sentence): sentence is Sentence => sentence !== undefined),
  })).filter(group => group.sentences.length > 0);
}

function matches(sentence: Sentence, query: string): boolean {
  if (query === "") return true;
  const haystack = [
    sentenceSurface(sentence.ko),
    sentenceSurface(sentence.en),
    sentence.rom,
  ].join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

/**
 * The browse path: which sentences this surface can break down.
 *
 * Word-first gating (PROJECT.md §1 rule 1) still holds, so the list offers
 * the sentences whose every word the learner has marked as learned, and says
 * how many are still behind the vocabulary checklists rather than pretending
 * they are not there. Picking one submits it, so a learner never has to retype
 * Korean to get a breakdown.
 */
export default function LessonSentences({ onPick }: { onPick: (korean: string) => void }) {
  const known = useKnownWords();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const groups = useMemo(allGroups, []);
  const total = useMemo(
    () => groups.reduce((count, group) => count + group.sentences.length, 0),
    [groups],
  );
  const unlocked = useMemo(() => {
    if (!known) return [];
    return groups
      .map(group => ({
        ...group,
        sentences: group.sentences.filter(sentence =>
          sentence.wordIds.every(id => known.has(id))),
      }))
      .filter(group => group.sentences.length > 0);
  }, [groups, known]);

  const unlockedCount = unlocked.reduce((count, group) => count + group.sentences.length, 0);
  const found = unlocked
    .map(group => ({ ...group, sentences: group.sentences.filter(s => matches(s, query)) }))
    .filter(group => group.sentences.length > 0);
  const foundCount = found.reduce((count, group) => count + group.sentences.length, 0);

  let shown = 0;
  const visible: Group[] = [];
  for (const group of found) {
    if (shown >= SHOWN) break;
    const sentences = group.sentences.slice(0, SHOWN - shown);
    shown += sentences.length;
    visible.push({ ...group, sentences });
  }

  return (
    <section className="mt-8">
      <button type="button" onClick={() => setOpen(!open)}
        aria-expanded={open} aria-controls="lesson-sentence-list"
        className="flex w-full items-baseline justify-between gap-2 rounded-panel bg-panel shadow-panel px-4 py-3 text-left">
        <span className="text-sm font-semibold">
          Browse the lesson sentences
        </span>
        <span className="text-[11.5px] text-muted">
          {unlockedCount} of {total} unlocked {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div id="lesson-sentence-list" className="mt-2.5">
          <input value={query} onChange={event => setQuery(event.target.value)}
            aria-label="Search the lesson sentences"
            placeholder="Search in Korean or English"
            className="w-full rounded-panel bg-panel shadow-panel px-3 py-2 text-sm outline-none placeholder:text-muted" />

          {unlockedCount === 0
            ? <p className="mt-3 text-[13px] leading-relaxed text-muted">
                No sentences are unlocked yet. Every sentence is built only from words
                you have marked as learned, so finish a lesson's vocabulary checklist
                and its sentences appear here.
              </p>
            : <>
                {visible.map(group => (
                  <div key={group.moduleId} className="mt-3.5">
                    <div className="mb-1.5 text-[10px] tracking-[0.15em] text-muted uppercase">
                      {group.title}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {group.sentences.map(sentence => {
                        const korean = sentenceSurface(sentence.ko);
                        return (
                          <button key={sentence.id} type="button" onClick={() => onPick(korean)}
                            className="rounded-panel bg-panel px-3.5 py-2.5 text-left shadow-panel transition-shadow hover:shadow-lift">
                            <span className="block font-korean text-[16.5px] leading-snug">
                              {korean}
                            </span>
                            {sentence.rom && <Rom text={sentence.rom} className="mt-0.5 block" />}
                            <span className="mt-0.5 block text-[13px] text-muted">
                              {sentenceSurface(sentence.en)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <p className="mt-3 text-[11.5px] leading-relaxed text-muted">
                  {foundCount === 0
                    ? `Nothing unlocked matches “${query}”. ${unlockedCount} unlocked sentences are here; the other ${total - unlockedCount} are behind their lesson's vocabulary checklist.`
                    : foundCount > shown
                      ? `Showing ${shown} of ${foundCount} matches — keep typing to narrow it down.`
                      : `${foundCount} ${foundCount === 1 ? "sentence" : "sentences"}${query ? " match" : ""}. ${total - unlockedCount > 0 ? `The other ${total - unlockedCount} of ${total} are behind their lesson's vocabulary checklist.` : "That is every sentence in the course."}`}
                </p>
              </>}
        </div>
      )}
    </section>
  );
}
