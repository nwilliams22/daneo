export interface QuizOptionView {
  id: string;
  label: string;
  korean?: boolean; // render the label in the Korean face (e.g. pick-the-word)
}

export type QuizColumns = 1 | 2 | "auto";

/** `columns="auto"` takes two columns only when every option is short enough
 *  to stay inside two lines of a half-width pill.
 *
 *  Measured over the 1,439 shipped sentences: the median English reading is
 *  50 characters, the 90th percentile 78 and the longest 143. So a fixed
 *  two-column grid would cram the long tail, while the fixed single column
 *  stacks four near-empty pills for the short half of the course and pushes
 *  the answer feedback below the fold ("these shorter sentences take up a lot
 *  of vertical space ... you don't have to scroll down to see the full
 *  correction" — Nick, 2026-10-26). 72 characters is the 88th percentile and
 *  about two lines at this size in half a column. */
export const AUTO_TWO_COL_MAX = 72;

export function autoColumns(options: QuizOptionView[]): 1 | 2 {
  return options.every((o) => o.label.length <= AUTO_TWO_COL_MAX) ? 2 : 1;
}

/** Shared answer-option grid. After a pick, the right answer fills jade — the
 *  colour that means "progress earned" everywhere else in the app — and a wrong
 *  pick fills vermilion. */
export default function QuizOptions({
  options,
  pickedId,
  answerId,
  onPick,
  columns = 2,
}: {
  options: QuizOptionView[];
  pickedId: string | null;
  answerId: string;
  onPick: (id: string) => void;
  columns?: QuizColumns;
}) {
  const cols = columns === "auto" ? autoColumns(options) : columns;
  return (
    <div
      className={`grid gap-2.5 ${cols === 2 ? "grid-cols-2" : "grid-cols-1"}`}
    >
      {options.map((o) => {
        // Dancheong has no tiles: an option is a pill with a hairline edge, and
        // the feedback fills it rather than drawing a second ring (BAD-281).
        let cls = "border-faint text-ink hover:bg-fill";
        if (pickedId) {
          if (o.id === answerId)
            cls = "border-jade bg-jade text-on-accent";
          else if (o.id === pickedId)
            cls = "border-teal bg-teal text-on-accent";
          else cls = "border-line text-muted";
        }
        return (
          <button
            key={o.id}
            disabled={!!pickedId}
            onClick={() => onPick(o.id)}
            // A Korean answer used to render at 16px while the very same word
            // as a *prompt* renders at 34px. Hangul packs two or three jamo
            // into one em square, so it reads smaller than Latin at the same
            // size ("it's hard to read some of the characters because they're
            // so small ... we have all that empty real estate under" — Nick,
            // 2026-10-26). Korean answers now sit at the app's own Korean
            // prompt size. Exactly one size class is emitted: two Tailwind
            // text-size utilities on one element resolve by stylesheet order,
            // not by the order they appear in the attribute.
            className={`rounded-full border px-3 py-3.5 font-semibold transition-colors ${
              cols === 1 ? "text-left" : "text-center"
            } ${
              o.korean
                ? "font-korean text-[26px] leading-snug"
                : cols === 1
                  ? "text-sm"
                  : "text-[16px]"
            } ${cls} ${pickedId ? "" : "cursor-pointer"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
