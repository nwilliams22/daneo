import type { Module } from "../types";

// Vocab modules and readings number themselves separately, so "Module N"
// always matches the numbers the course prose refers to — interludes can
// never shift them (Nick, 2026-08-02). Lifted out of LearnPage on
// 2026-10-25 so the Review tab can name a module the same short way.

export function moduleLabels(modules: Module[]): Record<string, string> {
  let moduleN = 0;
  let readingN = 0;
  return Object.fromEntries(
    modules.map((m) => [
      m.id,
      // Appendices (ids s1, s2, …) sit outside the numbered course —
      // CURRICULUM.md's "living content" shelf.
      m.id.startsWith("s")
        ? `Appendix ${m.id.toUpperCase()}`
        : m.wordIds.length === 0
          ? `Reading ${++readingN}`
          : `Module ${++moduleN}`,
    ]),
  );
}
