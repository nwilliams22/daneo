#!/usr/bin/env python3
"""Mechanical verifier for a Daneo module draft bundle. Usage: verify-draft.py m41"""
import json, re, sys, os

MID = sys.argv[1]
SCRATCH = os.path.dirname(os.path.abspath(__file__))
REPO = "/mnt/t7/Projects/daneo"

words = json.load(open(f"{REPO}/src/content/words.json"))
sentences = json.load(open(f"{REPO}/src/content/sentences.json"))
gaps = json.load(open(f"{REPO}/src/content/gap.json"))
dw = json.load(open(f"{SCRATCH}/draft-{MID}.words.json"))
ds = json.load(open(f"{SCRATCH}/draft-{MID}.sentences.json"))
dg = json.load(open(f"{SCRATCH}/draft-{MID}.gap.json"))
dmd = open(f"{SCRATCH}/draft-{MID}.md").read()

by_ko = {}
for w in words:
    by_ko.setdefault(w["ko"], []).append(w["moduleId"])
word_ids = {w["id"] for w in words}
sent_ids = {s["id"] for s in sentences}
gap_ids = {g["id"] for g in gaps}
sent_texts = {" ".join(c["t"] for c in s["ko"]) for s in sentences}

fails, manual = [], []

# --- draft word checks ---
draft_ids = set()
for w in dw:
    if w["id"] in word_ids: fails.append(f"word id collision: {w['id']}")
    if w["id"] in draft_ids: fails.append(f"word id dup in draft: {w['id']}")
    draft_ids.add(w["id"])
    if w["ko"] in by_ko: manual.append(f"draft ko already taught: {w['ko']} ({by_ko[w['ko']]}) as {w['id']}")
    if w["moduleId"] != MID: fails.append(f"{w['id']} wrong moduleId {w['moduleId']}")
    if w["pos"] not in ("noun","verb","adj","particle","phrase"): fails.append(f"{w['id']} bad pos {w['pos']}")

# --- sentence checks ---
all_word_ids = word_ids | draft_ids
for s in ds:
    if s["id"] in sent_ids: fails.append(f"sentence id collision: {s['id']}")
    ids_en = [c["id"] for c in s["en"]]; ids_gl = [c["id"] for c in s["gloss"]]; ids_ko = [c["id"] for c in s["ko"]]
    if not (set(ids_en) == set(ids_gl) == set(ids_ko)): fails.append(f"{s['id']} chunk-id mismatch")
    if len(ids_en) != len(set(ids_en)) or len(ids_ko) != len(set(ids_ko)): fails.append(f"{s['id']} dup chunk ids")
    for wid in s["wordIds"]:
        if wid not in all_word_ids: fails.append(f"{s['id']} unresolved wordId {wid}")
    joined = " ".join(c["t"] for c in s["ko"])
    if joined in sent_texts: fails.append(f"{s['id']} DUP sentence text: {joined}")

# --- gap checks ---
for g in dg:
    if g["id"] in gap_ids: fails.append(f"gap id collision: {g['id']}")
    if g["cat"] not in ("phrase","concept","structure"): fails.append(f"{g['id']} bad cat {g['cat']}")

# --- language-layer lint: romanization + gloss style ---
sys.path.insert(0, SCRATCH)
from lint_language import lint_content
lint_content(dw, ds, dg, fails, manual)

# --- cross-ref checks over all note text + md ---
corpus = []
for w in dw: corpus.append((w["id"], w["notes"]))
for s in ds: corpus.append((s["id"], s["note"]))
for g in dg: corpus.append((g["id"], g["note"]))
corpus.append(("md", dmd))

pat_poss = re.compile(r"M(\d+)(?:'s|’s)\s+([^\s,.;:()!?—]+)")
pat_paren = re.compile(r"([가-힣]+)\s*\(M(\d+)(?!\d)(?![’']s)")  # skip house-style "phrase (Mnn's word)"

