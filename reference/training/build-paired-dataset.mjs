// Paired, corpus-aligned candidates. Review is required before training.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const normalize = value => value.normalize('NFKC').toLowerCase().replace(/[\p{White_Space}\p{Punctuation}]/gu, '');
const join = chunks => chunks.map(chunk => chunk.t.trim()).filter(Boolean).join(' ');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const patternText = value => value.normalize('NFKC').replace(/\s+/gu, '');
const directions = ['en-to-ko', 'ko-to-en'];

export function crossTable(items) {
  const cells = new Map();
  for (const row of items) {
    const cell = { split: row.split, direction: row.target.direction,
      errorClass: row.errorClass, nonEmptyGap: Boolean(row.target.literal_gap.trim()),
      glossShape: row.target.gloss.length >= 2 ? 'multi-chunk' : 'single-chunk' };
    const key = JSON.stringify(cell);
    if (!cells.has(key)) cells.set(key, { ...cell, count: 0 });
    cells.get(key).count++;
  }
  return [...cells.values()];
}

export function validatePairedSupervision(items, minimum = 150) {
  const gaps = items.filter(row => row.target.literal_gap.trim());
  assert.ok(gaps.length >= minimum, 'insufficient paired gap supervision');
  assert.ok(gaps.every(row => row.target.gloss.length >= 2), 'gap has a single-chunk gloss');
  const english = gaps.filter(row => row.target.direction === 'en-to-ko').length;
  assert.ok(english / gaps.length >= 0.3 && english < gaps.length,
    'gap supervision must include both directions and at least 30% en-to-ko');
  const bySource = new Map();
  for (const row of items) {
    assert.ok(row.target.gloss.every(part => part.chunk.trim() && part.gloss.trim()), 'empty alignment');
    assert.equal(row.target.gloss.map(part => part.chunk).join(' '), row.korean, 'gloss does not align to Korean');
    const pair = bySource.get(row.corpusSentenceId) ?? [];
    pair.push(row);
    bySource.set(row.corpusSentenceId, pair);
  }
  for (const pair of bySource.values()) {
    assert.equal(pair.length, 2, 'each anchor needs exactly two directions');
    assert.deepEqual(pair.map(row => row.target.direction).sort(), [...directions].sort());
    const { direction: a, ...first } = pair[0].target;
    const { direction: b, ...second } = pair[1].target;
    assert.deepEqual(first, second, 'direction pair has different targets');
    assert.equal(pair[0].split, pair[1].split, 'direction pair crosses splits');
  }
}

