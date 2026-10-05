"""Select four unreserved corpus rows; never reads learner state."""
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('freeze', ROOT / 'reference/eval/check-independent-freeze.py')
freeze = importlib.util.module_from_spec(spec)
spec.loader.exec_module(freeze)
excluded = freeze.check()
fixture = json.loads(freeze.FIXTURE.read_text())
prompt = json.loads((ROOT / 'src/lib/translation-prompt.json').read_text())
rows = []
for sentence in freeze.source_at(fixture['corpusCommit'], 'src/content/sentences.json'):
    sid = sentence['id']
    en, ko = freeze.joined(sentence['en']), freeze.joined(sentence['ko'])
    if any(key in seen for key, seen in zip((sid, freeze.normalized(en), freeze.normalized(ko)), excluded)):
        continue
    if len(ko) > 45 or not ko.endswith('요.'):
        continue
    gloss = {c['id']: c for c in sentence['gloss']}
    target = dict(direction='en-to-ko', korean=ko, natural_english=en,
                  gloss=[dict(chunk=c['t'], gloss=gloss[c['id']]['t'], role=c['role'])
                         for c in sentence['ko'] if c['t']],
                  literal_gap='', cultural_note='')
    # Empty explanatory fields are intentional for this throwaway numerical probe,
    # not curated labels or a language-quality training set.
    rows.append(dict(corpusSentenceId=sid, english=en, korean=ko, target=target,
                     prompt=prompt.replace('{{DIRECTION}}', 'en-to-ko').replace('{{INPUT}}', en)))
    if len(rows) == 4:
        break
assert len(rows) == 4
out = ROOT / 'reference/training/smoke-examples.json'
out.write_text(json.dumps(dict(corpusCommit=fixture['corpusCommit'], items=rows), ensure_ascii=False, indent=2)+'\n')
freeze.check_candidates(out, excluded)
print('Wrote', out.relative_to(ROOT))
