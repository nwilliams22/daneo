#!/usr/bin/env python3
"""Check every "Mnn's <hangul>" ownership claim in a brief against words.json.

Briefs repeatedly ship wrong module attributions, which every drafter then
has to find by hand. This catches them at writing time.

Usage:  briefowners.py brief-m118.md [brief-m119.md ...]
"""
import json, re, sys, os

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
words = json.load(open(os.path.join(REPO, "src/content/words.json")))
owners = {}
for w in words:
    owners.setdefault(w["ko"], set()).add(w["moduleId"])

# Words reserved in the Ring 3 ledger but not yet shipped. A brief may
# legitimately point at one of these when that module ships first.
reserved = {}
ledger = os.path.join(REPO, "reference/ring3-slices.tsv")
if os.path.exists(ledger):
    for line in open(ledger):
        parts = line.rstrip("\n").split("\t")
        if len(parts) >= 2 and parts[1].startswith("m"):
            reserved.setdefault(parts[0], set()).add(parts[1])

# "M32's 부분", "M9's 받다", also S2's / S4's
CLAIM = re.compile(r"\b([MS]\d+)'s\s+([가-힣]+)")

bad = wrong = missing = ok = 0
for path in sys.argv[1:]:
    text = open(path).read()
    rows = []
    for m in CLAIM.finditer(text):
        mod, ko = m.group(1), m.group(2)
        mid = mod.lower()
        have = owners.get(ko)
        if have is None and mid in reserved.get(ko, ()):
            rows.append(("pending", mod, ko, "reserved for that module, not yet shipped"))
        elif have is None:
            rows.append(("NOT-A-WORD", mod, ko, "no entry in words.json (taught-as? frozen?)"))
        elif mid not in have:
            rows.append(("WRONG-MODULE", mod, ko, "actually " + "/".join(sorted(have))))
        else:
            rows.append(("ok", mod, ko, ""))
    n_ok = sum(1 for r in rows if r[0] in ("ok", "pending"))
    probs = [r for r in rows if r[0] not in ("ok", "pending")]
    ok += n_ok
    wrong += sum(1 for r in probs if r[0] == "WRONG-MODULE")
    missing += sum(1 for r in probs if r[0] == "NOT-A-WORD")
    print(f"{os.path.basename(path)}: {len(rows)} claims, {n_ok} ok, {len(probs)} to fix")
    seen = set()
    for kind, mod, ko, why in probs:
        key = (kind, mod, ko)
        if key in seen:
            continue
        seen.add(key)
        print(f"  {kind:12} {mod}'s {ko}  — {why}")
    bad += len(probs)
print(f"\ntotal: {ok} ok, {wrong} wrong module, {missing} not a word entry")
sys.exit(1 if bad else 0)
