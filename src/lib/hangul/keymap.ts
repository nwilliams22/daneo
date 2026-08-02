// Standard 2-beolsik (두벌식) layout, keyed by KeyboardEvent.code so the
// physical position works regardless of the OS keyboard layout. The shift
// layer exists only where real 2-beolsik has one: the five tense consonants
// and ㅒ/ㅖ. Compound vowels and batchim arise from sequential input in the
// composer, exactly like real typing.

export interface KeyDef {
  base: string;
  shift?: string;
}

export const DUBEOLSIK: Record<string, KeyDef> = {
  KeyQ: { base: "ㅂ", shift: "ㅃ" },
  KeyW: { base: "ㅈ", shift: "ㅉ" },
  KeyE: { base: "ㄷ", shift: "ㄸ" },
  KeyR: { base: "ㄱ", shift: "ㄲ" },
  KeyT: { base: "ㅅ", shift: "ㅆ" },
  KeyY: { base: "ㅛ" },
  KeyU: { base: "ㅕ" },
  KeyI: { base: "ㅑ" },
  KeyO: { base: "ㅐ", shift: "ㅒ" },
  KeyP: { base: "ㅔ", shift: "ㅖ" },
  KeyA: { base: "ㅁ" },
  KeyS: { base: "ㄴ" },
  KeyD: { base: "ㅇ" },
  KeyF: { base: "ㄹ" },
  KeyG: { base: "ㅎ" },
  KeyH: { base: "ㅗ" },
  KeyJ: { base: "ㅓ" },
  KeyK: { base: "ㅏ" },
  KeyL: { base: "ㅣ" },
  KeyZ: { base: "ㅋ" },
  KeyX: { base: "ㅌ" },
  KeyC: { base: "ㅊ" },
  KeyV: { base: "ㅍ" },
  KeyB: { base: "ㅠ" },
  KeyN: { base: "ㅜ" },
  KeyM: { base: "ㅡ" },
};

/** The jamo a physical key produces, or null for unmapped keys. */
export function jamoForKey(code: string, shift: boolean): string | null {
  const def = DUBEOLSIK[code];
  if (!def) return null;
  return shift ? (def.shift ?? def.base) : def.base;
}

/** Rows for the on-screen keyboard (mirrors the physical layout). */
export const KEYBOARD_ROWS: string[][] = [
  ["KeyQ", "KeyW", "KeyE", "KeyR", "KeyT", "KeyY", "KeyU", "KeyI", "KeyO", "KeyP"],
  ["KeyA", "KeyS", "KeyD", "KeyF", "KeyG", "KeyH", "KeyJ", "KeyK", "KeyL"],
  ["KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN", "KeyM"],
];
