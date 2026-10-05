// Generate reviewed model-owned translation targets from a pinned shipped corpus.
// Run from the repository root: node --import tsx reference/training/build-dataset.mjs
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { translationResultSchema } from '../../src/lib/schemas.ts';

const v2 = process.argv.includes('--v2-candidates');
const corpusCommit = v2 ? '5f5bef477b19eb4799d247352930589542a256a8' : '6587c1f9ef471eb9e50b7059fd99ee745d4c2a64';
let rows = [
  ['s_go_home', 'gloss'], ['s2_library_study', 'gloss'],
  ['s2_friend_movie', 'gloss'], ['s3_mart_fruit', 'gloss'],
  ['s3_order_bibimbap', 'gloss'], ['s3_lunch_ramyeon', 'gloss'],
  ['s5_monday_school', 'gloss'], ['s6_book_desk', 'gloss'],
  ['s6_cafe_between', 'gloss'], ['s11_summer_swim', 'gloss'],
  ['s2_milk_bread', 'semantic-fidelity'],
  ['s6_subway_work', 'semantic-fidelity'],
  ['s7_coffee_expensive_but', 'semantic-fidelity'],
  ['s10_cant_drive', 'semantic-fidelity'],
  ['s10_homework_must', 'semantic-fidelity'],
  ['s12_missed_bus', 'semantic-fidelity'],
  ['s3_friend_bulgogi', 'register'], ['s4_dad_cooks', 'register'],
  ['s4_eonni_doctor', 'register'], ['s7_weather_warm', 'register'],
  ['s8_get_up', 'register'], ['s8_tomorrow_rest', 'register'],
];
let gapIds = ['g_masisseoyo', 'g_baegopayo', 'g2_jal_jinae', 'g_nunchi', 'g11_rain_comes'];
const koToEnIds = new Set(['s6_subway_work', 's10_homework_must', 's12_missed_bus']);
const modelSchema = translationResultSchema.omit({ romanization: true, particles: true }).strict();
const corpusBytes = readFileSync('src/content/sentences.json');
assert.equal(createHash('sha256').update(corpusBytes).digest('hex'),
  'de6425ee0426b0f8adfa0bc908159054b1ea3f3743016ae14295a3df40069957',
  'working corpus differs from pinned commit');
const source = JSON.parse(corpusBytes);
const byId = new Map(source.map(row => [row.id, row]));
const gapBytes = readFileSync('src/content/gap.json');
assert.equal(createHash('sha256').update(gapBytes).digest('hex'),
  '0670aa56f1b8526a6f11b771e8d22b22ff63bbf3e5af285d7650c36d3d90869b',
  'working gap corpus differs from pinned commit');
const gapSource = JSON.parse(gapBytes);
const gapById = new Map(gapSource.map(row => [row.id, row]));
const join = chunks => chunks.map(chunk => chunk.t.trim()).filter(Boolean).join(' ');
const normalized = value => value.normalize('NFKC').toLowerCase().replace(/[\p{White_Space}\p{Punctuation}]/gu, '');
const reservations = ['v0', 'v1', 'dev', 'v2'].flatMap(name =>
  JSON.parse(readFileSync(`reference/eval/${name}-translation-set.json`)).items.map(row => ({
    corpusSentenceId: row.corpusSentenceId, english: row.expectedReadingEnglish,
    korean: row.corpusAnchor.korean,
  })));
const heldOutBytes = readFileSync('reference/eval/training-independent-set.json');
const heldOutSha256 = createHash('sha256').update(heldOutBytes).digest('hex');
assert.equal(readFileSync('reference/eval/training-independent-set.sha256', 'utf8'),
  `${heldOutSha256}  training-independent-set.json\n`, 'independent freeze changed');
reservations.push(...JSON.parse(heldOutBytes).items);
assert.equal(reservations.length, 96, 'reservation count changed');
const excluded = [new Set(reservations.map(row => row.corpusSentenceId)),
  new Set(reservations.map(row => normalized(row.english))),
  new Set(reservations.map(row => normalized(row.korean)))];

