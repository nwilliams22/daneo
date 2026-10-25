export interface QuizOptionView {
  id: string;
  label: string;
  korean?: boolean; // render the label in the Korean face (e.g. pick-the-word)
}

/** Shared answer-option grid with the prototype's feedback coloring:
 *  after a pick, the answer turns teal, a wrong pick turns clay. */
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
        // Slate has no outlined boxes: an option is a filled tile, and the
        // feedback replaces the fill rather than drawing a ring (BAD-281).
        let cls = "bg-paper text-ink hover:bg-fill";
        if (pickedId) {
          if (o.id === answerId) cls = "bg-teal text-on-accent";
          else if (o.id === pickedId) cls = "bg-clay text-on-accent";
          else cls = "bg-paper text-muted opacity-75";
        }
        return (
          <button
            key={o.id}
            disabled={!!pickedId}
            onClick={() => onPick(o.id)}
            className={`rounded-xl px-3 py-3.5 font-semibold transition-colors ${
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
