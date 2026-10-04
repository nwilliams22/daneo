"""Run a prebuilt acceptance example offline; sample total descendant RSS on Linux."""
import json
import os
from pathlib import Path
import subprocess
import time

root = Path(__file__).resolve().parents[2]
out = Path(os.environ['DANEO_ACCEPTANCE_RESULTS']).parent
log = Path(os.environ['DANEO_ACCEPTANCE_LOG'])

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
                            stdout=stream, stderr=subprocess.STDOUT)
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
