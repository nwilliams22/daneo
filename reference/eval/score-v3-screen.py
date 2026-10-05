"""Combine explicit item reviews with retained final replies; never infer language scores."""
import argparse
import json
import math
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('family', choices=['midm', 'ax'])
args = parser.parse_args()
root = Path(__file__).resolve().parent
prefix = root / 'raw' / f'v3-{args.family}'
read = lambda suffix: json.loads(Path(str(prefix)+suffix).read_text())
rows = read('-assembled.json')
notes = read('-review-notes.json')
items = json.loads((root/'v3-dev-set.json').read_text())['items']
assert len(rows) == len(items) == len(notes) == 30
assert [r['id'] for r in rows] == [r['id'] for r in items]
dimensions = ['meaning', 'gloss', 'particles', 'register', 'romanization', 'literalGap']
scored = []
for row in rows:
    note = notes[row['id'].rsplit('-', 1)[1]]
    assert set(note['fail']) <= set(dimensions)
    if not row['schemaComplete']:
        assert set(note['fail']) == set(dimensions), 'No dimension pass without a usable final reply'
    verdict = {key: key not in note['fail'] for key in dimensions}
    scored.append(dict(id=row['id'], schemaComplete=row['schemaComplete'],
        directionCorrect=row['directionCorrect'], rawDirectionCorrect=row['rawDirectionCorrect'],
        thinkingLeak=row['thinkingLeak'], dimensions=verdict, evidence=note['evidence'],
        meaningReversal=note.get('meaningReversal', False), inventedRule=note.get('inventedRule', False),
        fullyCorrect=row['schemaComplete'] and row['directionCorrect'] and not row['thinkingLeak']
          and all(verdict.values()) and not note.get('meaningReversal', False) and not note.get('inventedRule', False)))
counts = {key: sum(row[key] for row in scored) for key in ['schemaComplete','directionCorrect','rawDirectionCorrect','thinkingLeak','meaningReversal','inventedRule','fullyCorrect']}
counts['dimensions'] = {key: sum(row['dimensions'][key] for row in scored) for key in dimensions}
timings = [json.loads(line) for line in Path(str(prefix)+'-results.jsonl').read_text().splitlines()]
warm = [row['completionMs'] for row in timings if row['id'].startswith('DAN-V3-DEV-')]
first = timings[0]
memory = read('-memory.json')
runtime = dict(downloadBytes=read('-artifact.json')['bytes'], coldReadyMs=first['readyMs'],
    coldFirstTokenMs=first['firstTokenMs'], coldCompletionMs=first['completionMs'],
    warmP95Ms=sorted(warm)[math.ceil(.95*len(warm))-1], warmSamples=len(warm),
    sampledPeakRssKiB=memory['sampledPeakRssKiB'])
report = dict(method='First manual review under the unchanged v0 rubric; no dimension credited without a schema-valid final app reply. Raw directions reported separately. Not an independent gate verdict.',
              counts=counts, runtime=runtime, items=scored)
Path(str(prefix)+'-scored.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(dict(counts=counts,runtime=runtime),indent=2))
