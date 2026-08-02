export interface QuizOptionView {
  id: string;
  label: string;
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
        let cls = "border-line text-ink hover:border-muted";
        if (pickedId) {
          if (o.id === answerId)
            cls = "border-teal bg-teal text-on-accent";
          else if (o.id === pickedId)
            cls = "border-clay bg-clay text-on-accent";
          else cls = "border-line text-muted";
        }
        return (
          <button
            key={o.id}
            disabled={!!pickedId}
            onClick={() => onPick(o.id)}
            className={`rounded-xl border px-3 py-3.5 font-semibold transition-colors ${
              columns === 1 ? "text-left text-sm" : "text-center text-[16px]"
            } ${cls} ${pickedId ? "" : "cursor-pointer"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
