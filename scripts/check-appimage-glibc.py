#!/usr/bin/env python3
"""Report required ELF symbol versions and enforce the AppImage glibc floor."""
import argparse
import json
import os
from pathlib import Path
import re
import subprocess


def requirements(version_info):
    # Only .gnu.version_r requirements count; exported definitions do not.
    match = re.search(r"Version needs section.*?(?=\nVersion .* section|\Z)",
                      version_info, re.S)
    return sorted(set(re.findall(r"Name: (GLIBC_\S+)", match[0]))) if match else []


def violations(versions, ceiling=(2, 35)):
    rejected = []
    for version in versions:
        numeric = re.fullmatch(r"GLIBC_(\d+(?:\.\d+)+)", version)
        if numeric:
            if tuple(map(int, numeric[1].split('.'))) > ceiling:
                rejected.append(version)
        else:
            # ABI tags (including DT_RELR and GNU2 TLS) exceed the Jammy baseline.
            rejected.append(version)
    return rejected


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('root', type=Path)
    parser.add_argument('--runtime', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    if not (args.root / 'usr/bin/daneo').is_file():
        parser.error('extracted AppImage must contain usr/bin/daneo')
    files = []
    for path in [args.runtime, *sorted(args.root.rglob('*'))]:
        if path.is_symlink() or not path.is_file():
            continue
        with path.open('rb') as stream:
            if stream.read(4) != b'\x7fELF':
                continue
        result = subprocess.run(['readelf', '--version-info', '--wide', str(path)],
                                check=True, capture_output=True, text=True,
                                env={**os.environ, 'LC_ALL': 'C'})
        versions = requirements(result.stdout)
        numeric = [v for v in versions if re.fullmatch(r'GLIBC_\d+(?:\.\d+)+', v)]
        maximum = max(numeric, key=lambda v: tuple(map(int, v[6:].split('.'))), default=None)
        files.append({'path': str(path), 'required': versions, 'maximum': maximum,
                      'rejected': violations(versions)})
    report = {'ceiling': 'GLIBC_2.35', 'elf_count': len(files), 'files': files,
              'passed': bool(files) and not any(f['rejected'] for f in files)}
    args.output.write_text(json.dumps(report, indent=2) + '\n')
    print(f"{len(files)} ELF files: GLIBC_2.35 ceiling {'PASS' if report['passed'] else 'FAIL'}")
    for file in files:
        if file['rejected']:
            print(file['path'], ', '.join(file['rejected']))
    raise SystemExit(0 if report['passed'] else 1)


if __name__ == '__main__':
    main()
