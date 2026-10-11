"""Regression checks for the release baseline gate (stdlib only)."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('baseline', Path(__file__).with_name('check-appimage-glibc.py'))
baseline = importlib.util.module_from_spec(spec)
spec.loader.exec_module(baseline)


class BaselineTest(unittest.TestCase):
    def test_only_requirements_count(self):
        self.assertEqual(baseline.requirements('''Version definition section '.gnu.version_d' contains 1 entry:
  Name: GLIBC_2.43
Version needs section '.gnu.version_r' contains 1 entry:
  Name: GLIBC_2.35  Flags: none
  Name: GLIBC_2.2.5  Flags: none
'''), ['GLIBC_2.2.5', 'GLIBC_2.35'])

    def test_numeric_order_and_ceiling(self):
        self.assertEqual(baseline.violations(['GLIBC_2.9', 'GLIBC_2.35', 'GLIBC_2.36', 'GLIBC_2.43']),
                         ['GLIBC_2.36', 'GLIBC_2.43'])

    def test_abi_tags(self):
        self.assertEqual(baseline.violations(['GLIBC_ABI_DT_RELR', 'GLIBC_ABI_GNU2_TLS', 'GLIBC_PRIVATE']),
                         ['GLIBC_ABI_DT_RELR', 'GLIBC_ABI_GNU2_TLS', 'GLIBC_PRIVATE'])

    def test_static_elf(self):
        self.assertEqual(baseline.requirements('No version information found in this file.'), [])


unittest.main()
