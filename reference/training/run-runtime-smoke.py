"""Run the existing production worker probe on one non-held-out smoke input."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / '.local-models/compatibility'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--bf16', action='store_true', help='Diagnose the same merged weights before quantization')
args = parser.parse_args()
prefix = 'runtime-bf16' if args.bf16 else 'runtime'
model_file = 'smoke-BF16.gguf' if args.bf16 else 'smoke-Q4_K_M.gguf'
examples = ROOT/'reference/training/smoke-examples.json'
subprocess.run(['python3', str(ROOT/'reference/eval/check-independent-freeze.py'), '--candidates', str(examples)], check=True)
row = json.loads(examples.read_text())['items'][0]
fixture = WORK/'runtime-fixture.json'
fixture.write_text(json.dumps(dict(items=[dict(id='compatibility-smoke', input=row['english'], direction='en-to-ko')]))+'\n')
def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()
artifact = next(row for row in json.loads((WORK/'export-result.json').read_text())['artifacts'] if row['path'] == model_file)
env = dict(os.environ, DANEO_ACCEPTANCE_MODEL_BYTES=str(artifact['bytes']), DANEO_ACCEPTANCE_MODEL_SHA256=artifact['sha256'], DANEO_ACCEPTANCE_HEAD=subprocess.check_output(['git','rev-parse','HEAD'], cwd=ROOT,text=True).strip(),
    DANEO_ACCEPTANCE_PROMPT_SHA256=sha(ROOT/'src/lib/translation-prompt.json'),
    DANEO_ACCEPTANCE_RUBRIC_SHA256=sha(ROOT/'reference/eval/v0-rubric.md'),
    DANEO_ACCEPTANCE_SET_PATH=str(fixture.relative_to(ROOT)), DANEO_ACCEPTANCE_SET_SHA256=sha(fixture),
    DANEO_MODEL_PATH=str(WORK/model_file), DANEO_ACCEPTANCE_RAW=str(WORK/f'{prefix}-raw.jsonl'))
for name in [f'{prefix}-raw.jsonl',f'{prefix}-results.jsonl']:
    assert not (WORK/name).exists(), f'{name} already exists; retain evidence before a deliberate rerun'
subprocess.run(['/usr/bin/time','-v','unshare','--user','--map-root-user','--net',
    str(ROOT/'src-tauri/target/release/examples/prompt_probe'), str(fixture.relative_to(ROOT)),str(WORK/f'{prefix}-results.jsonl')],
    cwd=ROOT, env=env,check=True)
