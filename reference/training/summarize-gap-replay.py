"""Count field emission, exact target matches and gloss shape; not a language gate."""
import collections
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / 'reference/training/evidence/v2-gap-replay'


def summarize():
    manifest = json.loads((WORK/'manifest.json').read_text())
    fixture = (WORK/'inputs.json').read_bytes()
    assert hashlib.sha256(fixture).hexdigest() == manifest['fixtureSha256']
    items = json.loads(fixture)['items']
    sources = [WORK]
    if manifest.get('exitCode') != 0:
        continuation = WORK/'continuation'
        resumed = json.loads((continuation/'manifest.json').read_text())
        assert resumed.get('exitCode') == 0, 'Continuation must complete successfully first'
        for filename, key in [('raw.jsonl', 'preservedRawSha256'), ('results.jsonl', 'preservedResultsSha256')]:
            assert hashlib.sha256((WORK/filename).read_bytes()).hexdigest() == resumed[key]
        sources.append(continuation)
    results, raw, provenance = {}, {}, {}
    for source in sources:
        m = json.loads((source/'manifest.json').read_text())
        fixture_bytes = (source/'inputs.json').read_bytes()
        assert hashlib.sha256(fixture_bytes).hexdigest() == m['fixtureSha256']
        selected_rows = json.loads(fixture_bytes)['items']
        selected = {r['id']: r for r in selected_rows}
        assert len(selected) == len(selected_rows), 'Duplicate fixture identity'
        for row in selected.values():
            assert row in items, 'Continuation input must be an unchanged original row'
        rr = [json.loads(line) for line in (source/'results.jsonl').read_text().splitlines()]
        rw = [json.loads(line) for line in (source/'raw.jsonl').read_text().splitlines()]
        for collection, key, destination in [(rr, 'id', results), (rw, 'requestId', raw)]:
            for row in collection:
                identity = row[key]
                if identity in ['warmup', 'cancel-demo']:
                    continue
                assert identity in selected and identity not in destination, identity
                destination[identity] = row
                provenance[identity] = m
    assert len(results) == len(items) and len(raw) == len(items)
    assert set(results) == set(raw) == {r['id'] for r in items}
    cells = collections.defaultdict(collections.Counter)
    detail = []
    for row in items:
        r = raw[row['id']]
        assert r['complete']
        for key in ['modelSha256', 'promptSha256']:
            assert r['provenance'][key] == manifest[key]
        assert r['provenance']['itemSetSha256'] == provenance[row['id']]['fixtureSha256']
        try:
            reply = json.loads(r['rawReply'])
        except json.JSONDecodeError:
            reply = {}
        parsed = results[row['id']]
        assert parsed['input'] == row['input'] and parsed['direction'] == row['direction']
        outcome = parsed['outcome']
        if outcome['ok']:
            assert outcome['result'] == reply, row['id']
        gap = reply.get('literal_gap')
        present = isinstance(gap, str) and bool(gap.strip())
        exact = gap == row['expected']['literal_gap']
        multi = len(reply.get('gloss', [])) > 1
        keys = [row['split'], row['split']+'/'+row['direction']+'/'+('multi' if len(row['expected']['gloss']) > 1 else 'single')]
        for key in keys:
            cells[key].update(rows=1, nonempty=int(present), exactTarget=int(exact),
                              emittedMultiChunk=int(multi), gapAndMultiChunk=int(present and multi),
                              runtimeOk=int(results[row['id']]['outcome']['ok']))
        detail.append(dict(id=row['id'], split=row['split'], direction=row['direction'],
                           expectedChunks=len(row['expected']['gloss']), nonempty=present, exactTarget=exact,
                           emittedChunks=len(reply.get('gloss', [])), expectedGap=row['expected']['literal_gap'], emittedGap=gap))
    report = dict(metric='Field emission and exact-string agreement only; no language-quality or gate claim',
                  cells=dict(sorted(cells.items())), items=detail)
    (WORK/'summary.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
    print(json.dumps(report['cells'], indent=2))


if __name__ == '__main__':
    summarize()
