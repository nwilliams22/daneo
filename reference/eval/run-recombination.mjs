/** Capture the learner-facing course adapter without changing or tuning it. */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { translateCourse } from '../../src/features/explore/course-api.ts';

const itemSetPath = 'reference/eval/recombination-dev-set.json';
const git = (...args) => execFileSync('git', ['-c', `safe.directory=${process.cwd()}`, ...args], { encoding: 'utf8' }).trim();
const digest = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const tracked = git('status', '--porcelain', '--', 'src', itemSetPath, 'reference/eval/v0-rubric.md');
if (tracked) throw new Error('Refusing to measure modified engine, corpus, rubric or fixture');
const provenance = {
  head: git('rev-parse', 'HEAD'),
  promptSha256: digest('src/lib/translation-prompt.json'),
  rubricSha256: digest('reference/eval/v0-rubric.md'),
  itemSetPath,
  itemSetSha256: digest(itemSetPath),
};
const fixture = JSON.parse(readFileSync(itemSetPath, 'utf8'));
// The adapter accepts only input, with no direction parameter. Preserve the
// requested direction as evidence; do not emulate an unsupported engine path.
const rows = fixture.items.map(item => {
  const outcome = translateCourse(item.input);
  return {
    id: item.id, itemClass: item.itemClass, input: item.input,
    requestedDirection: item.direction,
    runtime: process.version, adapter: 'src/features/explore/course-api.ts#translateCourse',
    provenance, rawReply: JSON.stringify(outcome), parsedReply: outcome,
  };
});
const destination = process.argv[2];
if (!destination) throw new Error('Supply an output JSONL path');
writeFileSync(destination, rows.map(row => JSON.stringify(row)).join('\n') + '\n');
console.log(`Captured ${rows.length} adapter outcomes at ${provenance.head}`);
