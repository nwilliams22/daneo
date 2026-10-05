import { readFileSync } from 'node:fs';
import { translationResultSchema } from '../../src/lib/schemas.ts';
const modelSchema = translationResultSchema.omit({ romanization: true, particles: true }).strict();
const data = JSON.parse(readFileSync(new URL('./smoke-examples.json', import.meta.url)));
for (const row of data.items) modelSchema.parse(row.target);
console.log(`PASS: ${data.items.length} model-owned targets; no romanization or particles`);
