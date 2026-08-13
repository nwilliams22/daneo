#!/usr/bin/env python3
"""Merge a verified Daneo draft bundle into the content files.
Usage: merge-draft.py m41 "The Body, Up Close" 49
Appends words/sentences/gaps in house formats, writes module md,
registers in modules.json. (index.ts is edited separately.)"""
import json, sys, os, re

MID, TITLE, ORDER = sys.argv[1], sys.argv[2], int(sys.argv[3])
NN = MID[1:]
SCRATCH = os.path.dirname(os.path.abspath(__file__))
REPO = "/mnt/t7/Projects/daneo"

dw = json.load(open(f"{SCRATCH}/draft-{MID}.words.json"))
ds = json.load(open(f"{SCRATCH}/draft-{MID}.sentences.json"))
dg = json.load(open(f"{SCRATCH}/draft-{MID}.gap.json"))
dmd = open(f"{SCRATCH}/draft-{MID}.md").read()

def jstr(s):
    return json.dumps(s, ensure_ascii=False)

# ---- words.json: one-line entries "  { "id": ..., ... }" ----
def word_line(w):
    parts = ", ".join(f'"{k}": {jstr(w[k])}' for k in ["id","ko","rom","en","pos","moduleId","notes"])
    return "  { " + parts + " }"

path = f"{REPO}/src/content/words.json"
text = open(path).read()
assert text.rstrip().endswith("]")
body = text.rstrip()[:-1].rstrip()  # drop final ]
new = body + ",\n" + ",\n".join(word_line(w) for w in dw) + "\n]\n"
open(path, "w").write(new)

# ---- sentences.json: pretty entries ----
def chunk_line(c):
    return '      { ' + f'"t": {jstr(c["t"])}, "role": {jstr(c["role"])}, "id": {jstr(c["id"])}' + ' }'

def sent_block(s):
    L = ["  {", f'    "id": {jstr(s["id"])},']
    for layer in ["en","gloss","ko"]:
        L.append(f'    "{layer}": [')
        L.append(",\n".join(chunk_line(c) for c in s[layer]))
        L.append("    ],")
    L.append(f'    "rom": {jstr(s["rom"])},')
    L.append(f'    "wordIds": [' + ", ".join(jstr(w) for w in s["wordIds"]) + "],")
    L.append(f'    "note": {jstr(s["note"])}')
    L.append("  }")
    return "\n".join(L)

path = f"{REPO}/src/content/sentences.json"
text = open(path).read()
body = text.rstrip()[:-1].rstrip()
new = body + ",\n" + ",\n".join(sent_block(s) for s in ds) + "\n]\n"
open(path, "w").write(new)

# ---- gap.json: pretty entries ----
def gap_block(g):
    L = ["  {"]
    keys = ["id","cat","ko","rom","lit","real","note"]
    for i, k in enumerate(keys):
        comma = "," if i < len(keys)-1 else ""
        L.append(f'    "{k}": {jstr(g[k])}{comma}')
    L.append("  }")
    return "\n".join(L)

if dg:
    path = f"{REPO}/src/content/gap.json"
    text = open(path).read()
    body = text.rstrip()[:-1].rstrip()
    new = body + ",\n" + ",\n".join(gap_block(g) for g in dg) + "\n]\n"
    open(path, "w").write(new)

# ---- module md ----
open(f"{REPO}/src/content/modules/module-{NN}.md", "w").write(dmd)

# ---- modules.json ----
def id_array(ids):
    lines, row = [], []
    for i in ids:
        row.append(f'"{i}"')
        if len(row) == 4:
            lines.append("      " + ", ".join(row)); row = []
    if row: lines.append("      " + ", ".join(row))
    return ",\n".join(lines)

entry = f'''  {{
    "id": "{MID}",
    "title": {jstr(TITLE)},
    "order": {ORDER},
    "ring": 2,
    "contentMd": "modules/module-{NN}.md",
    "wordIds": [
{id_array([w["id"] for w in dw])}
    ],
    "sentenceIds": [
{id_array([s["id"] for s in ds])}
    ]
  }}'''
path = f"{REPO}/src/content/modules.json"
text = open(path).read()
body = text.rstrip()[:-1].rstrip()
new = body + ",\n" + entry + "\n]\n"
open(path, "w").write(new)

print(f"merged {MID}: {len(dw)} words, {len(ds)} sentences, {len(dg)} gaps, md, modules.json entry (order {ORDER})")
