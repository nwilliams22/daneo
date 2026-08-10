// NIKL coverage report — measures the authored modules against the frozen
// 한국어 학습용 어휘 목록 (reference/nikl-5965.tsv, KOGL Type 1, see
// reference/README.md). Ring targets per CURRICULUM.md §1: Ring 1 ≈ grade A,
// Ring 2 ≈ +B, Ring 3 = the full list. Run: npm run coverage:nikl

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

interface NiklWord {
  rank: number;
  base: string; // headword with the homograph index stripped (가다01 → 가다)
  pos: string;
  grade: "A" | "B" | "C";
}

const tsv = readFileSync(join(root, "reference/nikl-5965.tsv"), "utf-8")
  .trimEnd()
  .split("\n")
  .slice(1);

const nikl: NiklWord[] = tsv.map((line) => {
  const [rank, word, pos, , grade] = line.split("\t");
  return {
    rank: Number(rank),
    base: word.replace(/\d+$/, "").replace(/\(.*\)$/, ""),
    pos,
    grade: grade as NiklWord["grade"],
  };
});

// One entry per distinct headword; homographs and multi-POS rows collapse to
// the best (earliest-ring) grade and best rank, since owning the written form
// once is what module coverage can claim.
const gradePriority = { A: 0, B: 1, C: 2 } as const;
const byBase = new Map<string, NiklWord>();
for (const w of nikl) {
  const prior = byBase.get(w.base);
  if (
    !prior ||
    gradePriority[w.grade] < gradePriority[prior.grade] ||
    (w.grade === prior.grade && w.rank < prior.rank)
  )
    byBase.set(w.base, w);
}

const words = JSON.parse(
  readFileSync(join(root, "src/content/words.json"), "utf-8"),
) as { ko: string; pos: string }[];
const daneoKo = new Set(words.map((w) => w.ko));

const covered = new Map<string, NiklWord[]>([
  ["A", []],
  ["B", []],
  ["C", []],
]);
const missing = new Map<string, NiklWord[]>([
  ["A", []],
  ["B", []],
  ["C", []],
]);
for (const w of byBase.values())
  (daneoKo.has(w.base) ? covered : missing).get(w.grade)!.push(w);

for (const list of [...covered.values(), ...missing.values()])
  list.sort((a, b) => a.rank - b.rank);

const niklBases = new Set(byBase.keys());
const beyondList = words.filter((w) => !niklBases.has(w.ko)).map((w) => w.ko);

const pct = (a: number, b: number) => `${((100 * a) / b).toFixed(1)}%`;

console.log("NIKL 한국어 학습용 어휘 coverage — Daneo authored modules");
console.log("=".repeat(60));
for (const grade of ["A", "B", "C"] as const) {
  const c = covered.get(grade)!.length;
  const total = c + missing.get(grade)!.length;
  console.log(
    `Grade ${grade}: ${String(c).padStart(4)} / ${total} distinct headwords (${pct(c, total)})`,
  );
}
const totalCovered = [...covered.values()].reduce((n, l) => n + l.length, 0);
console.log(
  `Overall: ${totalCovered} / ${byBase.size} (${pct(totalCovered, byBase.size)})`,
);
console.log(
  `\nDaneo words beyond the list: ${beyondList.length} of ${words.length}`,
  "(phrases, Konglish, proper nouns, culture words — expected)",
);

const gapA = missing.get("A")!;
console.log(
  `\nTop grade-A gaps by frequency rank (${gapA.length} total) — Ring 1 debt:`,
);
for (const w of gapA.slice(0, 40))
  console.log(`  ${String(w.rank).padStart(5)}  ${w.base} (${w.pos})`);
