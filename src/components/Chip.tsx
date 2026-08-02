/** Pill selector chip (set selectors, category filters). */
export default function Chip({
  active,
  onClick,
  children,
  activeClass = "border-ink bg-ink text-paper",
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
        active ? activeClass : "border-line text-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