def check_ref(src, mod, token):
    mid = f"m{mod}"
    tok = re.sub(r"-note[s]?$", "", token)
    kor = re.findall(r"[가-힣]+", tok)
    if not kor:
        # romanized-Korean citations dodge the hangul check — force a hand-verify
        manual.append(f"{src}: M{mod}'s {tok} — non-hangul citation, verify by hand (house style: cite in hangul)")
        return
    k = kor[-1]
    mods = by_ko.get(k) or by_ko.get(k + "다")
    if mods is None:
        # try draft
        if any(w["ko"] == k for w in dw): manual.append(f"{src}: M{mod}'s {k} — refers to draft word?")
        else: manual.append(f"{src}: M{mod}'s {k} — ko not found in words.json")
    elif mid not in mods:
        fails.append(f"{src}: claims M{mod}'s {k} but taught in {mods}")

for src, text in corpus:
    for m in pat_poss.finditer(text): check_ref(src, m.group(1), m.group(2))
    for m in pat_paren.finditer(text):
        k, mod = m.group(1), m.group(2)
        mods = by_ko.get(k)
        if mods is None:
            if any(w["ko"] == k for w in dw): manual.append(f"{src}: {k} (M{mod}) — refers to draft word?")
            else: manual.append(f"{src}: {k} (M{mod}) — ko not found in words.json")
        elif f"m{mod}" not in mods:
            manual.append(f"{src}: {k} (M{mod}) but taught in {mods} — maybe multiword phrase")

# --- garnish check: does a note freeze a word the learner already owns? ---
#
# The garnish-free rule is the course's promise that every word in a note is
# either owned or explicitly marked as riding frozen. Until now only one half
# of it was checked, that citations point at the right module. This is the
# other half: a note must not tell the learner a word is untaught when an
# earlier module taught it.
#
# Homographs are the reason this cannot simply fail. M66's 차다 is the kick
# and the 차다 meaning "to be full" is a different word with the same
# spelling, so a spelling with several dictionary rows is reported for a human
# to read rather than failed outright.
_nikl_rows = {}
try:
    for _line in open(f"{REPO}/reference/nikl-5965.tsv").readlines()[1:]:
        _p = _line.rstrip("\n").split("\t")
        if len(_p) >= 5 and _p[0].strip().isdigit():
            _k = re.sub(r"\d+$", "", _p[1])
            _nikl_rows[_k] = _nikl_rows.get(_k, 0) + 1
except OSError:
    pass

_order = {m["id"]: m.get("order", 9999) for m in json.load(open(f"{REPO}/src/content/modules.json"))}
_here_order = max(_order.values()) + 1 if _order else 9999
pat_frozen = re.compile(r"\(([가-힣]{2,6})\s*—[^)]{0,60}?(?:riding frozen|rides frozen)")

for src, text in corpus:
    for m in pat_frozen.finditer(text):
        k = m.group(1)
        if text[:m.start()].count('"') % 2 == 1:
            continue  # inside a verbatim quote of an earlier note
        mods = by_ko.get(k)
        if not mods:
            continue
        earlier = [x for x in mods if _order.get(x, 9999) < _here_order]
        if not earlier:
            continue
        where = "/".join(sorted(earlier))
        # A homograph cannot be judged mechanically: whether this is the sense
        # already taught is a question about meaning, not spelling. So it is
        # handed to a human with the question stated. M91's 사고 means 思考 and
        # is right to freeze it; M97's 건설하다 meant M38's road and was wrong,
        # and the only difference between them is what the note means.
        if len(mods) > 1 or _nikl_rows.get(k, 1) > 1:
            manual.append(f"{src}: freezes {k}; {where} taught that spelling. Is this the SAME sense? "
                          f"If so, cite it. If not, say in the note which sense you mean")
        else:
            fails.append(f"{src}: freezes {k}, but it is already taught in {where} — cite it instead")

print(f"=== {MID}: {len(dw)} words, {len(ds)} sentences, {len(dg)} gaps ===")
print(f"\n{len(fails)} FAIL:")
for f in fails: print("  ✗", f)
print(f"\n{len(manual)} MANUAL:")
for m in manual: print("  ?", m)
