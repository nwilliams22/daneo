#!/usr/bin/env python3
"""Find shipped notes that call a word "riding frozen" when it was already taught.

The course's promise is that every word in a note is either owned by the
learner or explicitly marked as riding frozen. A note that freezes a word
the learner already has breaks that promise in the direction that matters:
it tells them they do not know something they do know.

Two things make this hard to check mechanically, and both are reported
rather than guessed at:
  - homographs. M66's 차다 is the kick; the 차다 that means "to be full" is
    a different word with the same spelling and is genuinely untaught.
  - quoting. A note may quote an EARLIER note's frozen claim verbatim, which
    is correct even though the word has since landed.

Usage:  frozenaudit.py            # print the report
        frozenaudit.py --tsv OUT  # write it for triage
"""
import json, re, sys, os

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
words = json.load(open(f"{REPO}/src/content/words.json"))
modules = json.load(open(f"{REPO}/src/content/modules.json"))
order = {m["id"]: m.get("order", 9999) for m in modules}

owner = {}
for w in words:
    owner.setdefault(w["ko"], []).append(w["moduleId"])

# a word is a homograph risk when more than one entry shares its spelling
multi = {k for k, v in owner.items() if len(v) > 1}

PAT = re.compile(r"([가-힣]{2,6})\s*(?:—[^)]{0,40}?)?(?:riding frozen|rides frozen)")

rows = []
for w in words:
    note = w.get("notes") or ""
    here = w["moduleId"]
    for m in PAT.finditer(note):
        cand = m.group(1)
        if cand not in owner or cand in multi:
            continue
        for om in owner[cand]:
            if om == here or order.get(om, 9999) >= order.get(here, 9999):
                continue
            j = m.start()
            ctx = re.sub(r"\s+", " ", note[max(0, j - 90):j + 60])
            # a quoted claim is one sitting inside double quotes
            before = note[:j]
            quoted = before.count('"') % 2 == 1
            rows.append((order.get(here, 9999), here, w["ko"], cand, om, "quoted" if quoted else "own-claim", ctx))

rows.sort()
own = [r for r in rows if r[5] == "own-claim"]
print(f"{len(rows)} frozen claims about an already-taught word; {len(own)} are the note's own claim, "
      f"{len(rows) - len(own)} sit inside a quotation of an earlier note.")
print("Homographs are excluded, so a word listed here has exactly one entry.\n")
for _, here, ko, cand, om, kind, ctx in own:
    print(f"  {here} {ko} freezes {cand}, taught in {om}")
    print(f"      …{ctx}…")

if "--tsv" in sys.argv:
    out = sys.argv[sys.argv.index("--tsv") + 1]
    with open(out, "w") as fh:
        fh.write("module\tnote_word\tfrozen_word\ttaught_in\tkind\tcontext\n")
        for _, here, ko, cand, om, kind, ctx in rows:
            fh.write(f"{here}\t{ko}\t{cand}\t{om}\t{kind}\t{ctx}\n")
    print(f"\nwrote {len(rows)} rows to {out}")
