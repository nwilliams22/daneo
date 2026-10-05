"""Export a v1 adapter with the verified matched converter and test the pinned worker."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT/'.local-models/compatibility'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--probe', action='store_true')
parser.add_argument('--name')
args = parser.parse_args()
WORK = ROOT/'.local-models'/(args.name or ('v1-probe' if args.probe else 'v1'))
SOURCE = CACHE/'llama-matched'

def sha(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()

def artifact(path):
    return dict(path=str(path.relative_to(WORK)), bytes=path.stat().st_size, sha256=sha(path))

assert json.loads((WORK/'training-result.json').read_text())['merge_complete']
# Verify converter against the unchanged pinned crate, and the reviewed quantizer.
vendored, = (Path.home()/'.cargo/registry/src').glob('*/llama-cpp-sys-2-0.1.158/llama.cpp')
count = 0
for path in vendored.rglob('*'):
    if path.is_file():
        assert path.read_bytes() == (SOURCE/path.relative_to(vendored)).read_bytes(), str(path)
        count += 1
assert count == 1865
quantizer = SOURCE/'build/bin/llama-quantize'
assert sha(quantizer) == '398b543d82be71fc61f7190c87f6bd13772cb89dd630f72f57b2bb0ff2200f42'
# Full conversion module is not packaged in the crate; bind it to the retained archive.
import tarfile
with tarfile.open(CACHE/'llama-matched.tar.gz') as archive:
    for member in archive.getmembers():
        relative = Path(*Path(member.name).parts[1:])
        if member.isfile() and (str(relative).startswith('conversion/') or str(relative) == 'convert_hf_to_gguf.py'):
            assert archive.extractfile(member).read() == (SOURCE/relative).read_bytes()
bf16 = WORK/'candidate-BF16.gguf'
q8 = WORK/'candidate-Q8_0.gguf'
for path in [bf16, q8, WORK/'export-result.json', WORK/'runtime-results.jsonl', WORK/'runtime-raw.jsonl']:
    assert not path.exists(), f'Refuse to overwrite {path}'
steps = []
for stage, command in [
    ('convert', [sys.executable, str(SOURCE/'convert_hf_to_gguf.py'), str(WORK/'merged'), '--outfile', str(bf16), '--outtype', 'bf16']),
    ('quantize', [str(quantizer), str(bf16), str(q8), 'Q8_0', '8']),
]:
    start = time.monotonic()
    subprocess.run(['/usr/bin/time','-v','-o',str(WORK/f'{stage}-resources.txt'),*command], check=True)
    steps.append(dict(stage=stage, command=command, wall_seconds=time.monotonic()-start))
report = dict(converter_commit='26394b4e6749a41c3633db040e0987500a5f7013', matched_vendored_files=count, steps=steps,
              artifacts=[artifact(p) for p in [bf16,q8,WORK/'adapter/adapter_model.safetensors']],
              merged_files=[artifact(p) for p in sorted((WORK/'merged').rglob('*')) if p.is_file()])
(WORK/'export-result.json').write_text(json.dumps(report, indent=2)+'\n')
examples = ROOT/'reference/training/smoke-examples.json'
subprocess.run(['python3','reference/eval/check-independent-freeze.py','--candidates',str(examples)],cwd=ROOT,check=True)
row = json.loads(examples.read_text())['items'][0]
fixture = WORK/'runtime-fixture.json'
fixture.write_text(json.dumps(dict(items=[dict(id='compatibility-smoke',input=row['english'],direction='en-to-ko')]))+'\n')
binary = ROOT/'src-tauri/target/release/examples/prompt_probe'
expected = next(r for r in json.loads((ROOT/'reference/training/evidence/matched-input-manifest.json').read_text()) if r['path'].startswith('src-tauri/'))
assert sha(binary) == expected['sha256']
model = artifact(q8)
env = dict(os.environ, DANEO_ACCEPTANCE_MODEL_BYTES=str(model['bytes']), DANEO_ACCEPTANCE_MODEL_SHA256=model['sha256'],
    DANEO_ACCEPTANCE_HEAD=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
    DANEO_ACCEPTANCE_PROMPT_SHA256=sha(ROOT/'src/lib/translation-prompt.json'),
    DANEO_ACCEPTANCE_RUBRIC_SHA256=sha(ROOT/'reference/eval/v0-rubric.md'),
    DANEO_ACCEPTANCE_SET_PATH=str(fixture.relative_to(ROOT)), DANEO_ACCEPTANCE_SET_SHA256=sha(fixture),
    DANEO_MODEL_PATH=str(q8), DANEO_ACCEPTANCE_RAW=str(WORK/'runtime-raw.jsonl'))
subprocess.run(['/usr/bin/time','-v','-o',str(WORK/'runtime-resources.txt'),'unshare','--user','--map-root-user','--net',str(binary),str(fixture.relative_to(ROOT)),str(WORK/'runtime-results.jsonl')],cwd=ROOT,env=env,check=True)
subprocess.run(['node','--import','tsx','reference/training/validate-v1.mjs',*(['--name', args.name] if args.name else ['--probe'] if args.probe else [])],cwd=ROOT,check=True)
print(json.dumps(report),flush=True)
