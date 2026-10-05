// Audit how the training data supervises the literal-gap field.
//
// Both fine-tunes scored 3/10 on literal gap while reaching 9-10/10 on the other
// five dimensions, and the v2 artifact emitted an empty literal_gap on all ten
// gate items. This script is the source of truth for why: it cross-tabulates
// literal_gap against direction and against gloss shape, which the dataset
// manifests record only as independent marginals.
//
// Run: node reference/training/audit-gap-supervision.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const read = path => JSON.parse(readFileSync(`${ROOT}${path}`, 'utf8'));
const FILES = process.argv.length > 2 ? process.argv.slice(2) : [
  'reference/training/dataset-v1.json',
  'reference/training/dataset-v2.json',
  'reference/training/development-v2.json',
];

const hasGap = item => (item.target.literal_gap || '').trim().length > 0;
const rows = [];
for (const file of FILES) for (const item of read(`/${file}`).items) rows.push({ file, item });

const table = (label, keyOf) => {
  const counts = new Map();
  for (const { item } of rows) {
    const key = keyOf(item);
    const cell = counts.get(key) ?? [0, 0];
    cell[0] += 1;
    if (hasGap(item)) cell[1] += 1;
    counts.set(key, cell);
  }
  console.log(`\n${label}`);
  for (const [key, [total, gap]] of [...counts].sort()) {
    console.log(`  ${key.padEnd(34)} rows=${String(total).padStart(4)}  with a literal gap=${String(gap).padStart(4)}`);
  }
};

console.log(`Rows in selected audit files: ${rows.length}`);
console.log(`Rows carrying a non-empty literal_gap: ${rows.filter(r => hasGap(r.item)).length}`);

table('By direction:', item => item.target.direction);
table('By error class:', item => item.errorClass ?? 'unlabelled');
table('By direction and error class:', item => `${item.target.direction} / ${item.errorClass ?? 'unlabelled'}`);

// The rubric requires an aligned multi-chunk gloss AND a literal gap on the same
// reply. The gap rows are built with the whole sentence as one chunk, so the two
// requirements almost never appear together in the supervision.
const gapRows = rows.filter(r => hasGap(r.item));
const singleChunk = gapRows.filter(r => r.item.target.gloss.length < 2);
console.log(`\nGap rows whose gloss is a single chunk: ${singleChunk.length}/${gapRows.length}`);
console.log(`Rows showing BOTH an aligned multi-chunk gloss AND a non-empty literal_gap: ${gapRows.length - singleChunk.length}/${rows.length}`);

// How many uncounfounded rows could be built instead: a corpus sentence that
// already carries a human multi-chunk gloss and also exhibits a reviewed gap
// pattern. Substring matching is a deliberate lower bound; it misses inflected
// forms, so a real build finds more anchors, never fewer.
const normalize = text => String(text).replace(/\s+/gu, '');
const joinKorean = sentence => (Array.isArray(sentence.ko)
  ? sentence.ko.map(chunk => chunk.t ?? chunk).join(' ') : String(sentence.ko));
const patterns = [];
for (const entry of read('/src/content/gap.json')) {
  for (const part of String(entry.ko).split('/').map(text => text.trim())) {
    if (part.length >= 2) patterns.push({ id: entry.id, pattern: normalize(part) });
  }
}
const sentences = read('/src/content/sentences.json');
const anchors = [];
const reachable = new Set();
for (const sentence of sentences) {
  const korean = normalize(joinKorean(sentence));
  const hits = patterns.filter(({ pattern }) => korean.includes(pattern));
  if (!hits.length) continue;
  anchors.push(sentence.id);
  for (const { id } of hits) reachable.add(id);
}
console.log(`\nBuildable instead, as a lower bound:`);
console.log(`  glossed corpus sentences that exhibit a reviewed gap pattern: ${anchors.length}/${sentences.length}`);
console.log(`  distinct gap.json entries reachable from a glossed sentence:  ${reachable.size}/${read('/src/content/gap.json').length}`);
console.log(`  rows available across both directions:                       ${anchors.length * 2}`);
