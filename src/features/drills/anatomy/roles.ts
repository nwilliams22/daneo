import type { Role } from "../../../types";

/** Role color-coding is semantic and app-wide (PROJECT.md): subject=teal,
 *  object=clay, place=gold, verb=ink/bold. Shared by the anatomy layers,
 *  the arrange tiles, and the role-label question. */
export const ROLE_COLOR: Record<
  Role,
  { text: string; border: string; dot: string }
> = {
  subject: { text: "text-subject", border: "border-subject", dot: "bg-subject" },
  object: { text: "text-object", border: "border-object", dot: "bg-object" },
  place: { text: "text-place", border: "border-place", dot: "bg-place" },
  verb: { text: "text-verb", border: "border-verb", dot: "bg-verb" },
  other: { text: "text-ink", border: "border-ink", dot: "bg-muted" },
};

export const ROLE_LEGEND: { role: Role; dot: string; label: string }[] = [
  { role: "subject", dot: "bg-subject", label: "subject" },
  { role: "object", dot: "bg-object", label: "object" },
  { role: "place", dot: "bg-place", label: "place" },
  { role: "verb", dot: "bg-verb", label: "verb" },
];
