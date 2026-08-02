export interface MissedChip {
  id: string;
  big: string; // Korean glyph/word
  small: string; // secondary label (rom or meaning)
}

/** The "Review these" strip shown under a drill for this session's misses. */
export default function MissedStrip({ items }: { items: MissedChip[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-4 rounded-2xl border border-line bg-panel px-4 py-3.5">
      <div className="mb-2.5 text-[11px] font-semibold tracking-[0.15em] text-clay uppercase">
        Review these
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((m) => (
          <div
            key={m.id}
            className="flex items-baseline gap-1.5 rounded-lg border border-line bg-paper px-2.5 py-1.5"
          >
            <span className="font-korean text-lg leading-none">{m.big}</span>
            <span className="text-xs text-muted">{m.small}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
