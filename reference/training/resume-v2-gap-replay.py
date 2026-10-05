"""Preserve interrupted replay evidence and run only unfinished source rows."""
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import time

spec = importlib.util.spec_from_file_location('replay', Path(__file__).with_name('replay-v2-gaps.py'))
replay = importlib.util.module_from_spec(spec)
spec.loader.exec_module(replay)
ROOT, ORIGINAL = replay.ROOT, replay.OUT
OUT = ORIGINAL / 'continuation'


def main():
    manifest = json.loads((ORIGINAL/'manifest.json').read_text())
    assert replay.sha(replay.MODEL) == manifest['modelSha256']
    assert replay.sha(replay.WORKER) == manifest['workerSha256']
    assert replay.sha(ORIGINAL/'inputs.json') == manifest['fixtureSha256']
    assert not OUT.exists(), 'Never overwrite evidence'
    raw = [json.loads(line) for line in (ORIGINAL/'raw.jsonl').read_text().splitlines()]
    results = [json.loads(line) for line in (ORIGINAL/'results.jsonl').read_text().splitlines()]
    complete = {r['requestId'] for r in raw if r['complete']} & {r['id'] for r in results}
    fixture = json.loads((ORIGINAL/'inputs.json').read_text())
    pending = [r for r in fixture['items'] if r['id'] not in complete]
    assert pending
    OUT.mkdir()
    path = OUT/'inputs.json'
    path.write_text(json.dumps(dict(purpose=fixture['purpose'], items=pending), ensure_ascii=False, indent=2)+'\n')
    continuation = dict(manifest, fixtureSha256=replay.sha(path),
                        preservedRawSha256=replay.sha(ORIGINAL/'raw.jsonl'),
                        preservedResultsSha256=replay.sha(ORIGINAL/'results.jsonl'),
                        preservedSourceRows=len(fixture['items'])-len(pending), remainingSourceRows=len(pending))
    env = dict(os.environ, DANEO_MODEL_PATH=str(replay.MODEL),
               DANEO_ACCEPTANCE_MODEL_BYTES=str(replay.MODEL.stat().st_size),
               DANEO_ACCEPTANCE_MODEL_SHA256=manifest['modelSha256'],
               DANEO_ACCEPTANCE_HEAD=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
               DANEO_ACCEPTANCE_PROMPT_SHA256=manifest['promptSha256'],
               DANEO_ACCEPTANCE_RUBRIC_SHA256=replay.sha(ROOT/'reference/eval/v0-rubric.md'),
               DANEO_ACCEPTANCE_SET_PATH=str(path.relative_to(ROOT)),
               DANEO_ACCEPTANCE_SET_SHA256=continuation['fixtureSha256'],
               DANEO_ACCEPTANCE_RAW=str(OUT/'raw.jsonl'))
    (OUT/'manifest.json').write_text(json.dumps(continuation,indent=2)+'\n')
    start = time.monotonic()
    with (OUT/'run.log').open('w') as log:
        result = subprocess.run(['unshare','--user','--map-root-user','--net',str(replay.WORKER),
                                 str(path.relative_to(ROOT)),str(OUT/'results.jsonl')],
                                cwd=ROOT,env=env,stdout=log,stderr=subprocess.STDOUT)
    continuation.update(exitCode=result.returncode,elapsedSeconds=time.monotonic()-start)
    (OUT/'manifest.json').write_text(json.dumps(continuation,indent=2)+'\n')
    raise SystemExit(result.returncode)


if __name__ == '__main__':
    main()
