"""Ensure configured data, rather than historical v2 files, gates training."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]


class PreflightTests(unittest.TestCase):
    def test_unapproved_dataset_stops_before_model_loading(self):
        with tempfile.TemporaryDirectory(dir=os.environ.get('PAPERCLIP_RUN_SCRATCH_DIR')) as directory:
            data = Path(directory) / 'unapproved.json'
            data.write_text(json.dumps(dict(trainingAllowed=False, items=[])))
            config = Path(directory) / 'config.json'
            config.write_text(json.dumps(dict(dataset=str(data), dataset_sha256=hashlib.sha256(data.read_bytes()).hexdigest())))
            run = subprocess.run([sys.executable, 'reference/training/train-v1.py', '--config', str(config)],
                                 cwd=ROOT, capture_output=True, text=True)
            self.assertNotEqual(run.returncode, 0)
            self.assertIn('dataset is not approved for training', run.stderr)
            self.assertNotIn('unsloth', run.stderr)

    def test_validator_checks_explicit_file(self):
        with tempfile.TemporaryDirectory(dir=os.environ.get('PAPERCLIP_RUN_SCRATCH_DIR')) as directory:
            data = Path(directory) / 'malformed.json'
            data.write_text(json.dumps(dict(version='synthetic', items=[dict(target={})])))
            run = subprocess.run(['node', '--import', 'tsx', 'reference/training/validate-v1.mjs', '--dataset-path', str(data)],
                                 cwd=ROOT, capture_output=True, text=True)
            self.assertNotEqual(run.returncode, 0)
            self.assertIn('ZodError', run.stderr)


if __name__ == '__main__':
    unittest.main()
