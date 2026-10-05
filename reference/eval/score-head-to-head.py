"""Join native raw evidence to independent linguistic verdicts; refuse incomplete scores."""
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "reference/eval/raw"
DIMENSIONS = ("meaning", "gloss", "particles", "politeRegister", "romanization", "literalGap")

def rows(path):
    return [json.loads(line) for line in path.read_text().splitlines()]

def percentile95(values):
    ordered = sorted(values)
    return ordered[(95 * len(ordered) + 99) // 100 - 1]

def score(engine, item_set, judgments):
    prefix = f"head-to-head-{engine}-{item_set}"
    fixture = json.loads((ROOT / "reference/eval" / ("training-independent-inputs.json" if item_set == "independent" else "v0-translation-set.json")).read_text())
    results = rows(RAW / f"{prefix}-results.jsonl")
    raw = rows(RAW / f"{prefix}-raw.jsonl")
    assembled = json.loads((RAW / f"{prefix}-assembled.json").read_text())
    expected = fixture["items"]
    if [row["id"] for row in results[1:-1]] != [item["id"] for item in expected]:
        raise ValueError(f"{prefix}: result IDs or count mismatch")
    if [row["requestId"] for row in raw[1:]] != [item["id"] for item in expected]:
        raise ValueError(f"{prefix}: raw IDs or count mismatch")
    if results[0]["id"] != "warmup" or results[-1]["id"] != "cancel-demo":
        raise ValueError(f"{prefix}: warmup/cancellation rows missing")
    if len(raw) != len(results) - 1:
        raise ValueError(f"{prefix}: raw/result row count mismatch")
    if len(assembled) != len(raw):
        raise ValueError(f"{prefix}: assembled/result row count mismatch")
    if set(judgments) != {item["id"] for item in expected}:
        raise ValueError(f"{prefix}: linguistic verdicts incomplete or extra")
    output = []
    for item, result, reply, checked in zip(expected, results[1:-1], raw[1:], assembled[1:]):
        if result["input"] != item["input"] or result["direction"] != item["direction"]:
            raise ValueError(f"{prefix}: submitted input differs from fixture for {item['id']}")
        verdict = judgments[item["id"]]
        if item_set == "v0":
            if set(verdict["dimensions"]) != set(DIMENSIONS):
                raise ValueError(f"{prefix}: missing dimension for {item['id']}")
            for name in DIMENSIONS:
                value = verdict["dimensions"][name]
                if not isinstance(value["pass"], bool) or not value["evidence"]:
                    raise ValueError(f"{prefix}: missing verdict for {item['id']} {name}")
        elif not isinstance(verdict.get("coveragePass"), bool) or not verdict.get("evidence"):
            raise ValueError(f"{prefix}: missing primary coverage verdict for {item['id']}")
        for flag in ("meaningReversal", "inventedRule"):
            if not isinstance(verdict[flag], bool):
                raise ValueError(f"{prefix}: missing {flag} for {item['id']}")
        if checked["id"] != item["id"]:
            raise ValueError(f"{prefix}: assembled ID mismatch for {item['id']}")
        parsed = checked["assembled"]
        schema = checked["rawMatches"] and checked["strictValid"] and checked["schemaValid"]
        native_result = result["outcome"].get("result") if result["outcome"].get("ok") else None
        direction = isinstance(native_result, dict) and native_result.get("direction") == item["direction"]
        leaked = any(marker in reply["rawReply"].lower() for marker in ("<think>", "</think>", "<|im_start|>assistant", "reasoning:"))
        fully = (schema and direction and not leaked and all(verdict["dimensions"][name]["pass"] for name in DIMENSIONS)
                 and not verdict["meaningReversal"] and not verdict["inventedRule"]) if item_set == "v0" else None
        coverage = (schema and direction and not leaked and verdict["coveragePass"]
                    and not verdict["meaningReversal"] and not verdict["inventedRule"]) if item_set == "independent" else None
        output.append(dict(id=item["id"], input=item["input"], rawReply=reply["rawReply"], parsedReply=parsed,
                           schemaComplete=schema, directionCorrect=direction, thinkingLeak=leaked,
                           coverageClass=item.get("coverageClass"), coveragePass=coverage,
                           coverageEvidence=verdict.get("evidence"), dimensions=verdict.get("dimensions"),
                           meaningReversal=verdict["meaningReversal"], inventedRule=verdict["inventedRule"], fullyCorrect=fully,
                           readyMs=result["readyMs"], firstTokenMs=result["firstTokenMs"], completionMs=result["completionMs"],
                           provenance=reply["provenance"]))
    summary = dict(items=len(output), schemaComplete=sum(row["schemaComplete"] for row in output),
                   directionCorrect=sum(row["directionCorrect"] for row in output),
                   thinkingLeaks=sum(row["thinkingLeak"] for row in output),
                   meaningReversals=sum(row["meaningReversal"] for row in output),
                   inventedRules=sum(row["inventedRule"] for row in output),
                   warmP95Ms=percentile95([row["completionMs"] for row in output]),
                   coldReadyMs=results[0]["readyMs"], coldFirstTokenMs=results[0]["firstTokenMs"])
    if item_set == "v0":
        summary["fullyCorrect"] = sum(row["fullyCorrect"] for row in output)
        summary["dimensionPasses"] = {name: sum(row["dimensions"][name]["pass"] for row in output) for name in DIMENSIONS}
        summary["absoluteGateMet"] = (summary["schemaComplete"] == 10 and summary["directionCorrect"] == 10
            and summary["thinkingLeaks"] == 0 and summary["fullyCorrect"] >= 9
            and summary["meaningReversals"] == 0 and summary["inventedRules"] == 0)
    else:
        summary["coveragePasses"] = {name: sum(row["coveragePass"] for row in output if row["coverageClass"] == name)
                                     for name in ("gloss", "semantic-fidelity", "register", "literal-gap")}
    return {"engine": engine, "itemSet": item_set, "summary": summary, "results": output}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("engine", choices=("base", "fine-tune"))
    parser.add_argument("item_set", choices=("independent", "v0"))
    parser.add_argument("judgments", type=Path)
    args = parser.parse_args()
    verdicts = json.loads(args.judgments.read_text())
    output = score(args.engine, args.item_set, verdicts)
    path = RAW / f"head-to-head-{args.engine}-{args.item_set}-scored.json"
    with path.open("x") as stream:
        json.dump(output, stream, ensure_ascii=False, indent=2)
        stream.write("\n")
    print(json.dumps(output["summary"], indent=2))

if __name__ == "__main__":
    main()
