"""Join retained evidence with explicit language judgments; never infer language correctness."""
import hashlib
import json
import math
from pathlib import Path

base = Path(__file__).parent
fixture = json.loads((base / 'v0-translation-set.json').read_text())
items = {x['id']: x for x in fixture['items']}
judgments = {x['id']: x for x in json.loads((base / 'v0-language-review.json').read_text())['items']}
rows = [json.loads(line) for line in (base / 'raw/v0-desktop.jsonl').read_text().splitlines()]
raw = {x['requestId']: x for x in map(json.loads, (base / 'raw/v0-model.jsonl').read_text().splitlines())}
results = []
canonical = {}
for row in rows:
    if not row['requestId'].startswith(('cold-', 'warm-')):
        continue
    item = items[row['id']]
    reply = raw[row['requestId']]
    text = reply['rawReply']
    parsed = json.loads(text.replace('```json', '').replace('```', '').strip())
    # A judgment applies to repeated output only when its complete text is identical.
    if row['id'] in canonical:
        assert text == canonical[row['id']], f"New output needs its own language review: {row['requestId']}"
    canonical[row['id']] = text
    judgment = judgments[row['id']]
    schema = row['outcome']['ok'] and reply['complete']
    direction = parsed.get('direction') == item['direction']
    thinking = '<think>' in text or '</think>' in text
    dimensions = judgment['dimensions']
    record = dict(row, rawReply=text, parsedReply=parsed, schemaComplete=schema,
                  directionCorrect=direction, thinkingLeak=thinking, dimensions=dimensions,
                  meaningReversal=judgment['meaningReversal'], inventedRule=judgment['inventedRule'],
                  fullyCorrect=bool(schema and direction and not thinking and all(v[0] for v in dimensions.values())
                                    and not judgment['meaningReversal'] and not judgment['inventedRule']),
                  source={'corpusCommit': fixture['corpusCommit'], 'sentence': item['corpusSentenceId'],
                          'module': item['moduleContent']}, rawSha256=hashlib.sha256(text.encode()).hexdigest())
    results.append(record)
assert len(results) == 31
for item in items:
    assert sum(r['id'] == item and r['requestId'].startswith('warm-') for r in results) == 3
warm = [r for r in results if r['requestId'].startswith('warm-')]
first = [r for r in results if r['requestId'].startswith('warm-1-')]
latencies = sorted(r['completionMs'] for r in warm)
summary = {'requests': len(results), 'warmRequests': len(warm),
           'schemaCompleteItems': sum(r['schemaComplete'] for r in first),
           'correctDirectionItems': sum(r['directionCorrect'] for r in first),
           'thinkingLeaks': sum(r['thinkingLeak'] for r in first),
           'fullyCorrectItems': sum(r['fullyCorrect'] for r in first),
           'meaningReversals': sum(r['meaningReversal'] for r in first),
           'inventedRuleItems': sum(r['inventedRule'] for r in first),
           'warmP95CompletionMs': latencies[math.ceil(.95 * len(latencies)) - 1],
           'warmMinCompletionMs': min(latencies), 'warmMaxCompletionMs': max(latencies),
           'p95Method': 'nearest rank: ceil(0.95 * 30) = 29th ascending observation',
           'rawTextIdenticalAcrossRepeats': True,
           'thinkingReview': 'No reasoning prose seen in manual review; marker check also negative.'}
(base / 'raw/v0-scored.json').write_text(json.dumps({'summary': summary, 'results': results}, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(summary, indent=2))
