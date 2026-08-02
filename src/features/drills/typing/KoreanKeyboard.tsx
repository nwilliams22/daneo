import { DUBEOLSIK, KEYBOARD_ROWS } from "../../../lib/hangul/keymap";

/** On-screen 2-beolsik keyboard. Mirrors the physical layout so screen taps
 *  teach the same key positions a real Korean keyboard uses. Shift is
 *  sticky-once, like a phone keyboard. */
export default function KoreanKeyboard({
  shift,
  onShift,
  onJamo,
  onBackspace,
  disabled = false,
}: {
  shift: boolean;
  onShift: (v: boolean) => void;
  onJamo: (jamo: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
}) {
  const keyCls =
    "flex h-11 flex-1 items-center justify-center rounded-lg border border-line bg-paper font-korean text-lg transition-colors active:bg-line disabled:opacity-40";

  return (
    <div className="mt-4 flex select-none flex-col gap-1.5">
      {KEYBOARD_ROWS.map((row, ri) => (
        <div key={ri} className="flex gap-1.5">
          {ri === 2 && (
            <button
              disabled={disabled}
              onClick={() => onShift(!shift)}
              aria-label="Shift"
              aria-pressed={shift}
              className={`flex h-11 w-14 shrink-0 items-center justify-center rounded-lg border text-sm font-bold transition-colors ${
                shift
                  ? "border-teal bg-teal text-on-accent"
                  : "border-line bg-panel text-muted"
              }`}
            >
              ⇧
            </button>
          )}
          {ri === 1 && <div className="w-4" />}
          {row.map((code) => {
            const def = DUBEOLSIK[code]!;
            const label = shift && def.shift ? def.shift : def.base;
            const dimmed = shift && !def.shift;
            return (
              <button
                key={code}
                disabled={disabled}
                onClick={() => {
                  onJamo(label);
                  if (shift) onShift(false);
                }}
                className={`${keyCls} ${dimmed ? "text-muted" : "text-ink"}`}
              >
                {label}
              </button>
            );
          })}
          {ri === 1 && <div className="w-4" />}
          {ri === 2 && (
            <button
              disabled={disabled}
              onClick={onBackspace}
              aria-label="Backspace"
              className="flex h-11 w-14 shrink-0 items-center justify-center rounded-lg border border-line bg-panel text-sm font-bold text-muted transition-colors active:bg-line"
            >
              ⌫
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
