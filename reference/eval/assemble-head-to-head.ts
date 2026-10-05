// Apply the same result postprocessor and schema as the Explore desktop adapter.
import { readFileSync, writeFileSync } from 'node:fs';
import { translationResultSchema } from '../../src/lib/schemas.ts';
import { postprocessTranslation } from '../../src/lib/translation-postprocess.ts';

const [engine, itemSet] = process.argv.slice(2);
if (!['base', 'fine-tune'].includes(engine) || !['independent', 'v0', 'v2'].includes(itemSet)) {
  throw new Error('Usage: node --import tsx reference/eval/assemble-head-to-head.ts {base|fine-tune} {independent|v0|v2}');
}
const prefix = `reference/eval/raw/head-to-head-${engine}-${itemSet}`;
const readRows = (suffix: string) => readFileSync(`${prefix}-${suffix}.jsonl`, 'utf8').trim().split('\n').map(line => JSON.parse(line));
const native = readRows('results');
const raw = readRows('raw');
if (native.length !== raw.length + 1 || native.at(-1)?.id !== 'cancel-demo') {
  throw new Error('Native and raw row counts do not align');
}
const strict = translationResultSchema.omit({ romanization: true, particles: true }).strict();
const output = native.slice(0, -1).map((row, index) => {
  const reply = raw[index];
  if (row.id !== reply.requestId) throw new Error(`Raw mismatch at ${index}`);
  const parsed = row.outcome.ok ? row.outcome.result : null;
  let rawMatches = false;
  try { rawMatches = JSON.stringify(JSON.parse(reply.rawReply)) === JSON.stringify(parsed); }
  catch { /* incomplete raw reply stays in the evidence */ }
  // JSON key order can differ between the model text and Rust's parsed value.
  if (parsed && !rawMatches) {
    const normalize = (value: unknown): unknown => Array.isArray(value) ? value.map(normalize)
      : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, normalize(v)])) : value;
    try { rawMatches = JSON.stringify(normalize(JSON.parse(reply.rawReply))) === JSON.stringify(normalize(parsed)); }
    catch { /* retain false */ }
  }
  const owned = parsed && typeof parsed === 'object' ? Object.fromEntries(Object.entries(parsed).filter(([key]) => key !== 'romanization' && key !== 'particles')) : null;
  const strictValid = owned !== null && reply.complete === true && strict.safeParse(owned).success;
  const assembled = strictValid ? postprocessTranslation({ ...parsed, direction: row.direction }) : null;
  return {
    id: row.id, rawMatches, strictValid, postprocessorValid: assembled !== null,
    schemaValid: translationResultSchema.safeParse(assembled).success,
    directionCorrect: assembled?.direction === row.direction,
    assembled,
  };
});
writeFileSync(`${prefix}-assembled.json`, JSON.stringify(output, null, 2) + '\n', { flag: 'wx' });
console.log(`${engine} ${itemSet}: ${output.length - 1} held-out rows assembled; ${output.slice(1).filter(row => row.schemaValid).length} schema-valid`);
