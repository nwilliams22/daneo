"""Join one frozen native pass with zod results and explicit language judgments."""
import json
import math
from pathlib import Path

base = Path(__file__).parent
fixture = {x['id']: x for x in json.loads((base / 'v0-translation-set.json').read_text())['items']}
rows = [json.loads(x) for x in (base / 'raw/v0-prompt-repair-native.jsonl').read_text().splitlines()]
raw = {x['requestId']: x for x in map(json.loads, (base / 'raw/v0-prompt-repair-raw.jsonl').read_text().splitlines())}
schema = json.loads((base / 'raw/v0-prompt-repair-schema.json').read_text())
judgments = {x['id']: x for x in json.loads((base / 'v0-prompt-repair-review.json').read_text())['items']}
assert len(rows) == 12 and rows[0]['id'] == 'warmup' and rows[-1]['id'] == 'cancel-demo'
assert {x['id'] for x in rows[1:-1]} == fixture.keys() == judgments.keys()
results = []
for row in rows[1:-1]:
    id = row['id']
    reply = raw[id]
    text = reply['rawReply']
    dims = judgments[id]['dimensions']
    assert set(dims) == {'meaning', 'gloss', 'particles', 'politeRegister', 'romanization', 'literalGap'}
    assert all(isinstance(value[0], bool) and value[1] for value in dims.values())
    outcome = row['outcome']
    complete = bool(outcome['ok'] and reply['complete'] and schema[id]['valid'])
    direction = bool(outcome['ok'] and outcome['result']['direction'] == fixture[id]['direction'])
    thinking = '<think>' in text or '</think>' in text
    judgment = judgments[id]
    results.append(dict(id=id, input=row['input'], rawReply=text, parsedReply=outcome.get('result'),
                        schemaComplete=complete, schemaIssues=schema[id]['issues'],
                        directionCorrect=direction, modelDirection=(json.loads(text.replace('```json', '').replace('```', '').strip()).get('direction') if reply['complete'] else None),
                        thinkingLeak=thinking, dimensions=dims, meaningReversal=judgment['meaningReversal'],
                        inventedRule=judgment['inventedRule'],
                        fullyCorrect=bool(complete and direction and not thinking and all(v[0] for v in dims.values())
                                          and not judgment['meaningReversal'] and not judgment['inventedRule']),
                        completionMs=row['completionMs'], readyMs=row['readyMs'], firstTokenMs=row['firstTokenMs']))
latencies = sorted(x['completionMs'] for x in results)
summary = dict(requests=len(results), schemaCompleteItems=sum(x['schemaComplete'] for x in results),
               correctDirectionItems=sum(x['directionCorrect'] for x in results),
               fullyCorrectItems=sum(x['fullyCorrect'] for x in results),
               meaningReversals=sum(x['meaningReversal'] for x in results),
               inventedRuleItems=sum(x['inventedRule'] for x in results),
               thinkingLeaks=sum(x['thinkingLeak'] for x in results),
               warmP95CompletionMs=latencies[math.ceil(.95 * len(latencies))-1],
               warmMinCompletionMs=min(latencies), warmMaxCompletionMs=max(latencies),
               p95Method='nearest rank: ceil(0.95 * 10) = 10th ascending observation',
               coldWarmup=rows[0], cancel=rows[-1])
(base / 'raw/v0-prompt-repair-scored.json').write_text(json.dumps({'summary': summary, 'results': results}, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({k:v for k,v in summary.items() if k not in {'coldWarmup','cancel'}}, indent=2))
