import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { translationResultSchema } from '../../src/lib/schemas.ts';
import { postprocessTranslation } from '../../src/lib/translation-postprocess.ts';
const root = new URL('../../.local-models/compatibility/', import.meta.url);
const prefix = process.argv.includes('--q8') ? 'runtime-q8' : process.argv.includes('--bf16') ? 'runtime-bf16' : 'runtime';
const rows = readFileSync(new URL(`${prefix}-results.jsonl`, root), 'utf8').trim().split('\n').map(JSON.parse);
const row = rows.find(row => row.id === 'compatibility-smoke');
assert.equal(row?.outcome?.ok, true, JSON.stringify(row));
const assembled = postprocessTranslation(row.outcome.result);
translationResultSchema.parse(assembled);
assert.equal(assembled.direction, row.direction);
writeFileSync(new URL(`${prefix}-schema-result.json`, root), JSON.stringify({
  input: row.input, direction: row.direction, completionMs: row.completionMs,
  firstTokenMs: row.firstTokenMs, assembled, schemaValid: true,
}, null, 2) + '\n');
console.log('PASS: one non-held-out production worker response, deterministic postprocessing and assembled app schema');
