import { useEffect } from "react";

// Desktop drill shortcuts: 1–4 pick options/tiles, Space reveals,
// Enter/→ advances, Backspace unplaces. The typing drill registers its own
// exclusive handler instead of this one.

export function useDrillKeys(opts: {
  enabled?: boolean;
  onNumber?: (n: 1 | 2 | 3 | 4) => void;
  onSpace?: () => void;
  onEnter?: () => void;
  onBackspace?: () => void;
}) {
  const { enabled = true, onNumber, onSpace, onEnter, onBackspace } = opts;

  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && /^(input|textarea|select)$/i.test(target.tagName)) return;

      if (onNumber && /^[1-4]$/.test(e.key)) {
        e.preventDefault();
        onNumber(Number(e.key) as 1 | 2 | 3 | 4);
      } else if (onSpace && e.key === " ") {
        e.preventDefault();
        onSpace();
      } else if (onEnter && (e.key === "Enter" || e.key === "ArrowRight")) {
        e.preventDefault();
        onEnter();
      } else if (onBackspace && e.key === "Backspace") {
        e.preventDefault();
        onBackspace();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled, onNumber, onSpace, onEnter, onBackspace]);
}
