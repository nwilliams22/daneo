"""Run one family on the development split only, using the native CPU probe."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import time

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('family', choices=['midm', 'ax'])
args = parser.parse_args()
work = ROOT / '.local-models/v3-screen'
model = work / f'{args.family}-Q4_K_M.gguf'
out = ROOT / f'reference/eval/raw/v3-{args.family}'
fixture = Path('reference/eval/v3-dev-set.json')

def sha(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()

head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
for path in [fixture, Path('src/lib/translation-prompt.json'), Path('reference/eval/v0-rubric.md'),
             Path('src-tauri/src/local_translation/native.rs')]:
    assert (ROOT/path).read_bytes() == subprocess.check_output(['git', 'show', f'{head}:{path}'], cwd=ROOT), path
for suffix in ['-raw.jsonl', '-results.jsonl', '-memory.json', '-run.log']:
    assert not Path(str(out)+suffix).exists(), 'Retain earlier evidence; do not overwrite a run'
metadata = json.loads((work/args.family/'hub-metadata.json').read_text())
identity = dict(repoId=metadata['id'], revision=metadata['sha'], filename=model.name,
                bytes=model.stat().st_size, sha256=sha(model), localOnly=True,
                quantization='Q4_K_M', converterCommit='26394b4e6749a41c3633db040e0987500a5f7013')
Path(str(out)+'-artifact.json').write_text(json.dumps(identity, indent=2)+'\n')
env = dict(os.environ, DANEO_MODEL_PATH=str(model),
           DANEO_ACCEPTANCE_MODEL_BYTES=str(identity['bytes']),
           DANEO_ACCEPTANCE_MODEL_SHA256=identity['sha256'],
           DANEO_ACCEPTANCE_HEAD=head,
           DANEO_ACCEPTANCE_PROMPT_SHA256=sha(ROOT/'src/lib/translation-prompt.json'),
           DANEO_ACCEPTANCE_RUBRIC_SHA256=sha(ROOT/'reference/eval/v0-rubric.md'),
           DANEO_ACCEPTANCE_SET_PATH=str(fixture), DANEO_ACCEPTANCE_SET_SHA256=sha(ROOT/fixture),
           DANEO_ACCEPTANCE_RAW=str(out)+'-raw.jsonl')
start = time.monotonic()
with Path(str(out)+'-run.log').open('w') as log:
    process = subprocess.Popen(['unshare', '--user', '--map-root-user', '--net',
        str(ROOT/'src-tauri/target/release/examples/prompt_probe'), str(fixture), str(out)+'-results.jsonl'],
        cwd=ROOT, env=env, stdout=log, stderr=subprocess.STDOUT)
    peak = samples = 0
    while process.poll() is None:
        try:
            rss = next(int(line.split()[1]) for line in Path(f'/proc/{process.pid}/status').read_text().splitlines() if line.startswith('VmRSS:'))
            peak = max(peak, rss)
        except (OSError, StopIteration):
            pass
        samples += 1
        time.sleep(.02)
Path(str(out)+'-memory.json').write_text(json.dumps(dict(
    sampledPeakRssKiB=peak, samples=samples, sampleIntervalSeconds=.02,
    method='VmRSS of native probe process; threads share its address space; 20ms samples can miss shorter peaks',
    elapsedSeconds=time.monotonic()-start, exitCode=process.returncode,
    network='unshare --user --map-root-user --net'), indent=2)+'\n')
raise SystemExit(process.returncode)
