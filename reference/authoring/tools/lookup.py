#!/usr/bin/env python3
"""lookup.py [--brief] [--sub] [--comp] 단어 [단어…]
Exact matches in words.json (module/id/en/notes), taught-as and slice rows.
--brief: one line per hit.  --sub: also words CONTAINING the string.
--comp: decompose — list every taught word that is a substring (compound parts)."""
import sys; sys.path.insert(0, __import__("os").path.dirname(__file__))
from _corpus import *
words, sents, gaps, mods, mds = load(); ta = taught_as(); sl = slices()
args = [a for a in sys.argv[1:] if not a.startswith("--")]
brief = "--brief" in sys.argv; sub = "--sub" in sys.argv; comp = "--comp" in sys.argv
by_ko = {}
for w in words: by_ko.setdefault(w["ko"], []).append(w)
for q in args:
    print(f"### {q}")
    hits = by_ko.get(q, [])
    if not hits: print("  (not taught)")
    for w in hits:
        if brief: print(f"  {w['moduleId']} {w['id']} — {w['en']}")
        else: print(f"  {w['moduleId']} {w['id']} — {w['en']}\n    {w.get('notes','')}")
    if q in ta: print(f"  taught-as: {ta[q][0]} — {ta[q][1]}")
    if q in sl: print(f"  slice: {sl[q]}")
    if sub:
        for w in words:
            if q in w["ko"] and w["ko"] != q: print(f"  ⊃ {w['ko']} {w['moduleId']} {w['id']} — {w['en']}")
    if comp:
        for ko, ws in by_ko.items():
            if ko != q and ko in q and len(ko) >= 1:
                for w in ws: print(f"  ⊂ {ko} {w['moduleId']} {w['id']} — {w['en']}")
        for ko in ta:
            if ko != q and ko in q: print(f"  ⊂ {ko} taught-as {ta[ko][0]} — {ta[ko][1]}")
