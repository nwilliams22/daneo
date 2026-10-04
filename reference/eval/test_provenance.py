"""Exercise provenance against a real ordered and misordered Git history."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SOURCE_CHECKER = Path(__file__).with_name('check-provenance.py')


def git(repo, *args, text=True):
    return subprocess.check_output(['git', *args], cwd=repo, text=text).strip() if text else subprocess.check_output(['git', *args], cwd=repo)


class ProvenanceHistoryTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.repo = Path(self.temp.name)
        git(self.repo, 'init', '-q')
        git(self.repo, 'config', 'user.email', 'test@example.invalid')
        git(self.repo, 'config', 'user.name', 'Test')
        (self.repo / 'reference/eval').mkdir(parents=True)
        (self.repo / 'src/lib').mkdir(parents=True)
        (self.repo / 'reference/eval/check-provenance.py').write_bytes(SOURCE_CHECKER.read_bytes())
        (self.repo / 'src/lib/translation-prompt.json').write_text('{"prompt":"frozen"}\n')
        (self.repo / 'reference/eval/v0-rubric.md').write_text('frozen rubric\n')
        self.set_path = 'reference/eval/v1-translation-set.json'
        set_bytes = b'{"items":[]}\n'
        (self.repo / self.set_path).write_bytes(set_bytes)
        (self.repo / 'reference/eval/v1-translation-set.sha256').write_text(hashlib.sha256(set_bytes).hexdigest() + '  v1-translation-set.json\n')
        git(self.repo, 'add', '.')
        git(self.repo, 'commit', '-qm', 'freeze artifacts')
        self.frozen_head = git(self.repo, 'rev-parse', 'HEAD')

    def tearDown(self):
        self.temp.cleanup()

    def make_report(self, recorded_head):
        provenance = {
            'head': recorded_head,
            'promptSha256': hashlib.sha256(git(self.repo, 'show', f'{recorded_head}:src/lib/translation-prompt.json', text=False)).hexdigest(),
            'rubricSha256': hashlib.sha256(git(self.repo, 'show', f'{recorded_head}:reference/eval/v0-rubric.md', text=False)).hexdigest(),
            'itemSetPath': self.set_path,
            'itemSetSha256': hashlib.sha256(git(self.repo, 'show', f'{recorded_head}:{self.set_path}', text=False)).hexdigest(),
        }
        raw = self.repo / 'reference/eval/raw.jsonl'
        raw.write_text(json.dumps({'provenance': provenance}) + '\n')
        git(self.repo, 'add', str(raw.relative_to(self.repo)))
        git(self.repo, 'commit', '-qm', 'record report')
        return raw, git(self.repo, 'rev-parse', 'HEAD')

    def check(self, raw, report):
        return subprocess.run([sys.executable, str(self.repo / 'reference/eval/check-provenance.py'), str(raw),
                               '--report-commit', report, '--item-set', self.set_path],
                              cwd=self.repo, text=True, capture_output=True)

    def test_ordered_head_passes(self):
        raw, report = self.make_report(self.frozen_head)
        result = self.check(raw, report)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('PROVENANCE PASS', result.stdout)

    def test_valid_later_head_fails_ancestry_check(self):
        git(self.repo, 'checkout', '-qb', 'later')
        (self.repo / 'later.txt').write_text('later commit\n')
        git(self.repo, 'add', 'later.txt')
        git(self.repo, 'commit', '-qm', 'later unrelated head')
        later_head = git(self.repo, 'rev-parse', 'HEAD')
        git(self.repo, 'checkout', '-q', 'master')
        raw, report = self.make_report(later_head)
        result = self.check(raw, report)
        self.assertNotEqual(result.returncode, 0, result.stdout)
        self.assertIn('not an ancestor of report commit', result.stderr)


if __name__ == '__main__':
    unittest.main()
