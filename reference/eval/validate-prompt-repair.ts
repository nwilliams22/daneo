/** Validate retained native replies with the same zod contract as Explore. */
import { readFileSync, writeFileSync } from "node:fs";
import { translationResultSchema } from "../../src/lib/schemas.ts";

const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error("usage: tsx validate-prompt-repair.ts results.jsonl schema.json");
const rows = readFileSync(input, "utf8").trim().split("\n").map(line => JSON.parse(line));
const schema: Record<string, { valid: boolean; issues: string[] }> = Object.fromEntries(rows.map(row => {
  const candidate = row.outcome?.ok ? row.outcome.result : null;
  const result = translationResultSchema.safeParse(candidate);
  return [row.id, { valid: result.success, issues: result.success ? [] : result.error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`) }];
}));
writeFileSync(output, JSON.stringify(schema, null, 2) + "\n");
console.log(JSON.stringify({ checked: rows.length, valid: Object.values(schema).filter(x => x.valid).length }));
