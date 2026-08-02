import {
  VOWEL_COMBOS,
  JONG_COMBOS,
  SPLIT_VOWEL,
  SPLIT_JONG,
  canBeCho,
  canBeJong,
  isVowelJamo,
  isSyllable,
  composeSyllable,
  decomposeSyllable,
} from "./jamo";

// The 2-beolsik typing automaton as a pure reducer. Vowel and batchim parts
// are kept as arrays so backspace deletes one JAMO at a time (없→업→어→ㅇ→"")
// and so compound splitting (값+ㅣ→갑시) falls out naturally.

export interface CurrentSyllable {
  cho: string | null;
  jung: string[]; // 0–2 vowel parts, e.g. ["ㅗ","ㅏ"] renders as ㅘ
  jong: string[]; // 0–2 final-consonant parts
}

export interface ComposerState {
  committed: string;
  cur: CurrentSyllable | null;
}

export type ComposerAction =
  | { type: "jamo"; jamo: string }
  | { type: "backspace" }
  | { type: "space" }
  | { type: "clear" };

export const EMPTY_COMPOSER: ComposerState = { committed: "", cur: null };

const joinVowel = (parts: string[]): string =>
  parts.length === 2 ? VOWEL_COMBOS[parts[0]!]![parts[1]!]! : (parts[0] ?? "");

const joinJong = (parts: string[]): string =>
  parts.length === 2 ? JONG_COMBOS[parts[0]!]![parts[1]!]! : (parts[0] ?? "");

const canExtendVowel = (parts: string[], v: string): boolean =>
  parts.length === 1 && VOWEL_COMBOS[parts[0]!]?.[v] !== undefined;

const canExtendJong = (parts: string[], c: string): boolean =>
  parts.length === 1 && JONG_COMBOS[parts[0]!]?.[c] !== undefined;

/** What the in-progress syllable looks like on screen. */
export function renderCur(cur: CurrentSyllable | null): string {
  if (!cur) return "";
  if (cur.cho && cur.jung.length > 0)
    return composeSyllable(cur.cho, joinVowel(cur.jung), joinJong(cur.jong));
  if (cur.cho) return cur.cho;
  return joinVowel(cur.jung);
}

export function renderComposer(state: ComposerState): string {
  return state.committed + renderCur(state.cur);
}

const commit = (state: ComposerState): string =>
  state.committed + renderCur(state.cur);

function inputConsonant(state: ComposerState, c: string): ComposerState {
  const { cur } = state;
  // start a fresh syllable
  if (!cur || (!cur.cho && cur.jung.length === 0))
    return { committed: state.committed, cur: { cho: c, jung: [], jong: [] } };
  // bare vowel or bare consonant sitting there → commit it, start fresh
  if (!cur.cho || cur.jung.length === 0)
    return { committed: commit(state), cur: { cho: c, jung: [], jong: [] } };
  // cho+jung, no jong yet → become the batchim if it can
  if (cur.jong.length === 0) {
    if (canBeJong(c))
      return { committed: state.committed, cur: { ...cur, jong: [c] } };
    return { committed: commit(state), cur: { cho: c, jung: [], jong: [] } };
  }
  // existing batchim → try a compound (ㄱ+ㅅ→ㄳ), else commit and start fresh
  if (canExtendJong(cur.jong, c))
    return {
      committed: state.committed,
      cur: { ...cur, jong: [cur.jong[0]!, c] },
    };
  return { committed: commit(state), cur: { cho: c, jung: [], jong: [] } };
}

function inputVowel(state: ComposerState, v: string): ComposerState {
  const { cur } = state;
  if (!cur)
    return { committed: state.committed, cur: { cho: null, jung: [v], jong: [] } };
  // consonant waiting for its vowel
  if (cur.cho && cur.jung.length === 0)
    return { committed: state.committed, cur: { ...cur, jung: [v] } };
  // no batchim → try to extend the vowel (ㅗ+ㅏ→ㅘ), else commit and restart
  if (cur.jong.length === 0) {
    if (canExtendVowel(cur.jung, v))
      return {
        committed: state.committed,
        cur: { ...cur, jung: [cur.jung[0]!, v] },
      };
    return {
      committed: commit(state),
      cur: { cho: null, jung: [v], jong: [] },
    };
  }
  // batchim migration: the (last part of the) batchim becomes the next
  // syllable's initial — 강+ㅏ→가아 pattern, 값+ㅣ→갑시 for compounds.
  if (cur.jong.length === 1) {
    const stolen = cur.jong[0]!;
    if (canBeCho(stolen)) {
      const committed =
        state.committed + renderCur({ ...cur, jong: [] });
      return { committed, cur: { cho: stolen, jung: [v], jong: [] } };
    }
    // compound batchim typed via shift (can't lead a syllable) — commit whole
    return { committed: commit(state), cur: { cho: null, jung: [v], jong: [] } };
  }
  const [keep, stolen] = [cur.jong[0]!, cur.jong[1]!];
  const committed = state.committed + renderCur({ ...cur, jong: [keep] });
  return { committed, cur: { cho: stolen, jung: [v], jong: [] } };
}

function popCur(cur: CurrentSyllable): CurrentSyllable | null {
  if (cur.jong.length > 0)
    return { ...cur, jong: cur.jong.slice(0, -1) };
  if (cur.jung.length > 0)
    return cur.jung.length === 1 && !cur.cho
      ? null
      : { ...cur, jung: cur.jung.slice(0, -1) };
  return null; // removing the cho empties the syllable
}

/** Re-open the last committed char as an editable syllable (for backspace). */
function reopen(ch: string): CurrentSyllable | null {
  const d = decomposeSyllable(ch);
  if (d) {
    return {
      cho: d.cho,
      jung: SPLIT_VOWEL[d.jung] ? [...SPLIT_VOWEL[d.jung]!] : [d.jung],
      jong:
        d.jong === ""
          ? []
          : SPLIT_JONG[d.jong]
            ? [...SPLIT_JONG[d.jong]!]
            : [d.jong],
    };
  }
  if (isVowelJamo(ch))
    return {
      cho: null,
      jung: SPLIT_VOWEL[ch] ? [...SPLIT_VOWEL[ch]!] : [ch],
      jong: [],
    };
  if (canBeCho(ch)) return { cho: ch, jung: [], jong: [] };
  return null; // not Hangul we can re-open — delete whole
}

function backspace(state: ComposerState): ComposerState {
  if (state.cur) return { committed: state.committed, cur: popCur(state.cur) };
  if (state.committed.length === 0) return state;
  const chars = [...state.committed];
  const last = chars.pop()!;
  const committed = chars.join("");
  if (isSyllable(last) || SPLIT_VOWEL[last]) {
    const reopened = reopen(last);
    if (reopened) return { committed, cur: popCur(reopened) };
  }
  return { committed, cur: null }; // bare jamo / space / anything else: gone
}

export function composerReduce(
  state: ComposerState,
  action: ComposerAction,
): ComposerState {
  switch (action.type) {
    case "jamo":
      return isVowelJamo(action.jamo)
        ? inputVowel(state, action.jamo)
        : inputConsonant(state, action.jamo);
    case "backspace":
      return backspace(state);
    case "space":
      return { committed: commit(state) + " ", cur: null };
    case "clear":
      return EMPTY_COMPOSER;
  }
}
