"""Negative test for the provenance checker's commit-order guard."""
from pathlib import Path
import subprocess
import sys
import unittest

ROOT = Path(__file__).resolve().parents[2]
CHECKER = Path(__file__).with_name('check-provenance.py')
FIXTURE = Path(__file__).with_name('fixtures') / 'provenance-misordered.jsonl'


class ProvenanceNegativeTest(unittest.TestCase):
    def test_checker_rejects_head_that_does_not_precede_report(self):
        report = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
        result = subprocess.run([sys.executable, str(CHECKER), str(FIXTURE), '--report-commit', report],
                                cwd=ROOT, text=True, capture_output=True)
        self.assertNotEqual(result.returncode, 0, result.stdout)
        self.assertIn('not an ancestor of report commit', result.stderr)


if __name__ == '__main__':
    unittest.main()
