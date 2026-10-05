import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { translationResultSchema } from '../../src/lib/schemas.ts';
import { postprocessTranslation } from '../../src/lib/translation-postprocess.ts';
const strict = translationResultSchema.omit({ romanization: true, particles: true }).strict();
if (process.argv.includes('--dataset')) {
  for (const name of process.argv.includes('--v2') ? ['dataset-v2', 'development-v2'] : ['dataset-v1']) {
    const dataset = JSON.parse(readFileSync(new URL(`./${name}.json`, import.meta.url)));
    for (const row of dataset.items) strict.parse(row.target);
    console.log(`PASS: ${name}: ${dataset.items.length} strict targets`);
  }
} else {
  const nameIndex = process.argv.indexOf('--name');
  const name = nameIndex >= 0 ? process.argv[nameIndex + 1] : process.argv.includes('--probe') ? 'v1-probe' : 'v1';
  assert.match(name, /^[a-z0-9-]+$/);
  const root = new URL(process.argv.includes('--evidence') ? `./evidence/${name}/` : `../../.local-models/${name}/`, import.meta.url);
  const read = name => readFileSync(new URL(name, root), 'utf8');
  const row = read('runtime-results.jsonl').trim().split('\n').map(JSON.parse).find(r => r.id === 'compatibility-smoke');
  const raw = read('runtime-raw.jsonl').trim().split('\n').map(JSON.parse).find(r => r.requestId === 'compatibility-smoke');
  assert.equal(row?.outcome?.ok, true);
  assert.equal(raw?.complete, true);
  assert.deepEqual(JSON.parse(raw.rawReply), row.outcome.result);
  const artifact = JSON.parse(read('export-result.json')).artifacts.find(r => r.path === 'candidate-Q8_0.gguf');
  assert.equal(raw.provenance.modelSha256, artifact.sha256);
  assert.equal(raw.provenance.modelBytes, artifact.bytes);
  const { romanization, particles, ...owned } = row.outcome.result;
  const assembled = postprocessTranslation(row.outcome.result);
  const report = { strict: strict.safeParse(owned).success, postprocessor: assembled !== null,
    assembled: translationResultSchema.safeParse(assembled).success, direction: assembled?.direction === row.direction,
    completionMs: row.completionMs, firstTokenMs: row.firstTokenMs };
  report.passed = report.strict && report.postprocessor && report.assembled && report.direction;
  writeFileSync(new URL('schema-result.json', root), JSON.stringify(report, null, 2)+'\n');
  assert.equal(report.passed, true, JSON.stringify(report));
  console.log('PASS:', report);
}
