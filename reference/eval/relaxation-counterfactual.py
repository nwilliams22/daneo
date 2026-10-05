#!/usr/bin/env python3
"""Recount fully-correct items when rubric dimensions are dropped.

This answers one question for the engine decision in `engine-decision.md`: if a
dimension of `v0-rubric.md` were relaxed, would either measured engine reach the
unchanged >=9/10 bar? It recomputes from the committed per-item dimension
verdicts under `raw/head-to-head-*-v0-scored.json` and invents no judgment.

It applies the one settled correction from the independent re-score: base
DAN-V0-KE-04 meaning passes, because the frozen item allows the understood
first-person subject. That lifts the base from the committed first-pass 3/10 to
the settled 4/10.

This script does not change the rubric, the scores on disk, or any model pin.
Dropping a dimension is a hypothetical, not a proposal.

    python3 reference/eval/relaxation-counterfactual.py
"""

import itertools
import json
import pathlib
import sys

DIMENSIONS = [
    "meaning",
    "gloss",
    "particles",
    "politeRegister",
    "romanization",
    "literalGap",
]

# Dimensions the model alone is responsible for and that a relaxation might
# plausibly target. `particles` and `romanization` are computed in
# src/lib/translation-postprocess.ts, and `meaning` is not negotiable.
RELAXABLE = ["literalGap", "politeRegister", "gloss"]

# Settled by the independent re-score; see BAD-233 and engine-decision.md.
CORRECTIONS = {("base", "DAN-V0-KE-04"): {"meaning": True}}

ENGINES = ("base", "fine-tune")
THRESHOLD = 9

RAW = pathlib.Path(__file__).resolve().parent / "raw"


def load(engine):
    path = RAW / f"head-to-head-{engine}-v0-scored.json"
    report = json.loads(path.read_text(encoding="utf-8"))
    rows = []
    for result in report["results"]:
        verdicts = {
            dimension: bool(result["dimensions"][dimension]["pass"])
            for dimension in DIMENSIONS
        }
        verdicts.update(CORRECTIONS.get((engine, result["id"]), {}))
        rows.append(
            {
                "id": result["id"],
                "verdicts": verdicts,
                "meaningReversal": bool(result["meaningReversal"]),
                "inventedRule": bool(result["inventedRule"]),
            }
        )
    return rows


def fully_correct(rows, dropped):
    kept = [dimension for dimension in DIMENSIONS if dimension not in dropped]
    return sum(1 for row in rows if all(row["verdicts"][dimension] for dimension in kept))


def main():
    for engine in ENGINES:
        rows = load(engine)
        reversals = sum(1 for row in rows if row["meaningReversal"])
        invented = sum(1 for row in rows if row["inventedRule"])
        print(f"{engine}: {len(rows)} items, {reversals} meaning reversals, {invented} invented rules")
        ceiling, worst_case = 0, ()
        for size in range(len(RELAXABLE) + 1):
            for dropped in itertools.combinations(RELAXABLE, size):
                count = fully_correct(rows, set(dropped))
                label = " + ".join(dropped) if dropped else "(nothing dropped)"
                print(f"  drop {label:42s} -> {count}/{len(rows)} fully correct")
                if count > ceiling:
                    ceiling, worst_case = count, dropped
        label = " + ".join(worst_case) if worst_case else "(nothing dropped)"
        print(f"  ceiling {ceiling}/{len(rows)} by dropping {label}")
        if ceiling >= THRESHOLD and reversals == 0 and invented == 0:
            print(f"  REACHES the >={THRESHOLD}/10 bar only under that relaxation")
        else:
            print(f"  never reaches the >={THRESHOLD}/10 bar with zero reversals and zero invented rules")
    return 0


if __name__ == "__main__":
    sys.exit(main())
