"""Replay only v2 training/development gap rows with the exact retained v2 worker."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import time

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'reference/training/evidence/v2-gap-replay'
MODEL = ROOT / '.local-models/v2-lr1/candidate-Q8_0.gguf'
WORKER = ROOT / 'src-tauri/target/release/examples/prompt_probe-49e843a3ac6cd401'


def sha(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def main():
    assert MODEL.stat().st_size == 4610579744
    assert sha(MODEL) == '025935d6c8477d70946b0e97fddcac318ddbd04630a496bd011f488ef39020c5'
    assert sha(WORKER) == '98e7b0ef14e0ce1776556bc0250d46ceab495cadb2173d583aac6248c8fa368d'
    prompt_bytes = subprocess.check_output(['git', 'show', '6af70420d350aa4e95234cde09ce519fc666a56b:src/lib/translation-prompt.json'], cwd=ROOT)
    prompt_sha = hashlib.sha256(prompt_bytes).hexdigest()
    assert prompt_sha == '81f525b2fb54ac5b1a16d3cfb7ba2fc28ed88db156156cff5fbddb9ff043e669'
    assert not OUT.exists(), 'Preserve prior evidence; never overwrite a replay'
    sources = []
    items = []
    for filename in ['dataset-v2.json', 'development-v2.json']:
        path = ROOT / 'reference/training' / filename
        sources.append(dict(path=str(path.relative_to(ROOT)), sha256=sha(path)))
        for row in json.loads(path.read_text())['items']:
            if row['target']['literal_gap'].strip():
                items.append(dict(id=row['id'], input=row['input'], direction=row['target']['direction'],
                                  split=row['split'], expected=row['target']))
    assert len(items) == 118
    OUT.mkdir()
    (OUT/'embedded-prompt.json').write_bytes(prompt_bytes)
    fixture = OUT / 'inputs.json'
    fixture.write_text(json.dumps(dict(purpose='Development diagnosis only; no gate claim', items=items), ensure_ascii=False, indent=2)+'\n')
    env = dict(os.environ, DANEO_MODEL_PATH=str(MODEL),
               DANEO_ACCEPTANCE_MODEL_BYTES=str(MODEL.stat().st_size), DANEO_ACCEPTANCE_MODEL_SHA256=sha(MODEL),
               DANEO_ACCEPTANCE_HEAD=subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
               DANEO_ACCEPTANCE_PROMPT_SHA256=prompt_sha,
               DANEO_ACCEPTANCE_RUBRIC_SHA256=sha(ROOT/'reference/eval/v0-rubric.md'),
               DANEO_ACCEPTANCE_SET_PATH=str(fixture.relative_to(ROOT)), DANEO_ACCEPTANCE_SET_SHA256=sha(fixture),
               DANEO_ACCEPTANCE_RAW=str(OUT/'raw.jsonl'))
    manifest = dict(sources=sources, modelSha256=sha(MODEL), modelBytes=MODEL.stat().st_size,
                    workerSha256=sha(WORKER), worker=str(WORKER.relative_to(ROOT)),
                    fixtureSha256=sha(fixture), promptSha256=env['DANEO_ACCEPTANCE_PROMPT_SHA256'],
                    sealedManifestSha256=sha(ROOT/'reference/eval/v3-translation-set.sha256'),
                    selection='All non-empty literal_gap targets from v2 training and development; no reserved inputs',
                    network='unshare --user --map-root-user --net')
    (OUT/'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
    started = time.monotonic()
    with (OUT/'run.log').open('w') as log:
        result = subprocess.run(['unshare', '--user', '--map-root-user', '--net', str(WORKER),
                                 str(fixture.relative_to(ROOT)), str(OUT/'results.jsonl')],
                                cwd=ROOT, env=env, stdout=log, stderr=subprocess.STDOUT)
    manifest.update(exitCode=result.returncode, elapsedSeconds=time.monotonic()-started)
    (OUT/'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
    raise SystemExit(result.returncode)


if __name__ == '__main__':
    main()
