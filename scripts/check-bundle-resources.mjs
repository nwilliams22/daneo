import { lstatSync, readlinkSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative, basename } from 'node:path'

// Audit extracted installer contents, including the embedded frontend in the executable.
const [root, output] = process.argv.slice(2)
if (!root || !output) throw new Error('Usage: node scripts/check-bundle-resources.mjs <extracted-directory> <report.json>')
const files = []
const violations = []
function visit(path) {
  const stat = lstatSync(path)
  if (stat.isSymbolicLink()) {
    files.push({ path: relative(root, path), symlink: readlinkSync(path) })
    return
  }
  if (stat.isDirectory()) {
    for (const entry of readdirSync(path).sort()) visit(join(path, entry))
    return
  }
  const name = relative(root, path)
  files.push({ path: name, bytes: stat.size })
  if (/^\.env(?:\.|$)/i.test(basename(path)) || /\.(gguf|safetensors|onnx|pt|pth)$/i.test(path)) violations.push(`${name}: forbidden resource filename`)
  const bytes = readFileSync(path)
  if (bytes.includes(Buffer.from('ANTHROPIC_API_KEY')) || bytes.includes(Buffer.from('ANTHROPIC_API_KEY', 'utf16le')) || /sk-ant-[A-Za-z0-9_-]{20,}/.test(bytes.toString('latin1'))) violations.push(`${name}: forbidden API key marker`)
}
visit(root)
if (!files.length) throw new Error('Extracted bundle contains no files')
writeFileSync(output, JSON.stringify({ files, violations }, null, 2) + '\n')
console.log(`${files.length} files inspected; ${violations.length} forbidden resources; report: ${output}`)
if (violations.length) process.exitCode = 1
