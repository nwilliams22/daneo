import { useSettings } from "../state/settings";

/** The ONLY way romanization is rendered (pedagogy rule 5): always visually
 *  secondary, and the global setting hides it everywhere at once. */
export default function Rom({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const visible = useSettings((s) => s.romanizationVisible);
  if (!visible) return null;
  return <span className={`text-xs text-muted ${className}`}>{text}</span>;
}