export function buildPairedCandidates({ source, gapSource, corpusBytes, gapBytes, corpusCommit, excluded, modelSchema }) {
  // The existing 40-row development split is frozen and never enters training.
  const developmentBytes = readFileSync(new URL('./development-v2.json', import.meta.url));
  const used = excluded.map(keys => new Set(keys));
  for (const row of JSON.parse(developmentBytes).items) {
    used[0].add(row.corpusSentenceId);
    used[1].add(normalize(row.english));
    used[2].add(normalize(row.korean));
  }
  // Ordinary 'friend' in these anchors has no literal/real contrast.
  const patterns = gapSource.filter(gap => gap.id !== 'g19_chingu').flatMap(gap => gap.ko.split('/').map(part => part.trim())
    .filter(part => part.length >= 2 && !part.includes('·'))
    .map(part => ({ gap, part, pattern: patternText(part) })));
  const decisionsBytes = readFileSync(new URL('./paired-target-decisions.json', import.meta.url));
  const decisions = JSON.parse(decisionsBytes).decisions;
  const gapsById = new Map(gapSource.map(gap => [gap.id, gap]));
  const items = [];
  for (const sentence of source) {
    const korean = join(sentence.ko), english = join(sentence.en);
    const keys = [sentence.id, normalize(english), normalize(korean)];
    if (keys.some((key, index) => !key || used[index].has(key))) continue;
    const chunks = sentence.ko.filter(chunk => chunk.t.trim());
    if (chunks.length < 2) continue;
    // Prefer the most specific pattern when several project-owned entries match.
    const matches = patterns.filter(({ pattern }) => patternText(korean).includes(pattern))
      .sort((a, b) => b.pattern.length - a.pattern.length || a.gap.id.localeCompare(b.gap.id));
    if (!matches.length) continue;
    const decision = decisions[sentence.id];
    if (!decision || decision.action !== 'retain') continue;
    const gap = gapsById.get(decision.sourceGapId);
    const part = decision.matchedPattern;
    assert.ok(gap && patternText(korean).includes(patternText(part)), 'reviewed pattern does not occur in anchor');
    const aligned = new Map(sentence.gloss.map(chunk => [chunk.id, chunk]));
    assert.equal(aligned.size, sentence.gloss.length, 'duplicate source gloss ID');
    const gloss = chunks.map(chunk => {
      assert.ok(aligned.get(chunk.id)?.t.trim(), 'missing source alignment');
      return { chunk: chunk.t.trim(), gloss: aligned.get(chunk.id).t.trim(), role: chunk.role };
    });
    // Contextual authoring is explicit and reviewable; never turn an arbitrary
    // substring or a gloss echo into an explanation automatically.
    const literalGap = decision.literalGap;
    assert.ok(literalGap?.trim(), 'retained gap needs a contextual explanation');
    for (const direction of directions) {
      const target = modelSchema.parse({ direction, korean, natural_english: english, gloss,
        literal_gap: literalGap, cultural_note: '' });
      items.push({ id: `DAN-PAIRED-${String(items.length + 1).padStart(3, '0')}`,
        split: 'training', reviewStatus: 'pending', errorClass: 'literal-gap',
        corpusSentenceId: sentence.id, english, korean,
        input: direction === 'ko-to-en' ? korean : english, target,
        sourceGapId: gap.id, matchedPattern: part, sourceNote: sentence.note,
        matchingMethod: gap.id === matches[0].gap.id ? 'reviewed-substring' : 'reviewed-construction',
        sourceGap: { korean: gap.ko, literal: gap.lit, natural: gap.real, note: gap.note },
        matchedGapIds: [...new Set(matches.map(match => match.gap.id))] });
    }
    keys.forEach((key, index) => used[index].add(key));
  }
  // Retain reviewed no-gap supervision too: a fix must not teach every reply
  // to invent a contrast. Existing targets remain unchanged apart from direction.
  for (const row of JSON.parse(readFileSync(new URL('./dataset-v2.json', import.meta.url))).items) {
    if (row.target.literal_gap.trim() || row.target.gloss.length < 2
      || decisions[row.corpusSentenceId]?.action === 'drop') continue;
    const keys = [row.corpusSentenceId, normalize(row.english), normalize(row.korean)];
    if (keys.some((key, index) => !key || used[index].has(key))) continue;
    for (const direction of directions) {
      items.push({ ...row, id: `DAN-PAIRED-${String(items.length + 1).padStart(3, '0')}`,
        split: 'training', reviewStatus: 'pending',
        target: modelSchema.parse({ ...row.target, direction }),
        input: direction === 'ko-to-en' ? row.korean : row.english,
        sourceGapId: null, previousReviewedId: row.id });
    }
    keys.forEach((key, index) => used[index].add(key));
  }
  validatePairedSupervision(items);
  const dataset = { version: 'paired-1-candidates', corpusCommit, trainingAllowed: false,
    purpose: 'Review pending; development-only experiment; no gate claim', items };
  const bytes = `${JSON.stringify(dataset, null, 2)}\n`;
  writeFileSync(new URL('./dataset-paired-candidates.json', import.meta.url), bytes);
  const manifest = { version: dataset.version, corpusCommit, trainingAllowed: false,
    dataset: 'dataset-paired-candidates.json', sha256: sha(bytes), count: items.length,
    anchorCount: items.length / 2, distinctGapEntries: new Set(items.map(row => row.sourceGapId).filter(Boolean)).size,
    sources: { 'src/content/sentences.json': sha(corpusBytes), 'src/content/gap.json': sha(gapBytes) },
    development: { file: 'development-v2.json', sha256: sha(developmentBytes), frozen: true },
    exclusions: { reservationCount: 136, developmentCount: 40, match: 'ID and normalized English/Korean' },
    crossTable: crossTable(items),
    targetDecisions: { file: 'paired-target-decisions.json', sha256: sha(decisionsBytes),
      retained: Object.values(decisions).filter(row => row.action === 'retain').length,
      dropped: Object.values(decisions).filter(row => row.action === 'drop').length },
    review: 'Pending independent review of authored explanations and paired targets',
    provenance: 'Project-owned corpus chunks aligned by ID and reviewed gap entries; no learner records or outside translations' };
  writeFileSync(new URL('./dataset-paired-manifest.json', import.meta.url), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`PASS: ${items.length} paired candidates / ${items.length / 2} anchors; both directions; review pending, training forbidden`);
}
