// Ring 2 planning ledger — validates reference/ring2-slices.tsv (the
// word→module assignment file, filled in per-module at authoring time) and
// reports progress against the grade-B pool. Scoped with Nick 2026-08-10:
// trimmed contract, three bands (CURRICULUM.md §2b), slice-and-hand-author
// pipeline. Run: npm run ring2:plan [-- --pool 40]

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// ---- the NIKL list, collapsed to best-grade distinct headwords ----
const gradePriority = { A: 0, B: 1, C: 2 } as const;
type Grade = keyof typeof gradePriority;
const byBase = new Map<string, { rank: number; grade: Grade; pos: string }>();
for (const line of readFileSync(join(root, "reference/nikl-5965.tsv"), "utf-8")
  .trimEnd()
  .split("\n")
  .slice(1)) {
  const [rankS, word, pos, , grade] = line.split("\t");
  const rank = Number(rankS) || 0;
  const base = word.replace(/\d+$/, "").replace(/\(.*\)$/, "");
  const prior = byBase.get(base);
  if (
    !prior ||
    gradePriority[grade as Grade] < gradePriority[prior.grade] ||
    (grade === prior.grade && rank < prior.rank)
  )
    byBase.set(base, { rank, grade: grade as Grade, pos });
}

const daneoKo = new Set(
  (
    JSON.parse(readFileSync(join(root, "src/content/words.json"), "utf-8")) as {
      ko: string;
    }[]
  ).map((w) => w.ko),
);
const shippedModules = new Set(
  (
    JSON.parse(
      readFileSync(join(root, "src/content/modules.json"), "utf-8"),
    ) as { id: string }[]
  ).map((m) => m.id),
);

// ---- the assignment ledger ----
interface Slice {
  word: string;
  module: string;
  band: string;
  note: string;
}
const slices: Slice[] = readFileSync(
  join(root, "reference/ring2-slices.tsv"),
  "utf-8",
)
  .trimEnd()
  .split("\n")
  .slice(1)
  .filter((l) => l.trim())
  .map((l) => {
    const [word, module, band, note = ""] = l.split("\t");
    return { word, module, band, note };
  });

// ---- validation ----
const errors: string[] = [];
const seen = new Map<string, string>();
for (const s of slices) {
  const prior = seen.get(s.word);
  if (prior && prior !== s.module)
    errors.push(`${s.word} assigned to both ${prior} and ${s.module}`);
  seen.set(s.word, s.module);
  const nikl = byBase.get(s.word);
  if (!nikl) errors.push(`${s.word} (${s.module}) is not on the NIKL list`);
  else if (nikl.grade === "A" && !daneoKo.has(s.word))
    errors.push(`${s.word} (${s.module}) is grade A — that's Ring 1 debt, not Ring 2`);
  if (daneoKo.has(s.word) && !shippedModules.has(s.module))
    errors.push(
      `${s.word} already taught but its module ${s.module} hasn't shipped — stale row?`,
    );
}

// ---- progress ----
const bGaps = [...byBase.entries()]
  .filter(([base, w]) => w.grade === "B" && !daneoKo.has(base))
  .map(([base, w]) => ({ base, ...w }))
  .sort((a, b) => a.rank - b.rank);
const assigned = new Set(slices.map((s) => s.word));
const pool = bGaps.filter((w) => !assigned.has(w.base));

const perModule = new Map<string, { count: number; band: string }>();
for (const s of slices) {
  const m = perModule.get(s.module) ?? { count: 0, band: s.band };
  m.count++;
  perModule.set(s.module, m);
}

console.log("Ring 2 plan — grade-B assignment ledger");
console.log("=".repeat(60));
const bShipped = bGaps.length === 0 ? 0 : undefined;
const taughtB = [...byBase.entries()].filter(
  ([base, w]) => w.grade === "B" && daneoKo.has(base),
).length;
console.log(
  `Grade B distinct headwords taught: ${taughtB} · assigned-not-yet-shipped: ${
    [...assigned].filter((w) => !daneoKo.has(w)).length
  } · unassigned pool: ${pool.length}`,
);
for (const [module, { count, band }] of [...perModule.entries()].sort()) {
  const status = shippedModules.has(module) ? "SHIPPED" : "planned";
  console.log(`  ${module} (band ${band}): ${count} words — ${status}`);
}

const poolN = Number(process.argv[process.argv.indexOf("--pool") + 1]) || 40;
console.log(`\nTop of the unassigned pool (next ${poolN} by rank):`);
for (const w of pool.slice(0, poolN))
  console.log(`  ${String(w.rank).padStart(5)}  ${w.base} (${w.pos})`);

if (errors.length) {
  console.log(`\n${errors.length} LEDGER ERROR(S):`);
  for (const e of errors) console.log("  ✗ " + e);
  process.exitCode = 1;
} else {
  console.log("\nLedger clean.");
}
