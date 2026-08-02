import { describe, it, expect } from "vitest";
import { DUBEOLSIK, jamoForKey, KEYBOARD_ROWS } from "./keymap";

describe("dubeolsik keymap", () => {
  it("covers all 26 letter keys", () => {
    for (const letter of "ABCDEFGHIJKLMNOPQRSTUVWXYZ")
      expect(DUBEOLSIK[`Key${letter}`], `Key${letter}`).toBeDefined();
  });

  it("shift layer exists exactly where real 2-beolsik has one", () => {
    const shifted = Object.entries(DUBEOLSIK)
      .filter(([, def]) => def.shift)
      .map(([, def]) => def.shift);
    expect(shifted.sort()).toEqual(["ㄲ", "ㄸ", "ㅃ", "ㅆ", "ㅉ", "ㅒ", "ㅖ"].sort());
  });

  it("maps physical positions correctly", () => {
    expect(jamoForKey("KeyG", false)).toBe("ㅎ");
    expect(jamoForKey("KeyK", false)).toBe("ㅏ");
    expect(jamoForKey("KeyR", true)).toBe("ㄲ");
    expect(jamoForKey("KeyO", true)).toBe("ㅒ");
    expect(jamoForKey("KeyH", true)).toBe("ㅗ"); // no shift variant → base
    expect(jamoForKey("Digit1", false)).toBeNull();
    expect(jamoForKey("Semicolon", false)).toBeNull();
  });

  it("keyboard rows mirror the physical layout", () => {
    expect(KEYBOARD_ROWS.flat()).toHaveLength(26);
    expect(KEYBOARD_ROWS[0]![0]).toBe("KeyQ");
    expect(KEYBOARD_ROWS[1]![8]).toBe("KeyL");
  });
});
