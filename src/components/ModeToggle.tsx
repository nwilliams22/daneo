/** Segmented two-or-more-way mode switch (flashcard/quiz, study/arrange…). */
export default function ModeToggle<T extends string>({
  modes,
  value,
  onChange,
  className = "",
}: {
  modes: { value: T; label: string }[];
  value: T;
  onChange: (m: T) => void;
  className?: string;
}) {
  return (
    <div
      className={`flex gap-1 rounded-xl border border-line bg-panel p-1 ${className}`}
    >
      {modes.map((m) => (
        <button
          key={m.value}
          onClick={() => onChange(m.value)}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
            value === m.value
              ? "bg-ink text-paper"
              : "text-muted hover:text-ink"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
