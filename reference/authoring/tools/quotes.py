#!/usr/bin/env python3
"""quotes.py DIR mNN — pull every quoted span from a draft bundle (word notes,
sentence notes, gap notes, md) and check it appears VERBATIM somewhere in the
shipped corpus (notes, sentence notes, gap notes/real, module md). Pairs ALL
double quotes first, then filters by length (short 'noun' quotes break parity
otherwise). Also checks ('…') spans inside JSON notes."""
import sys, re, json, os; sys.path.insert(0, os.path.dirname(__file__))
from _corpus import *
D, MID = sys.argv[1], sys.argv[2]
words, sents, gaps, mods, mds = load()
corpus = corpus_text(words, sents, gaps, mds)
big = "\n".join(t for _, t in corpus)
def norm(s): return s.replace("’","'").replace("“",'"').replace("”",'"')
bign = norm(big)
draft = []
for w in json.load(open(f"{D}/draft-{MID}.words.json")): draft.append((w["id"], w["notes"]))
for s in json.load(open(f"{D}/draft-{MID}.sentences.json")): draft.append((s["id"], s["note"]))
for g in json.load(open(f"{D}/draft-{MID}.gap.json")): draft.append((g["id"], g["note"]))
draft.append(("md", open(f"{D}/draft-{MID}.md").read()))
miss = ok = 0
for src, t in draft:
    t = norm(t)
    spans = []
    parts = t.split('"')
    for i in range(1, len(parts), 2): spans.append(parts[i])
    spans += re.findall(r"\('([^']{6,}?)'\)", t)
    spans += re.findall(r"(?<![A-Za-z0-9])'([^']{12,}?)'(?![A-Za-z])", t)
    for q in spans:
        q = q.strip()
        if len(q) < 8 and not re.search(r"[가-힣]", q): continue
        if len(q.split()) < 3 and not re.search(r"[가-힣]", q): continue
        if q in bign or q in t.replace(q, "", 1) and False: ok += 1
        else:
            # allow trailing punctuation drift
            if q.rstrip(".,!?;:") in bign: ok += 1; continue
            miss += 1; print(f"  ✗ [{src}] {q}")
print(f"{ok} verbatim, {miss} not found")
