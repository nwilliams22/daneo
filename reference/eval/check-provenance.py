"""Reject held-out evidence that cannot prove its prompt, fixture, and commit order."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
PROMPT = 'src/lib/translation-prompt.json'
RUBRIC = 'reference/eval/v0-rubric.md'


def git_bytes(commit, path):
    return subprocess.check_output(['git', 'show', f'{commit}:{path}'], cwd=ROOT)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def validate(raw_path, report_commit, frozen_set):
    raw_file = Path(raw_path).resolve()
    try:
        repo_path = raw_file.relative_to(ROOT.resolve()).as_posix()
    except ValueError as error:
        raise ValueError('raw evidence must be inside the repository') from error
    raw_bytes = raw_file.read_bytes()
    if git_bytes(report_commit, repo_path) != raw_bytes:
        raise ValueError(f'raw evidence does not match {repo_path} at report commit {report_commit}')
    rows = [json.loads(line) for line in raw_bytes.decode().splitlines() if line.strip()]
    if not rows:
        raise ValueError('raw evidence has no rows')
    for index, row in enumerate(rows, 1):
        provenance = row.get('provenance')
        if not isinstance(provenance, dict):
            raise ValueError(f'row {index}: missing provenance')
        head = provenance.get('head')
        if not isinstance(head, str) or len(head) != 40:
            raise ValueError(f'row {index}: invalid recorded HEAD')
        ancestor = subprocess.run(['git', 'merge-base', '--is-ancestor', head, report_commit], cwd=ROOT)
        if ancestor.returncode != 0:
            raise ValueError(f'row {index}: recorded HEAD {head} is not an ancestor of report commit {report_commit}')

        for field, path in [('promptSha256', PROMPT), ('rubricSha256', RUBRIC)]:
            expected = digest(git_bytes(head, path))
            if provenance.get(field) != expected:
                raise ValueError(f'row {index}: {field} does not match {path} at recorded HEAD')

        set_path = provenance.get('itemSetPath')
        if not isinstance(set_path, str) or not set_path.startswith('reference/eval/') or not set_path.endswith('-translation-set.json'):
            raise ValueError(f'row {index}: invalid itemSetPath {set_path!r}')
        if set_path != frozen_set:
            raise ValueError(f'row {index}: itemSetPath {set_path} does not match selected set {frozen_set}')
        set_hash = digest(git_bytes(head, set_path))
        if provenance.get('itemSetSha256') != set_hash:
            raise ValueError(f'row {index}: itemSetSha256 does not match {set_path} at recorded HEAD')
        manifest_path = set_path.removesuffix('.json') + '.sha256'
        manifest = git_bytes(head, manifest_path).decode().split()[0]
        if set_hash != manifest:
            raise ValueError(f'row {index}: frozen set does not match its committed SHA-256 manifest')
    return len(rows)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('raw_jsonl')
    parser.add_argument('--report-commit', required=True, help='commit containing the report and raw evidence')
    parser.add_argument('--item-set', required=True, help='frozen item set used by this run')
    args = parser.parse_args()
    try:
        count = validate(args.raw_jsonl, args.report_commit, args.item_set)
    except (ValueError, OSError, subprocess.CalledProcessError, json.JSONDecodeError) as error:
        print(f'PROVENANCE FAIL: {error}', file=sys.stderr)
        return 1
    print(f'PROVENANCE PASS: {count} raw rows verified against {args.report_commit}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
