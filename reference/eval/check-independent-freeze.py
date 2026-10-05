#!/usr/bin/env python3
"""Check the independent evaluation reservation against the pinned corpus."""

import argparse
import collections
import hashlib
import json
import subprocess
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EVAL = ROOT / "reference/eval"
FIXTURE = EVAL / "training-independent-set.json"
MANIFEST = EVAL / "training-independent-set.sha256"
PREVIOUS = ("v0", "v1", "dev", "v2")
CLASSES = ("gloss", "semantic-fidelity", "register", "literal-gap")


def normalized(value):
    return "".join(char for char in unicodedata.normalize("NFKC", value).casefold()
                   if not char.isspace() and not unicodedata.category(char).startswith("P"))


def source_at(commit, path):
    return json.loads(subprocess.check_output(
        ["git", "show", f"{commit}:{path}"], cwd=ROOT, text=True
    ))


def joined(chunks):
    return " ".join(chunk["t"] for chunk in chunks if chunk["t"]).strip()


def check():
    fixture_bytes = FIXTURE.read_bytes()
    expected_manifest = f"{hashlib.sha256(fixture_bytes).hexdigest()}  {FIXTURE.name}\n"
    assert MANIFEST.read_text() == expected_manifest, "SHA-256 manifest mismatch"
    fixture = json.loads(fixture_bytes)
    assert fixture["version"] == "independent-1" and fixture["reservationOnly"] is True
    assert fixture["sourceFiles"] == ["src/content/sentences.json", "src/content/modules.json"]
    commit = fixture["corpusCommit"]
    corpus = {row["id"]: row for row in source_at(commit, fixture["sourceFiles"][0])}
    modules = source_at(commit, fixture["sourceFiles"][1])
    module_for = {sid: module["id"] for module in modules for sid in module["sentenceIds"]}
    assert len(fixture["items"]) == 60, "expected 60 new reservations"
    assert len({row["id"] for row in fixture["items"]}) == 60, "duplicate reservation id"
    assert collections.Counter(row["coverageClass"] for row in fixture["items"]) == dict.fromkeys(CLASSES, 15), "coverage imbalance"

    reservations = []
    for name in PREVIOUS:
        for row in json.loads((EVAL / f"{name}-translation-set.json").read_text())["items"]:
            reservations.append((name, row["corpusSentenceId"],
                                 row["expectedReadingEnglish"], row["corpusAnchor"]["korean"]))
    assert len(reservations) == 36, "existing reservation count changed; review exclusions"
    for row in fixture["items"]:
        sid = row["corpusSentenceId"]
        assert sid in corpus and row["moduleId"] == module_for[sid], f"bad anchor: {sid}"
        assert row["english"] == joined(corpus[sid]["en"]), f"English differs from corpus: {sid}"
        assert row["korean"] == joined(corpus[sid]["ko"]), f"Korean differs from corpus: {sid}"
        reservations.append(("independent", sid, row["english"], row["korean"]))

    keys = [set(), set(), set()]
    for name, sid, english, korean in reservations:
        for label, key, seen in zip(("ID", "English", "Korean"),
                                    (sid, normalized(english), normalized(korean)), keys):
            assert key and key not in seen, f"duplicate {label} reservation: {name}/{sid}"
            seen.add(key)
    print(f"PASS: {len(fixture['items'])} independent anchors; {len(reservations)-len(fixture['items'])} prior reservations; 96 unique IDs, normalized English and Korean texts")
    print("PASS: pinned corpus text/module provenance; 15 each gloss, semantic-fidelity, register, literal-gap; SHA-256 manifest")
    return keys


def check_candidates(path, exclusions):
    data = json.loads(path.read_text())
    rows = data["items"] if isinstance(data, dict) else data
    seen_candidates = [set(), set(), set()]
    for number, row in enumerate(rows, 1):
        for label, key, seen in zip(("ID", "English", "Korean"),
                                    (row["corpusSentenceId"], normalized(row["english"]), normalized(row["korean"])), exclusions):
            assert key and key not in seen, f"candidate {number} uses reserved {label}: {row['corpusSentenceId']}"
        for label, key, seen in zip(("ID", "English", "Korean"),
                                    (row["corpusSentenceId"], normalized(row["english"]), normalized(row["korean"])), seen_candidates):
            assert key not in seen, f"duplicate candidate {label} at row {number}"
            seen.add(key)
    if isinstance(data, dict) and data.get("version") == "training-2-candidates":
        previous = json.loads((ROOT / "reference/training/dataset-v1.json").read_text())["items"]
        for row in previous:
            for key, seen in zip((row["corpusSentenceId"], normalized(row["english"]), normalized(row["korean"])), seen_candidates):
                assert key not in seen, "v2 candidate overlaps a v1 training example"
        splits = collections.Counter(row["split"] for row in rows)
        assert splits == {"training": 250, "development": 40}, "candidate split changed"
        print("PASS: training/development disjoint by ID and normalized texts; all candidates avoid v1 training")
    print(f"PASS: {len(rows)} candidate rows avoid all 96 reservations; no internal duplicate keys")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--candidates", type=Path, help="JSON array or {items: [...]} with corpusSentenceId, english, korean")
    args = parser.parse_args()
    try:
        exclusions = check()
        if args.candidates:
            check_candidates(args.candidates, exclusions)
    except (AssertionError, KeyError, ValueError, subprocess.CalledProcessError) as error:
        print(f"FAIL: {error}", file=sys.stderr)
        sys.exit(1)
