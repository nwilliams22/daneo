export interface QuizOptionView {
  id: string;
  label: string;
  korean?: boolean; // render the label in the Korean face (e.g. pick-the-word)
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
  columns?: 1 | 2;
}) {
  return (
    <div
      className={`grid gap-2.5 ${columns === 2 ? "grid-cols-2" : "grid-cols-1"}`}
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
            className={`rounded-full border px-3 py-3.5 font-semibold transition-colors ${
              columns === 1 ? "text-left text-sm" : "text-center text-[16px]"
            } ${o.korean ? "font-korean" : ""} ${cls} ${pickedId ? "" : "cursor-pointer"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