// Candidate selection is deterministic and does not expose reserved text.
// V2 is deliberately not a training artifact until every target is reviewed.
const developmentIds = new Set();
if (v2) {
  for (const [path, bytes] of [['src/content/sentences.json', corpusBytes], ['src/content/gap.json', gapBytes]]) {
    assert.ok(execFileSync('git', ['show', `${corpusCommit}:${path}`], { maxBuffer: 16 * 1024 * 1024 }).equals(bytes),
      `${path}: pinned commit differs from working bytes`);
  }
  const used = excluded.map(keys => new Set(keys));
  // A new development split must also avoid examples used by the v1 model.
  for (const row of JSON.parse(readFileSync(new URL('./dataset-v1.json', import.meta.url))).items) {
    used[0].add(row.corpusSentenceId);
    used[1].add(normalized(row.english));
    used[2].add(normalized(row.korean));
  }
  const select = (id, english, korean) => {
    const keys = [id, normalized(english), normalized(korean)];
    if (keys.some((key, i) => !key || used[i].has(key))) return false;
    keys.forEach((key, i) => used[i].add(key));
    return true;
  };
  rows = [];
  gapIds = [];
  koToEnIds.clear();
  for (const gap of gapSource) {
    if (gapIds.length === 110) break;
    if (/[\/·]/u.test(gap.ko) || !select(`gap:${gap.id}`, gap.real, gap.ko)) continue;
    if (gapIds.length >= 100) developmentIds.add(`gap:${gap.id}`);
    gapIds.push(gap.id);
  }
  assert.equal(gapIds.length, 110, 'insufficient distinct gap candidates');
  for (const [cls, quota] of [['register', 60], ['gloss', 45], ['semantic-fidelity', 45]]) {
    let count = 0;
    for (const sentence of source) {
      if (count === quota + 10) break;
      const korean = join(sentence.ko);
      if (sentence.ko.filter(chunk => chunk.t.trim()).length < 2) continue;
      if (cls === 'register' && !/요[.!?]?$/u.test(korean)) continue;
      if (!select(sentence.id, join(sentence.en), korean)) continue;
      if (count >= quota) developmentIds.add(sentence.id);
      if (count % 2) koToEnIds.add(sentence.id);
      rows.push([sentence.id, cls]);
      count++;
    }
    assert.equal(count, quota + 10, `insufficient ${cls} candidates`);
  }
}

assert.equal(new Set(rows.map(([id]) => id)).size, rows.length, 'duplicate selected sentence');
const items = rows.map(([id, errorClass], index) => {
  const sentence = byId.get(id);
  assert.ok(sentence, `missing corpus sentence ${id}`);
  const glossById = new Map(sentence.gloss.map(chunk => [chunk.id, chunk]));
  const koChunks = sentence.ko.filter(chunk => chunk.t.trim());
  assert.ok(koChunks.length >= 2, `${id}: too few Korean chunks`);
  assert.equal(glossById.size, sentence.gloss.length, `${id}: duplicate gloss ID`);
  const gloss = koChunks.map(chunk => {
    const aligned = glossById.get(chunk.id);
    assert.ok(aligned?.t.trim(), `${id}: missing aligned gloss for ${chunk.id}`);
    return { chunk: chunk.t.trim(), gloss: aligned.t.trim(), role: chunk.role };
  });
  const english = join(sentence.en);
  const korean = join(sentence.ko);
  assert.ok(english && korean, `${id}: missing source text`);
  assert.ok(!excluded[0].has(id) && !excluded[1].has(normalized(english))
    && !excluded[2].has(normalized(korean)), `${id}: reserved evaluation anchor`);
  const target = modelSchema.parse({
    direction: koToEnIds.has(id) ? 'ko-to-en' : 'en-to-ko',
    korean, natural_english: english, gloss,
    literal_gap: '', cultural_note: '',
  });
  return { id: `DAN-TRAIN-${String(index + 1).padStart(3, '0')}`, errorClass,
    corpusSentenceId: id, english, korean,
    input: koToEnIds.has(id) ? korean : english, target };
});
for (const id of gapIds) {
  const gap = gapById.get(id);
  assert.ok(gap, `missing corpus gap ${id}`);
  const english = gap.real;
  const korean = gap.ko;
  assert.ok(!excluded[1].has(normalized(english)) && !excluded[2].has(normalized(korean)),
    `${id}: reserved evaluation text`);
  assert.ok(!/[\/·]/u.test(korean), `${id}: ambiguous Korean alternatives`);
  const target = modelSchema.parse({
    direction: 'ko-to-en', korean, natural_english: english,
    gloss: [{ chunk: korean, gloss: gap.lit, role: 'other' }],
    literal_gap: `Literally “${gap.lit}”; in use, “${gap.real}”.`, cultural_note: '',
  });
  items.push({ id: `DAN-TRAIN-${String(items.length + 1).padStart(3, '0')}`,
    errorClass: 'literal-gap', corpusSentenceId: `gap:${id}`, english, korean,
    input: korean, target });
}
for (const key of ['corpusSentenceId', 'english', 'korean']) {
  const values = items.map(item => key === 'corpusSentenceId' ? item[key] : normalized(item[key]));
  assert.equal(new Set(values).size, items.length, `duplicate dataset ${key}`);
}

