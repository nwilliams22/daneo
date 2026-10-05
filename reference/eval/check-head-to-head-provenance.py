"""Verify committed raw runs against their pre-run prompt and frozen fixtures."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[2]
PROMPT = "src/lib/translation-prompt.json"
RUBRIC = "reference/eval/v0-rubric.md"
SETS = {
    "independent": "reference/eval/training-independent-inputs.json",
    "v0": "reference/eval/v0-translation-set.json",
}

def git_bytes(commit, path):
    return subprocess.check_output(["git", "show", f"{commit}:{path}"], cwd=ROOT)

def sha(data):
    return hashlib.sha256(data).hexdigest()

def check(report_commit):
    for item_set, set_path in SETS.items():
        for engine in ("base", "fine-tune"):
            raw_path = f"reference/eval/raw/head-to-head-{engine}-{item_set}-raw.jsonl"
            content = (ROOT / raw_path).read_bytes()
            if content != git_bytes(report_commit, raw_path):
                raise ValueError(f"Evidence not committed at report revision: {raw_path}")
            rows = [json.loads(line) for line in content.splitlines()]
            fixture = json.loads(git_bytes(report_commit, set_path))
            ids = [row["id"] for row in fixture["items"]]
            if len(rows) != len(ids) + 1 or [r["requestId"] for r in rows] != ["warmup", *ids]:
                raise ValueError(f"Unexpected request IDs or count: {raw_path}")
            for row in rows:
                p = row["provenance"]
                head = p["head"]
                if subprocess.run(["git", "merge-base", "--is-ancestor", head, report_commit], cwd=ROOT).returncode:
                    raise ValueError(f"Run HEAD is not an ancestor: {head}")
                for key, path in (("promptSha256", PROMPT), ("rubricSha256", RUBRIC), ("itemSetSha256", set_path)):
                    if p[key] != sha(git_bytes(head, path)):
                        raise ValueError(f"{key} mismatch: {raw_path}")
                if p["itemSetPath"] != set_path:
                    raise ValueError(f"Fixture path mismatch: {raw_path}")
                if p["modelSha256"] != ("00fe7986ff5f6b463e62455821146049db6f9313603938a70800d1fb69ef11a4" if engine == "base" else "1b6a3bf392e872eede021b70294b8611ea82743412a0215807f4f55d8d64e0d7"):
                    raise ValueError(f"Model hash mismatch: {raw_path}")
                if p["modelBytes"] != (2740937888 if engine == "base" else 4610579744):
                    raise ValueError(f"Model byte count mismatch: {raw_path}")
            print(f"PASS: {engine} {item_set}: {len(ids)} item rows, pre-run prompt and fixture hashes")
    source = git_bytes(report_commit, "reference/eval/training-independent-set.json")
    manifest = git_bytes(report_commit, "reference/eval/training-independent-set.sha256").decode().split()[0]
    fixture = json.loads(git_bytes(report_commit, SETS["independent"]))
    if sha(source) != manifest or fixture["sourceSetSha256"] != manifest:
        raise ValueError("Independent source manifest mismatch")
    original = json.loads(source)["items"]
    derived = fixture["items"]
    for src, row in zip(original, derived, strict=True):
        for key in ("id", "corpusSentenceId", "moduleId", "coverageClass"):
            if row[key] != src[key]:
                raise ValueError(f"Independent source field mismatch: {row['id']} {key}")
        if row["input"] != src["english"] or row["direction"] != "en-to-ko":
            raise ValueError(f"Independent input mismatch: {row['id']}")
    print("PASS: independent inputs derive exactly from the committed reservation")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--report-commit", required=True)
    check(parser.parse_args().report_commit)
