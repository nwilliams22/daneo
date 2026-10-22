import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { translationResultSchema } from '../../src/lib/schemas.ts';
import { postprocessTranslation } from '../../src/lib/translation-postprocess.ts';
const root = new URL('./evidence/paired-development-replay/', import.meta.url);
const read = name => readFileSync(new URL(name, root), 'utf8');
const hash = text => createHash('sha256').update(text).digest('hex');
const manifest = JSON.parse(read('manifest.json'));
assert.equal(manifest.exitCode, 0);
assert.equal(hash(read('inputs.json')), manifest.fixtureSha256);
const inputs = JSON.parse(read('inputs.json')).items;
const results = read('results.jsonl').trim().split('\n').map(JSON.parse);
const raw = read('raw.jsonl').trim().split('\n').map(JSON.parse);
assert.equal(inputs.length, 10);
assert.equal(results.length, 10);
assert.equal(new Set(results.map(r => r.id)).size, 10);
const strict = translationResultSchema.omit({ romanization: true, particles: true }).strict();
const rows = inputs.map(input => {
  const result = results.find(r => r.id === input.id);
  const replies = raw.filter(r => r.requestId === input.id);
  assert.equal(replies.length, 1);
  const reply = replies[0];
  assert.equal(reply.complete, true);
  assert.equal(result.input, input.input);
  assert.equal(result.direction, input.direction);
  assert.equal(result.outcome.ok, true);
  assert.deepEqual(JSON.parse(reply.rawReply), result.outcome.result);
  for (const [key, value] of Object.entries({ head: manifest.sourceCommit,
    modelSha256: manifest.modelSha256, modelBytes: manifest.modelBytes,
    itemSetSha256: manifest.fixtureSha256, promptSha256: manifest.promptSha256,
    rubricSha256: manifest.rubricSha256 })) assert.equal(reply.provenance[key], value);
  const { romanization, particles, ...owned } = result.outcome.result;
  strict.parse(owned);
  const assembled = postprocessTranslation(result.outcome.result);
  translationResultSchema.parse(assembled);
  assert.equal(assembled.direction, input.direction);
  return { id: input.id, schemaComplete: true, directionCorrect: true,
    nonEmptyGap: owned.literal_gap.trim().length > 0, multiChunk: owned.gloss.length > 1,
    completionMs: result.completionMs, firstTokenMs: result.firstTokenMs };
});
const report = { purpose: 'Development contract and emission metrics only; semantic correctness is reviewed separately',
  rows, counts: { total: rows.length, schemaComplete: rows.length,
    nonEmptyGap: rows.filter(r => r.nonEmptyGap).length,
    gapPlusMultiChunk: rows.filter(r => r.nonEmptyGap && r.multiChunk).length } };
writeFileSync(new URL('contract-summary.json', root), JSON.stringify(report, null, 2)+'\n');
console.log('PASS:', JSON.stringify(report.counts));