if (v2) {
  for (const item of items) {
    item.id = item.id.replace('DAN-TRAIN-', 'DAN-V2-CANDIDATE-');
    item.split = developmentIds.has(item.corpusSentenceId) ? 'development' : 'training';
    item.reviewStatus = 'pending';
    item.sourceNote = item.corpusSentenceId.startsWith('gap:')
      ? gapById.get(item.corpusSentenceId.slice(4)).note : byId.get(item.corpusSentenceId).note;
  }
  const bytes = Buffer.from(`${JSON.stringify({ version: 'training-2-candidates', corpusCommit,
    trainingAllowed: false, items }, null, 2)}\n`);
  writeFileSync(new URL('./dataset-v2-candidates.json', import.meta.url), bytes);
  console.log(`PASS: ${items.length} schema-valid candidates; 250 training / 40 development; REVIEW PENDING; training forbidden`);
  process.exit(0);
}

// Run the independent checker on this file before accepting or training on it.
const out = new URL('./dataset-v1.json', import.meta.url);
const bytes = Buffer.from(`${JSON.stringify({ version: 'training-1', corpusCommit, items }, null, 2)}\n`);
writeFileSync(out, bytes);
const counts = Object.fromEntries(['gloss', 'semantic-fidelity', 'register', 'literal-gap'].map(cls => [cls, items.filter(item => item.errorClass === cls).length]));
const directionCounts = Object.fromEntries(['en-to-ko', 'ko-to-en'].map(direction =>
  [direction, items.filter(item => item.target.direction === direction).length]));
const manifest = {
  version: 'training-1', corpusCommit,
  sources: ['src/content/sentences.json', 'src/content/gap.json'],
  dataset: 'dataset-v1.json', sha256: createHash('sha256').update(bytes).digest('hex'),
  count: items.length, counts, directionCounts,
  schema: `strict model-owned translationResultSchema: ${items.length}/${items.length} pass`,
  reservations: '96 excluded by reference/eval/check-independent-freeze.py',
  heldOut: {
    file: 'reference/eval/training-independent-set.json', count: 60,
    sha256: heldOutSha256,
    frozenBeforeTraining: true,
  },
  provenance: 'Daneo project-owned shipped sentence and literal-gap content; no learner records or external translations',
  sampledReviewNotes: [
    '001: 집에 marks destination; go stays at the end in 해요 register.',
    '003: 친구하고 is accompaniment, and the unstated I is not invented as Korean.',
    '008: 책상 위에 is the desk topside location, not an object.',
    '013: -지만 preserves the expensive-but-delicious contrast.',
    '014: 수 없어요 preserves inability, not voluntary negation.',
    '019: 언니 denotes an older sister from a female speaker; 의사예요 is polite.',
    '023: 맛있어요 literally has taste-exists structure; ordinary reading is delicious.',
    '025: 잘 지냈어요? asks how someone has been; the literal time-passing sense remains explicit.',
    '027: 비가 와요 says rain comes; the natural English is it is raining.',
  ],
};
writeFileSync(new URL('./dataset-v1-manifest.json', import.meta.url), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`PASS: ${items.length}/${items.length} strict model-owned targets; counts ${JSON.stringify(counts)}`);
