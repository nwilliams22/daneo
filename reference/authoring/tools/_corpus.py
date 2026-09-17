"""Shared corpus loader for the authoring tools."""
import json, os, glob, re
REPO = "/mnt/t7/Projects/daneo"
C = f"{REPO}/src/content"
def load():
    words = json.load(open(f"{C}/words.json"))
    sents = json.load(open(f"{C}/sentences.json"))
    gaps = json.load(open(f"{C}/gap.json"))
    mods = json.load(open(f"{C}/modules.json"))
    mds = {}
    for p in glob.glob(f"{C}/modules/module-*.md"):
        mds[os.path.basename(p)] = open(p).read()
    return words, sents, gaps, mods, mds
def taught_as():
    rows = {}
    for line in open(f"{REPO}/reference/nikl-taught-as.tsv").read().rstrip().split("\n")[1:]:
        p = line.split("\t")
        if len(p) >= 3: rows[p[0]] = (p[1], p[2])
    return rows
def slices():
    rows = {}
    for line in open(f"{REPO}/reference/ring2-slices.tsv").read().rstrip().split("\n")[1:]:
        p = line.split("\t")
        if len(p) >= 2: rows[p[0]] = p[1]
    return rows
def corpus_text(words, sents, gaps, mds):
    """(source, text) pairs for every prose field."""
    out = []
    for w in words: out.append((f"{w['moduleId']} {w['id']}", w.get("notes","")))
    for s in sents: out.append((s["id"], s["note"]))
    for g in gaps: out.append((g["id"], g["note"]))
    for g in gaps: out.append((g["id"]+".real", g["real"]))
    for k, t in mds.items(): out.append((k, t))
    return out
