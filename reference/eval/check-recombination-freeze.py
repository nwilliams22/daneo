#!/usr/bin/env python3
"""Validate the novel development population without exposing sealed items."""

import argparse
import collections
import copy
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unicodedata

ROOT = Path(__file__).resolve().parents[2]
EVAL = ROOT / 'reference/eval'
FIXTURE = EVAL / 'recombination-dev-set.json'


def normalized(value):
    return ''.join(c for c in unicodedata.normalize('NFKC', value).casefold()
                   if not c.isspace() and not unicodedata.category(c).startswith('P'))


def pinned(data, path):
    raw = subprocess.check_output(['git', '-c', f'safe.directory={ROOT}', 'show', f"{data['corpusCommit']}:{path}"],
                                  cwd=ROOT)
    assert hashlib.sha256(raw).hexdigest() == data['sourceSha256'][path], f'source hash: {path}'
    assert (ROOT / path).read_bytes() == raw, f'source changed since freeze: {path}'
    return raw


def validate(data):
    assert data['version'] == 'recombination-dev-1'
    assert data['split'] == 'development' and data['heldOut'] is False
    assert data['trainingAllowed'] is False
    required = {'src/content/words.json', 'src/content/sentences.json',
                'src/content/modules.json', 'reference/eval/v0-rubric.md'}
    assert required <= data['sourceSha256'].keys()
    sources = {path: pinned(data, path) for path in data['sourceSha256']}
    words = {r['id']: r for r in json.loads(sources['src/content/words.json'])}
    modules = {r['id']: r for r in json.loads(sources['src/content/modules.json'])}
    corpus = json.loads(sources['src/content/sentences.json'])
    assert len(words) == 5615 and len(corpus) == 1439
    corpus_keys = [{normalized(' '.join(c['t'] for c in r[lang] if c['t'])) for r in corpus}
                   for lang in ('en', 'ko')]
    rows = data['items']
    assert collections.Counter(r['itemClass'] for r in rows) == {
        'recombination': 12, 'near-miss': 6, 'out-of-course': 6}, 'class counts'
    assert len({r['id'] for r in rows}) == len(rows), 'duplicate ID'
    for cls, directions in [('recombination', {'en-to-ko': 6, 'ko-to-en': 6}),
                            ('near-miss', {'en-to-ko': 3, 'ko-to-en': 3}),
                            ('out-of-course', {'ko-to-en': 6})]:
        assert collections.Counter(r['direction'] for r in rows if r['itemClass'] == cls) == directions
    for field, reserved in zip(('english', 'korean'), corpus_keys):
        values = [normalized(r[field]) for r in rows]
        assert len(set(values)) == len(values), f'duplicate normalized {field}'
        assert all(v and v not in reserved for v in values), f'corpus collision: {field}'
    for row in rows:
        assert row['id'].startswith('recombination-dev-')
        assert row['id'] not in {s['id'] for s in corpus}
        assert row['input'] == row['korean' if row['direction'] == 'ko-to-en' else 'english']
        assert row['probe'].strip()
        if row['itemClass'] == 'out-of-course':
            assert row['expectedBehavior'] == 'refuse'
            assert row['unresolved'], 'missing unresolved token'
            assert row['expectedRefusal'].startswith('That is outside the course:')
            for token in row['unresolved']:
                assert token['kind'] == 'untaught-word'
                assert token['text'] in row['korean'] and token['text'] in row['expectedRefusal']
                assert normalized(token['text']) not in {normalized(w['ko']) for w in words.values()}, 'taught refusal word'
        else:
            assert row['expectedBehavior'] == 'answer'
            assert row['expectedReadingEnglish'] == row['english']
            assert row['acceptableAnswerNote'] and isinstance(row['literalGap'], str)
            assert row['wordIds'] and len(set(row['wordIds'])) == len(row['wordIds'])
            assert all(i in words for i in row['wordIds']), 'unknown word ID'
            assert row['korean'] == ' '.join(c['korean'] for c in row['chunks'])
            assert all(c['gloss'] and c['wordIds'] for c in row['chunks'])
            assert set(row['wordIds']) == {i for c in row['chunks'] for i in c['wordIds']}, 'chunk word IDs'
            last = max((words[i]['moduleId'] for i in row['wordIds']), key=lambda m: modules[m]['order'])
            assert row['lastVocabularyModule'] == last, 'last vocabulary module'
            assert row['grammarModules']
            assert row['moduleId'] == max([last] + row['grammarModules'], key=lambda m: modules[m]['order'])
            for mid in set(row['grammarModules']) | {words[i]['moduleId'] for i in row['wordIds']}:
                assert 'src/content/' + modules[mid]['contentMd'] in sources, 'missing lesson provenance'
    return rows


