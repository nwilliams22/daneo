// Module markdown is split on visible marker lines (::vocab::, ::sentences::,
// ::hangul::…::/hangul::) where interactive components mount. Markers are
// plain paragraph tokens because react-markdown strips HTML comments.

export type ModuleSegment =
  | { kind: "md"; md: string }
  | { kind: "vocab" }
  | { kind: "sentences" }
  | { kind: "hangul"; md: string };

export function splitModuleMarkdown(raw: string): ModuleSegment[] {
  const segments: ModuleSegment[] = [];
  let buf: string[] = [];
  let hangulBuf: string[] | null = null;

  const flush = () => {
    if (buf.some((l) => l.trim() !== "")) {
      segments.push({ kind: "md", md: buf.join("\n") });
    }
    buf = [];
  };

  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (t === "::vocab::") {
      flush();
      segments.push({ kind: "vocab" });
    } else if (t === "::sentences::") {
      flush();
      segments.push({ kind: "sentences" });
    } else if (t === "::hangul::") {
      flush();
      hangulBuf = [];
    } else if (t === "::/hangul::") {
      if (hangulBuf) {
        segments.push({ kind: "hangul", md: hangulBuf.join("\n") });
        hangulBuf = null;
      }
    } else if (hangulBuf !== null) {
      hangulBuf.push(line);
    } else {
      buf.push(line);
    }
  }
  flush();
  return segments;
}
