/** Pill selector chip (set selectors, category filters). */
export default function Chip({
  active,
  onClick,
  children,
  activeClass = "bg-ink text-panel",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  activeClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
        active ? activeClass : "bg-fill text-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
