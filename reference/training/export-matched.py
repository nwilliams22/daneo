"""Export existing merged weights with the pinned runtime's exact llama.cpp source."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / '.local-models/compatibility'
COMMIT = '26394b4e6749a41c3633db040e0987500a5f7013'
CRATE_COMMIT = '3b17d1f160f0e9cfcf95948954cefc967f8f92f2'
SOURCE = WORK / 'llama-matched'

def artifact(path):
    with path.open('rb') as stream:
        digest = hashlib.file_digest(stream, 'sha256').hexdigest()
    return dict(path=str(path.relative_to(WORK)), bytes=path.stat().st_size, sha256=digest)

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--q8', action='store_true')
args = parser.parse_args()
prefix = 'q8' if args.q8 else 'matched'
quantization = 'Q8_0' if args.q8 else 'Q4_K_M'
if args.q8:
    for entry in json.loads((ROOT / 'reference/training/evidence/matched-input-manifest.json').read_text()):
        path = ROOT / entry['path'] if entry['path'].startswith('src-tauri/') else WORK / entry['path']
        with path.open('rb') as stream:
            assert hashlib.file_digest(stream, 'sha256').hexdigest() == entry['sha256'], str(path)
        assert path.stat().st_size == entry['bytes']

assert json.loads((WORK / 'training-result.json').read_text())['merge_complete']
vendored = list((Path.home() / '.cargo/registry/src').glob('*/llama-cpp-sys-2-0.1.158/llama.cpp'))
assert len(vendored) == 1, 'Expected exactly one pinned crate source'
crate = vendored[0].parent
assert json.loads((crate / '.cargo_vcs_info.json').read_text())['git']['sha1'] == CRATE_COMMIT
count = 0
for file in vendored[0].rglob('*'):
    if file.is_file():
        assert file.read_bytes() == (SOURCE / file.relative_to(vendored[0])).read_bytes(), str(file)
        count += 1
assert count > 0
assert 'Qwen3_5ForConditionalGeneration' in (SOURCE / 'conversion/qwen.py').read_text()
bf16 = WORK / f'{prefix}-BF16.gguf'
q4 = WORK / f'{prefix}-{quantization}.gguf'
for path in [bf16, q4, WORK / f'{prefix}-export-result.json']:
    assert not path.exists(), f'Refuse to overwrite {path}'
steps = []
for name, command in [
    ('convert', [sys.executable, str(SOURCE / 'convert_hf_to_gguf.py'), str(WORK / 'merged'), '--outfile', str(bf16), '--outtype', 'bf16']),
    ('quantize', [str(SOURCE / 'build/bin/llama-quantize'), str(bf16), str(q4), quantization, '8']),
]:
    start = time.monotonic()
    subprocess.run(['/usr/bin/time', '-v', '-o', str(WORK / f'{prefix}-{name}-resources.txt'), *command], check=True)
    steps.append(dict(stage=name, command=command, wall_seconds=time.monotonic() - start))
report = dict(converter_commit=COMMIT, crate_commit=CRATE_COMMIT, matched_vendored_files=count,
              steps=steps, artifacts=[artifact(p) for p in [WORK / 'llama-matched.tar.gz', bf16, q4, SOURCE / 'build/bin/llama-quantize']])
(WORK / f'{prefix}-export-result.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report), flush=True)
