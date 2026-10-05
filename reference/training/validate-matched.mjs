// Validate retained baseline/control/diagnostic evidence without changing it.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { translationResultSchema } from '../../src/lib/schemas.ts';
import { postprocessTranslation } from '../../src/lib/translation-postprocess.ts';
const root = new URL('./evidence/', import.meta.url);
const modelSchema = translationResultSchema.omit({ romanization: true, particles: true }).strict();
const reports = [];
const provenance = [];
for (const prefix of ['runtime', 'runtime-bf16', 'runtime-matched']) {
  const rows = readFileSync(new URL(`${prefix}-results.jsonl`, root), 'utf8').trim().split('\n').map(JSON.parse);
  const row = rows.find(row => row.id === 'compatibility-smoke');
  assert.equal(row?.outcome?.ok, true, JSON.stringify(row));
  const rawRows = readFileSync(new URL(`${prefix}-raw.jsonl`, root), 'utf8').trim().split('\n').map(JSON.parse);
  const raw = rawRows.find(row => row.requestId === 'compatibility-smoke');
  assert.equal(raw?.complete, true);
  assert.deepEqual(JSON.parse(raw.rawReply), row.outcome.result);
  provenance.push(raw.provenance);
  // Particles/romanization remain requested by the unchanged prompt. Test model-owned
  // fields separately from the deterministic production assembly, as in the targets.
  const { romanization, particles, ...modelOwned } = row.outcome.result;
  const strict = modelSchema.safeParse(modelOwned);
  const assembled = postprocessTranslation(row.outcome.result);
  const schema = translationResultSchema.safeParse(assembled);
  reports.push({ prefix, input: row.input, direction: row.direction,
    completionMs: row.completionMs, firstTokenMs: row.firstTokenMs,
    omittedFromModelOwnedCheck: ['romanization', 'particles'],
    strictModelOwnedValid: strict.success, strictIssues: strict.success ? [] : strict.error.issues,
    postprocessorAccepted: assembled !== null, assembled,
    assembledSchemaValid: schema.success, assembledIssues: schema.success ? [] : schema.error.issues,
    directionMatches: assembled?.direction === row.direction });
}
assert.equal(new Set(reports.map(row => row.input)).size, 1);
for (const key of ['promptSha256', 'itemSetSha256', 'rubricSha256']) {
  assert.equal(new Set(provenance.map(row => row[key])).size, 1, key);
}
const exported = JSON.parse(readFileSync(new URL('matched-export-result.json', root), 'utf8'));
const artifact = exported.artifacts.find(row => row.path === 'matched-Q4_K_M.gguf');
assert.equal(provenance.at(-1).modelSha256, artifact.sha256);
assert.equal(provenance.at(-1).modelBytes, artifact.bytes);
writeFileSync(new URL('matched-schema-comparison.json', root), JSON.stringify(reports, null, 2) + '\n');
console.log(reports.map(({ prefix, strictModelOwnedValid, postprocessorAccepted, assembledSchemaValid }) => ({ prefix, strictModelOwnedValid, postprocessorAccepted, assembledSchemaValid })));
const matched = reports.at(-1);
process.exitCode = matched.strictModelOwnedValid && matched.assembledSchemaValid && matched.directionMatches ? 0 : 1;
