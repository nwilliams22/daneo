"""Regression checks for frozen evaluation exclusions; never runs inference."""
import contextlib
import hashlib
import importlib.util
import io
import json
import shutil
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location(
    "freeze", Path(__file__).with_name("check-independent-freeze.py"))
freeze = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(freeze)


class FreezeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.directory = Path(self.temp.name)
        for path in freeze.EVAL.glob("*.json"):
            shutil.copy(path, self.directory)
        for path in freeze.EVAL.glob("*.sha256"):
            shutil.copy(path, self.directory)
        self.patcher = patch.multiple(
            freeze, EVAL=self.directory,
            FIXTURE=self.directory / freeze.FIXTURE.name,
            MANIFEST=self.directory / freeze.MANIFEST.name)
        self.patcher.start()
        self.addCleanup(self.patcher.stop)

    def check(self):
        with contextlib.redirect_stdout(io.StringIO()):
            return freeze.check()

    def alter(self, name, change):
        path = self.directory / name
        data = json.loads(path.read_text())
        change(data)
        path.write_text(json.dumps(data, ensure_ascii=False) + "\n")
        path.with_suffix(".sha256").write_text(
            f"{hashlib.sha256(path.read_bytes()).hexdigest()}  {path.name}\n")

    def test_current_reservations(self):
        self.assertEqual([len(keys) for keys in self.check()], [136] * 3)

    def test_tampered_bytes(self):
        path = self.directory / "v3-translation-set.json"
        path.write_bytes(path.read_bytes() + b" ")
        with self.assertRaisesRegex(AssertionError, "SHA-256"):
            self.check()

    def test_rehashed_wrong_input(self):
        self.alter("v3-dev-set.json", lambda data: data["items"][0].update(input="wrong"))
        with self.assertRaisesRegex(AssertionError, "bad input"):
            self.check()

    def test_rehashed_wrong_anchor(self):
        self.alter("v3-translation-set.json", lambda data: data["items"][0]["corpusAnchor"].update(gloss="wrong"))
        with self.assertRaisesRegex(AssertionError, "bad corpus anchor"):
            self.check()

    def test_gate_development_overlap(self):
        row = json.loads((self.directory / "v3-translation-set.json").read_text())["items"][0]
        row.update(id="DAN-V3-DEV-01", heldOut=False)
        self.alter("v3-dev-set.json", lambda data: data["items"].__setitem__(0, row))
        with self.assertRaisesRegex(AssertionError, "duplicate ID reservation"):
            self.check()

    def test_gap_weight(self):
        self.alter("v3-translation-set.json", lambda data: data["items"][0].update(coverageClass="gloss"))
        with self.assertRaisesRegex(AssertionError, "four literal-gap"):
            self.check()

    def test_small_development_split(self):
        self.alter("v3-dev-set.json", lambda data: data["items"].pop())
        with self.assertRaisesRegex(AssertionError, "wrong row count"):
            self.check()

    def test_single_key_candidates_rejected_for_both_splits(self):
        exclusions = self.check()
        for name in ("v3-translation-set.json", "v3-dev-set.json"):
            reserved = json.loads((self.directory / name).read_text())["items"][0]
            # Fullwidth Latin, case, punctuation, whitespace and decomposed
            # Hangul must not create a way around text exclusions.
            import unicodedata
            english = " ! " + "".join(chr(ord(c) + 0xFEE0) if '!' <= c <= '~' else c
                                      for c in reserved["expectedReadingEnglish"].upper()) + " ? "
            korean = " ! " + unicodedata.normalize("NFD", reserved["corpusAnchor"]["korean"]) + " ? "
            for key, value in (("corpusSentenceId", reserved["corpusSentenceId"]),
                               ("english", english), ("korean", korean)):
                with self.subTest(split=name, key=key):
                    candidate = {"corpusSentenceId": "unused-id", "english": "unused English", "korean": "미사용 문장"}
                    candidate[key] = value
                    path = self.directory / "candidate.json"
                    path.write_text(json.dumps([candidate]))
                    with self.assertRaisesRegex(AssertionError, "uses reserved"):
                        freeze.check_candidates(path, exclusions)


if __name__ == "__main__":
    unittest.main()
