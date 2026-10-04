import { readFileSync } from "node:fs";
import { romanize } from "../src/lib/romanize.ts";

type Sentence = { id: string; ko: { t: string }[]; rom: string };
const sentences = JSON.parse(readFileSync("src/content/sentences.json", "utf8")) as Sentence[];
const stripTerminal = (text: string) => text.replace(/[.!?]+$/, "");
const rawMatches = sentences.filter(({ ko, rom }) =>
  romanize(ko.map(({ t }) => t).filter(Boolean).join(" ")) === rom).length;
const mismatches = sentences.flatMap(({ id, ko, rom }) => {
  const korean = ko.map(({ t }) => t).filter(Boolean).join(" ");
  const actual = romanize(korean);
  return stripTerminal(actual) === stripTerminal(rom) ? [] : [{ id, korean, expected: rom, actual }];
});
console.log(`${rawMatches}/${sentences.length} raw exact; ${sentences.length - mismatches.length}/${sentences.length} exact after terminal punctuation normalization`);
for (const mismatch of mismatches) console.log(JSON.stringify(mismatch));
