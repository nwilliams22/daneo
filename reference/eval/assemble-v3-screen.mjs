/** Apply the same deterministic fields and schema as the learner adapter. */
import { readFileSync, writeFileSync } from 'node:fs';
import { postprocessTranslation, particlesIn } from '../../src/lib/translation-postprocess.ts';
import { romanize } from '../../src/lib/romanize.ts';
const family = process.argv[2];
if (!['midm', 'ax'].includes(family)) throw new Error('usage: node --import tsx reference/eval/assemble-v3-screen.mjs midm|ax');
const prefix = `reference/eval/raw/v3-${family}`;
const raw = readFileSync(`${prefix}-raw.jsonl`, 'utf8').trim().split('\n').map(JSON.parse);
const results = readFileSync(`${prefix}-results.jsonl`, 'utf8').trim().split('\n').map(JSON.parse);
const rows = results.filter(row => row.id.startsWith('DAN-V3-DEV-')).map(row => {
  const response = raw.find(reply => reply.requestId === row.id);
  const assembled = row.outcome?.ok ? postprocessTranslation(row.outcome.result) : null;
  let rawDirection;
  try { rawDirection = JSON.parse(response.rawReply.replace(/```(?:json)?/g, '').trim()).direction; } catch {}
  const rawResult = row.outcome?.ok ? row.outcome.result : null;
  // Diagnostic fields remain rejected: do not repair roles or award schema validity.
  const diagnostic = assembled ?? (typeof rawResult?.korean === 'string' ? {
    ...rawResult, romanization: romanize(rawResult.korean), particles: particlesIn(rawResult.korean),
  } : null);
  return { id: row.id, input: row.input, direction: row.direction, assembled, diagnostic,
    schemaComplete: assembled !== null, directionCorrect: assembled?.direction === row.direction,
    rawDirectionCorrect: rawDirection === row.direction,
    thinkingLeak: /<\/?think>|<\|(?:analysis|channel)\|>/.test(response?.rawReply ?? ''),
    nativeOutcome: row.outcome, provenance: response?.provenance };
});
writeFileSync(`${prefix}-assembled.json`, JSON.stringify(rows, null, 2) + '\n');
console.log(JSON.stringify({ items: rows.length, schemaComplete: rows.filter(x => x.schemaComplete).length,
  directionCorrect: rows.filter(x => x.directionCorrect).length, rawDirectionCorrect: rows.filter(x => x.rawDirectionCorrect).length,
  thinkingLeaks: rows.filter(x => x.thinkingLeak).length }));
