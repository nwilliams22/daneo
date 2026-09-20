#!/usr/bin/env python3
"""Whitespace-normalized check that every hangul-bearing "quoted span" (>=12 chars)
in a brief exists verbatim somewhere in shipped content. Usage: briefquotes.py brief-mNN.md"""
import json, re, glob, sys, os
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
def norm(t): return re.sub(r"\s+", " ", t.replace("**", "")).strip()
corpus = []
for w in json.load(open(f"{REPO}/src/content/words.json")): corpus.append(w.get("notes", "") + " " + w.get("en", ""))
for s in json.load(open(f"{REPO}/src/content/sentences.json")): corpus.append(s.get("note", ""))
for g in json.load(open(f"{REPO}/src/content/gap.json")): corpus += [g.get("note", ""), g.get("real", ""), g.get("lit", "")]
for f in glob.glob(f"{REPO}/src/content/modules/*.md"): corpus.append(open(f).read())
big = norm(" ||| ".join(corpus))
for path in sys.argv[1:]:
    s = open(path).read(); n = miss = 0
    for q in re.findall(r'"([^"]+)"', s):
        if not re.search(r"[가-힣]", q) or len(q) < 12: continue
        n += 1
        if norm(q) not in big: miss += 1; print(f"MISS [{os.path.basename(path)}]: {q[:130]}")
    print(f"{os.path.basename(path)}: {n} quotes checked, {miss} missing")
