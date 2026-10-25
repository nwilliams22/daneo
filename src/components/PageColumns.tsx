import type { ReactNode } from "react";

// Nick, BAD-281, after seeing Dancheong running: "there is a lot of empty
// spaces on the sides of the page. can we do something to fill up that empty
// space?" The app was one 672px column centred in an 1100px window — about
// 215px of nothing down each edge, and more again on a maximised window.
//
// The fix is a page shape rather than a wider column: Dancheong is editorial,
// and a printed spread uses its width by putting secondary matter in a rail
// beside the main column, divided by a rule. So the shell got wider (see
// AppShell) and the pages that had a second kind of content — progress,
// shortcuts, the test you owe — put it here instead of further down the page.
//
// Under 1024px the rail stacks underneath, so a narrow window loses nothing.

export default function PageColumns({
  children,
  rail,
}: {
  children: ReactNode;
  rail: ReactNode;
}) {
  return (
    <div className="grid items-start gap-x-10 gap-y-9 lg:grid-cols-[minmax(0,1fr)_17.5rem]">
      <div className="min-w-0">{children}</div>
      {/* Sticky so a long page keeps its rail in view — the module page is
          7,000px tall and its test button used to be at the bottom of it. */}
      <aside className="min-w-0 lg:sticky lg:top-20 lg:border-l lg:border-line lg:pl-8">
        {rail}
      </aside>
    </div>
  );
}

/** One labelled block in a rail. The label is the same quiet uppercase tag a
 *  section uses in the main column, so the two columns read as one page. */
export function RailBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-7 last:mb-0">
      <h2 className="mb-3 text-[10px] tracking-[0.22em] text-muted uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** A number and what it counts, set the way the main column sets a figure. */
export function RailStat({
  value,
  label,
  meter,
}: {
  value: ReactNode;
  label: string;
  meter?: number;
}) {
  return (
    <div className="border-b border-line py-2.5 last:border-b-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-serif text-[22px] leading-none font-semibold">
          {value}
        </span>
        <span className="text-right text-xs text-muted">{label}</span>
      </div>
      {meter !== undefined && (
        <span className="mt-2 block h-1 overflow-hidden rounded-full bg-line">
          <span
            className="block h-full rounded-full bg-meter"
            style={{ width: `${Math.max(0, Math.min(100, meter))}%` }}
          />
        </span>
      )}
    </div>
  );
}
