"""Verify development-screen provenance without opening any gate fixture."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[2]
DEV = 'reference/eval/v3-dev-set.json'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--report-commit', required=True)
args = parser.parse_args()

def committed(commit, path):
    return subprocess.check_output(['git', 'show', f'{commit}:{path}'], cwd=ROOT)

def sha(data):
    return hashlib.sha256(data).hexdigest()

for family in ['midm', 'ax']:
    prefix = f'reference/eval/raw/v3-{family}'
    data = committed(args.report_commit, prefix+'-raw.jsonl')
    assert data == (ROOT/(prefix+'-raw.jsonl')).read_bytes()
    rows = [json.loads(line) for line in data.splitlines()]
    artifact = json.loads(committed(args.report_commit, prefix+'-artifact.json'))
    expected_ids = ['warmup'] + [item['id'] for item in json.loads(committed(args.report_commit, DEV))['items']]
    assert [row['requestId'] for row in rows] == expected_ids
    for row in rows:
        p = row['provenance']; head = p['head']
        subprocess.run(['git', 'merge-base', '--is-ancestor', head, args.report_commit], cwd=ROOT, check=True)
        assert p['itemSetPath'] == DEV
        for field, path in [('promptSha256', 'src/lib/translation-prompt.json'),
                            ('rubricSha256', 'reference/eval/v0-rubric.md'), ('itemSetSha256', DEV)]:
            assert p[field] == sha(committed(head, path)), (family, row['requestId'], field)
        assert p['itemSetSha256'] == committed(head, 'reference/eval/v3-dev-set.sha256').decode().split()[0]
        assert p['modelSha256'] == artifact['sha256'] and p['modelBytes'] == artifact['bytes']
        assert len(p['renderedPromptSha256']) == 64
    print(f'{family}: PROVENANCE PASS, {len(rows)} raw rows, committed development fixture and artifact identity')
