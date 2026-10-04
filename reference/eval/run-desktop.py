"""Run a prebuilt acceptance example offline; sample total descendant RSS on Linux."""
import json
import hashlib
import os
from pathlib import Path
import subprocess
import time

root = Path(__file__).resolve().parents[2]
out = Path(os.environ['DANEO_ACCEPTANCE_RESULTS']).parent
log = Path(os.environ['DANEO_ACCEPTANCE_LOG'])
set_path = Path(os.environ.get('DANEO_ACCEPTANCE_SET', 'reference/eval/v2-translation-set.json'))
if not set_path.is_absolute():
    set_path = root / set_path

def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip()
tracked = {
    'src/lib/translation-prompt.json': root / 'src/lib/translation-prompt.json',
    'reference/eval/v0-rubric.md': root / 'reference/eval/v0-rubric.md',
    str(set_path.relative_to(root)): set_path,
}
for repo_path, working_path in tracked.items():
    committed = subprocess.check_output(['git', 'show', f'{head}:{repo_path}'], cwd=root)
    if working_path.read_bytes() != committed:
        raise SystemExit(f'{repo_path} differs from recorded HEAD; refusing to create evidence')

record_env = os.environ.copy()
record_env.update({
    'DANEO_ACCEPTANCE_HEAD': head,
    'DANEO_ACCEPTANCE_PROMPT_SHA256': hashlib.sha256(subprocess.check_output(['git', 'show', f'{head}:src/lib/translation-prompt.json'], cwd=root)).hexdigest(),
    'DANEO_ACCEPTANCE_RUBRIC_SHA256': hashlib.sha256(subprocess.check_output(['git', 'show', f'{head}:reference/eval/v0-rubric.md'], cwd=root)).hexdigest(),
    'DANEO_ACCEPTANCE_SET_SHA256': sha256(set_path),
    'DANEO_ACCEPTANCE_SET_PATH': str(set_path.relative_to(root)),
})

def descendants(pid):
    result = [pid]
    for current in result:
        try:
            result.extend(int(v) for v in Path(f'/proc/{current}/task/{current}/children').read_text().split())
        except (FileNotFoundError, PermissionError):
            pass
    return result

def rss(pid):
    try:
        return next(int(line.split()[1]) for line in Path(f'/proc/{pid}/status').read_text().splitlines() if line.startswith('VmRSS:'))
    except (FileNotFoundError, PermissionError, StopIteration):
        return 0

with log.open('w') as stream:
    start = time.monotonic()
    # A new network namespace has no configured interface or proxy process.
    proc = subprocess.Popen(['unshare', '--user', '--map-root-user', '--net',
                             str(root / 'src-tauri/target/release/examples/acceptance')],
                            stdout=stream, stderr=subprocess.STDOUT, env=record_env)
    peak = samples = 0
    while proc.poll() is None:
        peak = max(peak, sum(rss(pid) for pid in descendants(proc.pid)))
        samples += 1
        time.sleep(.02)
    (out / (Path(os.environ['DANEO_ACCEPTANCE_RESULTS']).stem + '-memory.json')).write_text(json.dumps({
        'sampledPeakTreeRssKiB': peak, 'samples': samples, 'sampleIntervalSeconds': .02,
        'elapsedSeconds': time.monotonic() - start, 'exitCode': proc.returncode,
        'method': 'sum VmRSS for live process descendants; shared pages may be counted more than once; sample can miss shorter peaks',
        'network': 'unshare --user --map-root-user --net; no host network or proxy accessible',
    }, indent=2) + '\n')
    raise SystemExit(proc.returncode)
