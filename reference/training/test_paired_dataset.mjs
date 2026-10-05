import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { validatePairedSupervision, crossTable } from './build-paired-dataset.mjs';
const items = JSON.parse(readFileSync(new URL('./dataset-paired-candidates.json', import.meta.url))).items;
test('paired candidates meet floors and align both directions', () => validatePairedSupervision(items));
test('one-direction defect fails', () => {
  assert.throws(() => validatePairedSupervision(items.filter(row => row.target.direction === 'ko-to-en'), 1), /directions/);
});
test('single-chunk gap defect fails', () => {
  const bad = structuredClone(items);
  bad[0].target.gloss = [{ chunk: bad[0].korean, gloss: bad[0].english, role: 'other' }];
  assert.throws(() => validatePairedSupervision(bad), /single-chunk/);
});
test('misaligned gloss fails', () => {
  const bad = structuredClone(items);
  bad[0].target.gloss[0].chunk = 'unrelated';
  assert.throws(() => validatePairedSupervision(bad), /align/);
});
test('manifest records the full cross-table', () => {
  const manifest = JSON.parse(readFileSync(new URL('./dataset-paired-manifest.json', import.meta.url)));
  assert.deepEqual(manifest.crossTable, crossTable(items));
  assert.equal(manifest.trainingAllowed, false);
  assert.equal(manifest.exclusions.reservationCount, 136);
});
test('gap fields are authored explanations, never the gloss/translation echo', () => {
  for (const row of items.filter(row => row.target.literal_gap.trim())) {
    assert.ok(!row.target.literal_gap.startsWith('Literally, “'));
  }
});
test('reviewed constructions replace misleading substrings and false matches are removed', () => {
  assert.equal(items.find(row => row.corpusSentenceId === 's7_korean_fun_hard').sourceGapId, 'g7_itda_factory');
  assert.equal(items.find(row => row.corpusSentenceId === 's10_korean_little').sourceGapId, 'g10_su_itda');
  assert.ok(!items.some(row => row.corpusSentenceId === 's_m84_room_route'));
});