def collision_check(rows):
    # IDs here identify NEW items, not corpus anchors. This is the existing
    # checker's candidate wire format only; no corpusSentenceId is in our set.
    candidates = [{'corpusSentenceId': r['id'], 'english': r['english'], 'korean': r['korean']}
                  for r in rows]
    with tempfile.TemporaryDirectory(prefix='recombination-check-') as directory:
        path = Path(directory) / 'candidates.json'
        path.write_text(json.dumps(candidates, ensure_ascii=False))
        # The host's Git launcher can discard GIT_CONFIG_* variables. Apply
        # the same per-command safe-directory flag to the unchanged checker.
        bootstrap = (
            "import runpy,subprocess,sys; original=subprocess.check_output; safe=sys.argv[1]; "
            "subprocess.check_output=lambda args,**kw: original("
            "[args[0],'-c','safe.directory=' + safe,*args[1:]] "
            "if args[0]=='git' else args,**kw); "
            "sys.argv=sys.argv[2:]; runpy.run_path(sys.argv[0],run_name='__main__')"
        )
        result = subprocess.run([sys.executable, '-c', bootstrap, str(ROOT),
                                 str(EVAL / 'check-independent-freeze.py'), '--candidates', str(path)], cwd=ROOT,
                                text=True, capture_output=True)
        # Never surface a sealed row even if the existing checker changes its
        # failure diagnostics. Only fixed summaries cross the subprocess boundary.
        assert result.returncode == 0, 'reservation subprocess failed; sealed diagnostics suppressed'
        expected = 'PASS: 24 candidate rows avoid all 136 reservations;'
        assert expected in result.stdout, 'reservation count/output changed'
    print('PASS: 24 candidate IDs and normalized English/Korean avoid all 136 reservations; sealed contents not emitted')


def self_test(data):
    mutations = [lambda d: d['items'][0].update(wordIds=['missing']),
                 lambda d: d['items'][0].update(lastVocabularyModule='m1'),
                 lambda d: d['items'][0]['chunks'][0].update(wordIds=['w_chingu']),
                 lambda d: d['items'][0].update(english='I drink water'),
                 lambda d: d['items'][-1].update(expectedBehavior='answer'),
                 lambda d: d['items'][0].update(itemClass='near-miss')]
    for mutate in mutations:
        changed = copy.deepcopy(data)
        mutate(changed)
        try:
            validate(changed)
        except (AssertionError, KeyError):
            continue
        raise AssertionError('negative control accepted')
    print('PASS: 6 negative controls rejected (word IDs, module, alignment, corpus collision, refusal, class)')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--self-test', action='store_true')
    args = parser.parse_args()
    raw = FIXTURE.read_bytes()
    assert FIXTURE.with_suffix('.sha256').read_text() == f'{hashlib.sha256(raw).hexdigest()}  {FIXTURE.name}\n', 'fixture SHA-256 mismatch'
    data = json.loads(raw)
    rows = validate(data)
    print('PASS: 24 development items: 12 recombinations, 6 refusals, 6 near-misses; direction counts 9 en-to-ko / 15 ko-to-en')
    print('PASS: SHA-256; pinned sources and unchanged rubric; taught word IDs/modules/chunks; zero corpus text collisions')
    collision_check(rows)
    if args.self_test:
        self_test(data)


if __name__ == '__main__':
    try:
        main()
    except (AssertionError, KeyError, ValueError, subprocess.CalledProcessError) as error:
        print(f'FAIL: {error}', file=sys.stderr)
        sys.exit(1)
