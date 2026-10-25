import type { ReactNode } from "react";

export interface MissedChip {
  id: string;
  big: string; // Korean glyph/word
  small: string; // secondary label (rom or meaning)
}

/** The "Review these" strip shown under a drill for this session's misses.
 *  `title` and `footer` let the module-test screens reuse it as a "what you
 *  missed, practise it now" block. */
export default function MissedStrip({
  items,
  title = "Review these",
  footer,
}: {
  items: MissedChip[];
  title?: string;
  footer?: ReactNode;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mt-4 rounded-panel bg-panel shadow-panel px-4 py-3.5">
      <div className="mb-2.5 text-[11px] font-semibold tracking-[0.15em] text-clay uppercase">
        {title}
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
      {footer}
    </div>
  );
}
