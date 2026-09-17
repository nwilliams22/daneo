#!/usr/bin/env python3
"""show.py DIR mNN words|sents|gap|md|meta|all — compact draft viewer."""
import sys, json, os
D, MID, what = sys.argv[1], sys.argv[2], (sys.argv[3] if len(sys.argv) > 3 else "all")
def words():
    for i, w in enumerate(json.load(open(f"{D}/draft-{MID}.words.json")), 1):
        print(f"{i:2}. {w['ko']} [{w['rom']}] ({w['pos']}) {w['id']} — {w['en']}\n    {w['notes']}\n")
def sents():
    for s in json.load(open(f"{D}/draft-{MID}.sentences.json")):
        ko = " ".join(c["t"] for c in s["ko"]); en = " ".join(c["t"] for c in s["en"])
        print(f"## {s['id']}\n  KO: {ko}\n  EN: {en}\n  ROM: {s['rom']}")
        print("  GL: " + " | ".join(f"{c['t']}({c['role']})" for c in s["gloss"]))
        print("  ROLES ko: " + " | ".join(f"{c['t']}:{c['role']}" for c in s["ko"]))
        print(f"  IDS: {s['wordIds']}\n  NOTE: {s['note']}\n")
def gap():
    for g in json.load(open(f"{D}/draft-{MID}.gap.json")):
        print(f"## {g['id']} ({g['cat']}) {g['ko']} [{g['rom']}]\n  lit: {g['lit']}\n  real: {g['real']}\n  note: {g['note']}\n")
def md(): print(open(f"{D}/draft-{MID}.md").read())
def meta(): print(json.dumps(json.load(open(f"{D}/draft-{MID}.meta.json")), ensure_ascii=False, indent=1))
{"words": words, "sents": sents, "gap": gap, "md": md, "meta": meta, "all": lambda: (words(), sents(), gap(), md(), meta())}[what]()
