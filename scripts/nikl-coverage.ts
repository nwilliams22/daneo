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

// Taught-as allowlist: headwords with no exact word entry that ARE taught —
// via a compose-yourself pattern, a glue point, another entry's note, a
// fixed formula, an interlude, or out-of-scope proper nouns. Curated by
// hand in reference/nikl-taught-as.tsv; each row names its teaching home.
const taughtAs = new Map<string, { mechanism: string; where: string }>();
for (const line of readFileSync(join(root, "reference/nikl-taught-as.tsv"), "utf-8")
  .trimEnd()
  .split("\n")
  .slice(1)) {
  const [word, mechanism, where] = line.split("\t");
  taughtAs.set(word, { mechanism, where });
}

const covered = new Map<string, NiklWord[]>([["A", []], ["B", []], ["C", []]]);
const viaAllowlist = new Map<string, NiklWord[]>([["A", []], ["B", []], ["C", []]]);
const missing = new Map<string, NiklWord[]>([["A", []], ["B", []], ["C", []]]);
for (const w of byBase.values()) {
  const bucket = daneoKo.has(w.base)
    ? covered
    : taughtAs.has(w.base)
      ? viaAllowlist
      : missing;
  bucket.get(w.grade)!.push(w);
}

for (const list of [...covered.values(), ...viaAllowlist.values(), ...missing.values()])
  list.sort((a, b) => a.rank - b.rank);

const niklBases = new Set(byBase.keys());
const beyondList = words.filter((w) => !niklBases.has(w.ko)).map((w) => w.ko);

const pct = (a: number, b: number) => `${((100 * a) / b).toFixed(1)}%`;

console.log("NIKL 한국어 학습용 어휘 coverage — Daneo authored modules");
console.log("=".repeat(60));
for (const grade of ["A", "B", "C"] as const) {
  const c = covered.get(grade)!.length;
  const t = viaAllowlist.get(grade)!.length;
  const m = missing.get(grade)!.length;
  const total = c + t + m;
  console.log(
    `Grade ${grade}: ${String(c).padStart(4)} as headwords + ${String(t).padStart(3)} taught-as ` +
      `= ${pct(c + t, total)} of ${total} (${m} missing)`,
  );
}
const totalCovered = [...covered.values()].reduce((n, l) => n + l.length, 0);
const totalTaught = [...viaAllowlist.values()].reduce((n, l) => n + l.length, 0);
console.log(
  `Overall: ${totalCovered} + ${totalTaught} taught-as = ${pct(totalCovered + totalTaught, byBase.size)} of ${byBase.size}`,
);

const mechCounts = new Map<string, number>();
for (const list of viaAllowlist.values())
  for (const w of list) {
    const mech = taughtAs.get(w.base)!.mechanism;
    mechCounts.set(mech, (mechCounts.get(mech) ?? 0) + 1);
  }
console.log(
  "Taught-as mechanisms:",
  [...mechCounts.entries()].map(([m, n]) => `${m} ${n}`).join(" · "),
);
console.log(
  `\nDaneo words beyond the list: ${beyondList.length} of ${words.length}`,
  "(phrases, Konglish, proper nouns, culture words — expected)",
);

const gapA = missing.get("A")!;
console.log(
  `\nGenuinely missing grade-A words by frequency rank (${gapA.length} total):`,
);
for (const w of gapA.slice(0, 40))
  console.log(`  ${String(w.rank).padStart(5)}  ${w.base} (${w.pos})`);

// Allowlist hygiene: entries that went stale (now covered by a real word
// entry) or that don't match any NIKL headword (typo) should be removed.
const stale = [...taughtAs.keys()].filter((w) => daneoKo.has(w));
const unknown = [...taughtAs.keys()].filter((w) => !byBase.has(w));
if (stale.length)
  console.log(`\nWARN stale allowlist entries (now real words): ${stale.join(", ")}`);
if (unknown.length)
  console.log(`WARN allowlist entries not on the NIKL list: ${unknown.join(", ")}`);
