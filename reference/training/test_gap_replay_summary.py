"""Regression checks for combining an interrupted replay without losing provenance."""
import contextlib
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('summary', Path(__file__).with_name('summarize-gap-replay.py'))
summary = importlib.util.module_from_spec(spec)
spec.loader.exec_module(summary)


def write(path, value):
    path.write_text(json.dumps(value)+'\n')


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


class ResumeSummaryTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(dir=os.environ.get('PAPERCLIP_RUN_SCRATCH_DIR'))
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.old_work = summary.WORK
        summary.WORK = self.root
        self.addCleanup(setattr, summary, 'WORK', self.old_work)
        self.rows = [dict(id=str(i), input=f'input {i}', direction='ko-to-en', split='training',
                         expected=dict(literal_gap='gap', gloss=[{}, {}])) for i in range(2)]
        for path, fixture, completed in [(self.root, self.rows, self.rows[:1]),
                                         (self.root/'continuation', self.rows[1:], self.rows[1:])]:
            path.mkdir(exist_ok=True)
            write(path/'inputs.json', dict(items=fixture))
            m = dict(modelSha256='model', promptSha256='prompt', fixtureSha256=sha(path/'inputs.json'))
            if path != self.root:
                m.update(exitCode=0, preservedRawSha256=sha(self.root/'raw.jsonl'),
                         preservedResultsSha256=sha(self.root/'results.jsonl'))
            write(path/'manifest.json', m)
            row = completed[0]
            reply = row['expected']
            write(path/'raw.jsonl', dict(requestId=row['id'], complete=True, rawReply=json.dumps(reply),
                  provenance=dict(modelSha256='model', promptSha256='prompt', itemSetSha256=m['fixtureSha256'])))
            write(path/'results.jsonl', dict(id=row['id'], input=row['input'], direction=row['direction'],
                  outcome=dict(ok=True, result=reply)))

    def run_summary(self):
        with contextlib.redirect_stdout(io.StringIO()):
            summary.summarize()

    def test_combines_disjoint_segments(self):
        self.run_summary()
        self.assertEqual(json.loads((self.root/'summary.json').read_text())['cells']['training']['rows'], 2)

    def test_rejects_changed_preserved_evidence(self):
        with (self.root/'raw.jsonl').open('a') as stream:
            stream.write('\n')
        with self.assertRaises(AssertionError):
            self.run_summary()

    def test_rejects_unfinished_continuation(self):
        path = self.root/'continuation/manifest.json'
        m = json.loads(path.read_text()); del m['exitCode']; write(path, m)
        with self.assertRaisesRegex(AssertionError, 'complete successfully'):
            self.run_summary()

    def test_rejects_wrong_provenance(self):
        path = self.root/'continuation/raw.jsonl'
        row = json.loads(path.read_text()); row['provenance']['itemSetSha256'] = 'wrong'; write(path, row)
        with self.assertRaises(AssertionError):
            self.run_summary()

    def test_rejects_duplicate_reply(self):
        path = self.root/'continuation/results.jsonl'
        path.write_text(path.read_text()*2)
        with self.assertRaises(AssertionError):
            self.run_summary()


if __name__ == '__main__':
    unittest.main()
