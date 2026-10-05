"""Run each frozen comparison set once through the unchanged native worker."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[2]
SETS = {
    "independent": ROOT / "reference/eval/training-independent-inputs.json",
    "v0": ROOT / "reference/eval/v0-translation-set.json",
}
MODELS = {
    "base": ROOT / ".local-models/Qwen3.5-4B-Q4_K_M.gguf",
    "fine-tune": ROOT / ".local-models/v1/candidate-Q8_0.gguf",
}
EXPECTED = {
    "base": (2740937888, "00fe7986ff5f6b463e62455821146049db6f9313603938a70800d1fb69ef11a4"),
    "fine-tune": (4610579744, "1b6a3bf392e872eede021b70294b8611ea82743412a0215807f4f55d8d64e0d7"),
}

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("engine", choices=MODELS)
    parser.add_argument("item_set", choices=SETS)
    args = parser.parse_args()
    model, fixture = MODELS[args.engine], SETS[args.item_set]
    output = ROOT / "reference/eval/raw" / f"head-to-head-{args.engine}-{args.item_set}"
    for suffix in ("-raw.jsonl", "-results.jsonl", "-resources.txt"):
        if Path(str(output) + suffix).exists():
            raise SystemExit(f"Existing evidence: {output}{suffix}; refusing a second run")
    size, digest = EXPECTED[args.engine]
    if model.stat().st_size != size or sha(model) != digest:
        raise SystemExit(f"Model identity mismatch: {model}")
    head = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    paths = [fixture, ROOT / "src/lib/translation-prompt.json", ROOT / "reference/eval/v0-rubric.md"]
    for path in paths:
        relative = str(path.relative_to(ROOT))
        if path.read_bytes() != subprocess.check_output(["git", "show", f"{head}:{relative}"], cwd=ROOT):
            raise SystemExit(f"Uncommitted evaluation input: {relative}")
    rel_fixture = str(fixture.relative_to(ROOT))
    env = dict(os.environ,
        DANEO_MODEL_PATH=str(model),
        DANEO_ACCEPTANCE_MODEL_BYTES=str(size),
        DANEO_ACCEPTANCE_MODEL_SHA256=digest,
        DANEO_ACCEPTANCE_HEAD=head,
        DANEO_ACCEPTANCE_PROMPT_SHA256=sha(paths[1]),
        DANEO_ACCEPTANCE_RUBRIC_SHA256=sha(paths[2]),
        DANEO_ACCEPTANCE_SET_PATH=rel_fixture,
        DANEO_ACCEPTANCE_SET_SHA256=sha(fixture),
        DANEO_ACCEPTANCE_RAW=str(output) + "-raw.jsonl",
    )
    with Path(str(output) + "-resources.txt").open("x") as resources:
        subprocess.run([
            "/usr/bin/time", "-v", "unshare", "--user", "--map-root-user", "--net",
            str(ROOT / "src-tauri/target/release/examples/prompt_probe"),
            rel_fixture, str(output) + "-results.jsonl",
        ], cwd=ROOT, env=env, stderr=resources, check=True)
    rows = [json.loads(line) for line in Path(str(output) + "-results.jsonl").read_text().splitlines()]
    expected = len(json.loads(fixture.read_text())["items"])
    if len(rows) != expected + 2:
        raise SystemExit(f"Expected {expected} items plus warmup and cancellation, got {len(rows)} rows")
    print(f"{args.engine} {args.item_set}: {expected} items, raw and parsed results retained")

if __name__ == "__main__":
    main()
