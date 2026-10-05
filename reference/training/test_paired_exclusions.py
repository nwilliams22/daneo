"""Synthetic regression tests; never read reserved evaluation inputs."""
import copy
import importlib.util
import json
import os
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('freeze', Path(__file__).parents[1] / 'eval/check-independent-freeze.py')
freeze = importlib.util.module_from_spec(spec)
spec.loader.exec_module(freeze)


def pair():
    target = dict(korean='가 나', natural_english='example', literal_gap='explanation',
                  gloss=[dict(chunk='가', gloss='one'), dict(chunk='나', gloss='two')])
    return [dict(id=str(i), corpusSentenceId='synthetic', english='example', korean='가 나',
                 split='training', sourceGapId='synthetic-gap', input=source,
                 target=dict(target, direction=direction))
            for i, (direction, source) in enumerate([('en-to-ko', 'example'), ('ko-to-en', '가 나')])]


class PairTests(unittest.TestCase):
    def test_exact_pair_collapses_only_for_uniqueness(self):
        self.assertEqual(len(freeze.paired_anchors(pair())), 1)

    def test_reserved_keys_rejected_for_pairs(self):
        rows = pair()
        for row in rows:
            row['sourceEnglish'] = 'example'
        with tempfile.TemporaryDirectory(dir=os.environ.get('PAPERCLIP_RUN_SCRATCH_DIR')) as directory:
            path = Path(directory) / 'synthetic.json'
            path.write_text(json.dumps(dict(version='paired-1-candidates', trainingAllowed=False, items=rows)))
            for index, key in enumerate(('synthetic', 'example', '가나')):
                exclusions = [set(), set(), set()]
                exclusions[index].add(key)
                with self.subTest(index=index), self.assertRaises(AssertionError):
                    freeze.check_candidates(path, exclusions)

    def test_duplicate_direction_rejected(self):
        rows = pair()
        rows[1]['target']['direction'] = 'en-to-ko'
        with self.assertRaises(AssertionError):
            freeze.paired_anchors(rows)

    def test_different_target_rejected(self):
        rows = pair()
        rows[1]['target']['literal_gap'] = 'different'
        with self.assertRaises(AssertionError):
            freeze.paired_anchors(rows)

    def test_cross_split_rejected(self):
        rows = pair()
        rows[1]['split'] = 'development'
        with self.assertRaises(AssertionError):
            freeze.paired_anchors(rows)

    def test_third_copy_rejected(self):
        rows = pair()
        rows.append(copy.deepcopy(rows[0]))
        with self.assertRaises(AssertionError):
            freeze.paired_anchors(rows)

    def test_single_chunk_rejected(self):
        rows = pair()
        for row in rows:
            row['target']['gloss'] = [dict(chunk='가 나', gloss='example')]
        with self.assertRaises(AssertionError):
            freeze.paired_anchors(rows)


if __name__ == '__main__':
    unittest.main()
