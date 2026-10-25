/** Pill selector chip (set selectors, category filters). Dancheong fills
 *  nothing: an unselected chip is a hairline ring, and the selected one is
 *  marked in vermilion rather than by a block of colour (BAD-281). */
export default function Chip({
  active,
  onClick,
  children,
  activeClass = "border-teal text-teal",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  activeClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
        active
          ? `font-semibold ${activeClass}`
          : "border-line text-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
