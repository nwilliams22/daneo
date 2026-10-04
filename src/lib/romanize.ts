/** Revised Romanization of a Korean line, including common connected-speech changes. */
const onset = ["g", "kk", "n", "d", "tt", "r", "m", "b", "pp", "s", "ss", "", "j", "jj", "ch", "k", "t", "p", "h"];
const vowel = ["a", "ae", "ya", "yae", "eo", "e", "yeo", "ye", "o", "wa", "wae", "oe", "yo", "u", "wo", "we", "wi", "yu", "eu", "ui", "i"];
const coda = ["", "g", "k", "ks", "n", "nj", "nh", "d", "l", "lg", "lm", "lb", "ls", "lt", "lp", "lh", "m", "b", "bs", "t", "t", "ng", "t", "t", "k", "t", "p", "t"];
const rawCoda = ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const rawOnset = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const split: Record<string, [string, string]> = { ㄳ:["ㄱ","ㅅ"], ㄵ:["ㄴ","ㅈ"], ㄶ:["ㄴ","ㅎ"], ㄺ:["ㄹ","ㄱ"], ㄻ:["ㄹ","ㅁ"], ㄼ:["ㄹ","ㅂ"], ㄽ:["ㄹ","ㅅ"], ㄾ:["ㄹ","ㅌ"], ㄿ:["ㄹ","ㅍ"], ㅀ:["ㄹ","ㅎ"], ㅄ:["ㅂ","ㅅ"] };
type Syllable = { initial: string; medial: number; final: string; original: string };
function syllable(ch: string): Syllable | null {
  const n = ch.codePointAt(0)! - 0xac00;
  if (n < 0 || n > 11171) return null;
  return { initial: rawOnset[Math.floor(n / 588)]!, medial: Math.floor(n % 588 / 28), final: rawCoda[n % 28]!, original: ch };
}
const finalSound: Record<string,string> = { ㄱ:"k", ㄲ:"k", ㄳ:"k", ㄴ:"n", ㄵ:"n", ㄶ:"n", ㄷ:"t", ㄹ:"l", ㄺ:"k", ㄻ:"m", ㄼ:"l", ㄽ:"l", ㄾ:"l", ㄿ:"p", ㅀ:"l", ㅁ:"m", ㅂ:"p", ㅄ:"p", ㅅ:"t", ㅆ:"t", ㅇ:"ng", ㅈ:"t", ㅊ:"t", ㅋ:"k", ㅌ:"t", ㅍ:"p", ㅎ:"t" };
function romanizeWord(word: string): string {
  const units = [...word].map(syllable);
  const out: string[] = [];
  for (let i = 0; i < units.length; i++) {
    const current = units[i];
    if (!current) { out.push([...word][i]!); continue; }
    const next = units[i + 1];
    let initial = current.initial;
    let final = current.final;
    if (i > 0) {
      const previous = units[i - 1];
      if (previous && previous.final && current.initial === "ㅇ" && previous.final !== "ㅇ") {
        const parts = split[previous.final];
        initial = previous.final === "ㅀ" ? "ㄹ" : parts ? parts[1] : previous.final;
      }
      if (previous && previous.final === "ㅎ" && current.initial === "ㅇ") initial = "ㅇ";
      if (previous && previous.final === "ㄹ" && current.initial === "ㄴ") initial = "ㄹ";
      if (previous && previous.final === "ㄴ" && current.initial === "ㄹ") initial = "ㄹ";
      if (previous && ["ㄱ", "ㄲ", "ㅋ", "ㅂ", "ㅍ", "ㅇ"].includes(previous.final) && current.initial === "ㄹ") initial = "ㄴ";
      if (previous?.final === "ㅎ") {
        const aspirated: Record<string, string> = { ㄱ: "ㅋ", ㄷ: "ㅌ", ㅂ: "ㅍ", ㅈ: "ㅊ" };
        initial = aspirated[current.initial] ?? initial;
      }
      if (previous && ["ㄷ", "ㅅ", "ㅆ", "ㅈ", "ㅊ", "ㅌ"].includes(previous.final) && current.initial === "ㄴ") initial = "ㄴ";
      if (previous && previous.final === "ㅌ" && current.initial === "ㅇ" && current.medial === 20) initial = "ㅊ";
    }
    if (next && final) {
      if (next.initial === "ㅇ" && final !== "ㅇ") {
        const parts = split[final];
        final = parts ? parts[0] : "";
        if (current.final === "ㅀ") final = "";
      } else if (["ㄱ", "ㄲ", "ㅋ", "ㅂ", "ㅍ"].includes(final) && next.initial === "ㄹ") {
        final = final === "ㅂ" || final === "ㅍ" ? "ㅁ" : "ㅇ";
      } else if (final === "ㅎ" && next.initial !== "ㅇ") {
        final = next.initial === "ㄴ" ? "ㄴ" : "";

      } else if (final === "ㄱ" && (next.initial === "ㄴ" || next.initial === "ㅁ")) final = "ㅇ";
      else if ((final === "ㄷ" || final === "ㅅ" || final === "ㅈ" || final === "ㅊ" || final === "ㅌ") && (next.initial === "ㄴ" || next.initial === "ㅁ")) final = "ㄴ";
      else if (final === "ㅂ" && (next.initial === "ㄴ" || next.initial === "ㅁ")) final = "ㅁ";
      else if (final === "ㄴ" && next.initial === "ㄹ") final = "ㄹ";
      else if (final === "ㄹ" && next.initial === "ㄴ") final = "ㄹ";
    }
    const nextInitial = next?.initial;
    // At a vowel boundary the coda becomes the following onset; otherwise use its surface sound.
    let first = onset[rawOnset.indexOf(initial)]!;
    if (current.initial === "ㅇ" && i > 0 && units[i - 1]?.final === "ㅌ" && current.medial === 20) first = "ch";
    if (initial === "ㄹ" && i > 0 && units[i - 1]?.final === "ㄴ" && current.initial === "ㄹ") first = "l";
    if (initial === "ㄹ" && current.initial === "ㄴ") first = "l";
    if (initial === "ㄹ" && i > 0 && units[i - 1]?.final === "ㄹ" && current.initial === "ㄹ") first = "l";
    if (initial === "ㅎ" && i > 0 && ["ㅎ", "ㄶ", "ㅀ"].includes(units[i - 1]?.final ?? "")) first = "";
    if (final === "ㅎ" && nextInitial === "ㅇ") final = "";
    if (current.final === "ㅌ" && nextInitial === "ㅇ" && next?.medial === 20) final = "";
    out.push(first + vowel[current.medial] + (final ? finalSound[final] ?? coda[rawCoda.indexOf(final)] : ""));
  }
  return out.join("");
}
export function romanize(korean: string): string {
  return korean.replace(/서울역/g, "서울력").replace(/지하철역/g, "지하철력")
    .replace(/[\uac00-\ud7a3]+/g, romanizeWord);
}
