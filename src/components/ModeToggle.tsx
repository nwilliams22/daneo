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
      className={`flex gap-6 border-b border-line ${className}`}
    >
      {modes.map((m) => (
        <button
          key={m.value}
          onClick={() => onChange(m.value)}
          className={`-mb-px border-b-2 pb-2 text-sm transition-colors ${
            value === m.value
              ? "border-teal font-semibold text-ink"
              : "border-transparent text-muted hover:text-ink"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
