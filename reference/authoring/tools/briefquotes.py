#!/usr/bin/env python3
"""Check every hangul-bearing "quoted span" (>=12 chars) in a brief.

A span must appear verbatim in shipped content, AND it must come from
prose a drafter can actually cite: a word note, a sentence note, a gap
card or a module md. A span that matches only the one-line `en` gloss of
a word is reported separately — those read like citations but are not
note text, and a drafter quoting one ships a fake reference.

Usage: briefquotes.py brief-mNN.md [brief-mNN.md ...]
"""
import json, re, glob, sys, os

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))

def norm(t):
    return re.sub(r"\s+", " ", t.replace("**", "")).strip()

prose, glosses = [], []
for w in json.load(open(f"{REPO}/src/content/words.json")):
    prose.append(w.get("notes", ""))
    glosses.append(w.get("en", ""))
for s in json.load(open(f"{REPO}/src/content/sentences.json")):
    prose.append(s.get("note", ""))
for g in json.load(open(f"{REPO}/src/content/gap.json")):
    prose += [g.get("note", ""), g.get("real", ""), g.get("lit", "")]
for f in glob.glob(f"{REPO}/src/content/modules/*.md"):
    prose.append(open(f).read())

PROSE = norm(" ||| ".join(prose))
GLOSS = norm(" ||| ".join(glosses))

bad = 0
for path in sys.argv[1:]:
    text = open(path).read()
    n = miss = gloss_only = 0
    for q in re.findall(r'"([^"]+)"', text):
        if not re.search(r"[가-힣]", q) or len(q) < 12:
            continue
        n += 1
        nq = norm(q)
        if nq in PROSE:
            continue
        if nq in GLOSS:
            gloss_only += 1
            print(f"GLOSS-ONLY [{os.path.basename(path)}]: {q[:130]}")
            print("    matches a word's one-line gloss, not any note — a drafter cannot cite this")
        else:
            miss += 1
            print(f"MISS [{os.path.basename(path)}]: {q[:130]}")
    print(f"{os.path.basename(path)}: {n} quotes checked, {miss} missing, {gloss_only} gloss-only")
    bad += miss + gloss_only
sys.exit(1 if bad else 0)
