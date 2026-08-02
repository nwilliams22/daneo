import type { FontFace } from "../../../types";
import type { Rng } from "../../../lib/rng";

/** Tailwind font class per content face (fonts self-hosted via @fontsource). */
export const FACE_FONT: Record<FontFace, string> = {
  gothic: "font-korean",
  myeongjo: "font-myeongjo",
  hand: "font-hand",
};

export const FACE_LABEL: Record<FontFace, string> = {
  gothic: "Gothic",
  myeongjo: "Myeongjo",
  hand: "Handwriting",
};

const FACES: FontFace[] = ["gothic", "myeongjo", "hand"];

/** The cross-font difficulty toggle (PROJECT.md §5): a random face per
 *  prompt, Gothic included so the default stays in rotation. */
export function randomFace(rng: Rng = Math.random): FontFace {
  return FACES[Math.floor(rng() * FACES.length)]!;
}

/** A random non-default face — for prompts that should always be hard. */
export function randomAltFace(rng: Rng = Math.random): FontFace {
  return rng() < 0.5 ? "myeongjo" : "hand";
}
