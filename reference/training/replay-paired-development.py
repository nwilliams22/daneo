"""Replay the selected paired artifact on the same ten preserved v2 development inputs."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import time

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--name', required=True)
parser.add_argument('--relocate-worker', action='store_true', help='Map the isolated workspace to the retained worker compiled root')
parser.add_argument('--retry-startup', action='store_true', help='Preserve and retry a fixture-path failure before any model output')
parser.add_argument('--source-commit', help='Use the training receipt commit on a separate local host without Git metadata')
args = parser.parse_args()
assert args.name in ('paired-corrected-lr1', 'paired-corrected-lr2')
WORK = ROOT/'.local-models'/args.name
OUT = ROOT/'reference/training/evidence/paired-development-replay'
WORKER = ROOT/'src-tauri/target/release/examples/prompt_probe-49e843a3ac6cd401'
MODEL = WORK/'candidate-Q8_0.gguf'


def sha(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def read(path):
    return json.loads(path.read_text())


runs = [(name, read(ROOT/'.local-models'/name/'training-result.json'))
        for name in ('paired-corrected-lr1', 'paired-corrected-lr2')]
selected, training = min(runs, key=lambda pair: (pair[1]['selected_development_loss'],
                                                pair[1]['selected_epoch'],
                                                pair[1]['config']['learning_rate']))
assert selected == args.name, 'Only export/replay the frozen development-loss selection'
assert all(report['merge_complete'] and report['steps'] == 1624 for _,report in runs)
artifact = next(row for row in read(WORK/'export-result.json')['artifacts'] if row['path'] == 'candidate-Q8_0.gguf')
assert MODEL.stat().st_size == artifact['bytes'] and sha(MODEL) == artifact['sha256']
assert sha(WORKER) == '98e7b0ef14e0ce1776556bc0250d46ceab495cadb2173d583aac6248c8fa368d'
prompt_path = ROOT/'reference/training/evidence/v2-gap-replay/embedded-prompt.json'
prompt_sha = sha(prompt_path)
assert prompt_sha == training['prompt_sha256'] == '81f525b2fb54ac5b1a16d3cfb7ba2fc28ed88db156156cff5fbddb9ff043e669'
source = ROOT/'reference/training/evidence/v2-gap-replay/continuation/inputs.json'
items = [row for row in read(source)['items'] if row['split'] == 'development']
assert len(items) == 10
if OUT.exists():
    assert args.retry_startup, 'Preserve prior replay'
    assert not (OUT/'raw.jsonl').exists() and not (OUT/'results.jsonl').exists(), 'Never repeat model outputs'
    assert read(OUT/'manifest.json')['exitCode'] == 2
    assert (OUT/'run.log').read_text().startswith('prompt_probe: read fixture: No such file or directory'), 'Only a pre-model fixture-path failure may retry'
    archive = OUT/'startup-failure'
    archive.mkdir()
    for name in ['manifest.json', 'run.log']:
        (OUT/name).rename(archive/name)
else:
    OUT.mkdir()
fixture = OUT/'inputs.json'
fixture_text = json.dumps(dict(purpose='Development-only paired comparison; no gate claim', items=items), ensure_ascii=False, indent=2)+'\n'
if fixture.exists():
    assert fixture.read_text() == fixture_text, 'Preserve original fixed inputs'
else:
    fixture.write_text(fixture_text)
if args.source_commit:
    assert args.source_commit == training['source_commit'], 'Remote provenance must match the validated training receipt'
    head = args.source_commit
else:
    head = subprocess.check_output(['git', '-c', f'safe.directory={ROOT}', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
env = dict(os.environ, DANEO_MODEL_PATH=str(MODEL),
           DANEO_ACCEPTANCE_MODEL_BYTES=str(artifact['bytes']), DANEO_ACCEPTANCE_MODEL_SHA256=artifact['sha256'],
           DANEO_ACCEPTANCE_HEAD=head, DANEO_ACCEPTANCE_PROMPT_SHA256=prompt_sha,
           DANEO_ACCEPTANCE_RUBRIC_SHA256=sha(ROOT/'reference/eval/v0-rubric.md'),
           DANEO_ACCEPTANCE_SET_PATH=str(fixture.relative_to(ROOT)), DANEO_ACCEPTANCE_SET_SHA256=sha(fixture),
           DANEO_ACCEPTANCE_RAW=str(OUT/'raw.jsonl'))
isolation = ['unshare', '--user', '--map-root-user', '--net']
if args.relocate_worker:
    isolation = ['bwrap', '--unshare-user', '--uid', '0', '--gid', '0', '--unshare-net',
                 '--ro-bind', '/', '/', '--bind', str(ROOT), str(ROOT), '--tmpfs', '/mnt',
                 '--dir', '/mnt/t7', '--dir', '/mnt/t7/Projects',
                 '--bind', str(ROOT), '/mnt/t7/Projects/daneo', '--']
manifest = dict(sourceCommit=head, sourceFixtureSha256=sha(source), fixtureSha256=sha(fixture),
                selected=selected, selection='Lowest trained development loss, then earlier epoch, then smaller rate',
                modelSha256=artifact['sha256'], modelBytes=artifact['bytes'], workerSha256=sha(WORKER),
                promptPath=str(prompt_path.relative_to(ROOT)), promptSha256=prompt_sha, rubricSha256=env['DANEO_ACCEPTANCE_RUBRIC_SHA256'],
                network='Private network namespace', isolationCommand=isolation)
(OUT/'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
start = time.monotonic()
with (OUT/'run.log').open('w') as log:
    result = subprocess.run([*isolation, str(WORKER),
                             str(fixture.relative_to(ROOT)), str(OUT/'results.jsonl')],
                            cwd=ROOT, env=env, stdout=log, stderr=subprocess.STDOUT)
manifest.update(exitCode=result.returncode, elapsedSeconds=time.monotonic()-start)
(OUT/'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
raise SystemExit(result.returncode)
