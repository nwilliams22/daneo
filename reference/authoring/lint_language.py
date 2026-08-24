#!/usr/bin/env python3
"""Language-layer linter for Daneo content: romanization + gloss style.

Checks that every `rom` field (words, sentences, gaps) matches Revised
Romanization of the `ko` field, following the shipped corpus's house rules:
  - sound-change assimilation ON (jeongni, kkeunnada, myeongnyeong)
  - tensification NOT written (neomda, anseumnida)
  - coda ㄱ/ㅂ + ㅎ merge to k/p (chukahada, teuki, makyeoyo)
  - coda ㄷ-class + ㅎ keeps t+h (jalmothaesseoyo, dathida)
  - coda ㅎ + ㄱ/ㄷ/ㅈ merges to aspirate (jota, manta)
  - copula chunks liaise across the chunk space (myeot sal + ieyo -> myeot sarieyo)
Lexical oddities the algorithm can't know (ㄴ-insertion compounds, dialect
eye-spellings, deliberate house calls) live in rom-exceptions.json:
  {"<ko token>": ["accepted rom", ...]}

Also lints gloss chunks: polite 요 glossed "-yes" is a FAIL; case-tag vs
particle mismatches ([subj]/[topic]/[obj]) are WARNs.

Usage:
  lint_language.py --draft m64     # lint a draft bundle in this directory
  lint_language.py --module m64    # lint one module's merged content
  lint_language.py --shipped       # lint all of src/content
  lint_language.py --shipped --exclude m64
Exit code 1 if any FAIL.
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))

L = ["g","kk","n","d","tt","r","m","b","pp","s","ss","","j","jj","ch","k","t","p","h"]
V = ["a","ae","ya","yae","eo","e","yeo","ye","o","wa","wae","oe","yo","u","wo","we","wi","yu","eu","ui","i"]
# jongseong index -> simple-jamo list (L indices)
T_DECOMP = [None,[0],[1],[0,9],[2],[2,12],[2,18],[3],[5],[5,0],[5,6],[5,7],[5,9],[5,16],[5,17],[5,18],[6],[7],[7,9],[9],[10],[11],[12],[14],[15],[16],[17],[18]]
CODA_LETTER = {0:"k",2:"n",3:"t",5:"l",6:"m",7:"p",11:"ng"}
# neutralize one simple jamo in coda position
NEUT = {0:0,1:0,15:0, 3:3,9:3,10:3,12:3,14:3,16:3,18:3, 7:7,17:7, 2:2,5:5,6:6,11:11}
# reduce a two-jamo coda to its pronounced representative
PAIR_REDUCE = {(0,9):0,(2,12):2,(2,18):2,(5,0):0,(5,6):6,(5,7):5,(5,9):5,(5,16):5,(5,17):7,(5,18):5,(7,9):7}
ASPIRATE = {0:15, 3:16, 7:17, 12:14}   # ㄱ->ㅋ ㄷ->ㅌ ㅂ->ㅍ ㅈ->ㅊ

def _reduce(coda, next_onset=None):
    if len(coda) == 2:
        return PAIR_REDUCE.get(tuple(coda), NEUT[coda[0]])
    return NEUT[coda[0]]

def _decompose(word):
    out = []
    for ch in word:
        code = ord(ch) - 0xAC00
        if 0 <= code < 11172:
            out.append([code // 588, (code % 588) // 28, list(T_DECOMP[code % 28] or [])])
        else:
            out.append(ch)  # passthrough (latin, digits, punctuation)
    return out

def romanize(word):
    """House-style Revised Romanization of one hangul token (no spaces)."""
    syls = _decompose(word)
    n = len(syls)
    for i in range(n):
        if not isinstance(syls[i], list):
            continue
        cur = syls[i]
        nxt = syls[i + 1] if i + 1 < n and isinstance(syls[i + 1], list) else None
        coda = cur[2]
        on = nxt[0] if nxt else None
        # -- codas ending in ㅎ (ㅎ/ㄶ/ㅀ) --
        if coda and coda[-1] == 18:
            if nxt is None or on is None:
                coda[:] = [3]
            elif on in (0, 3, 12):        # ㄱㄷㅈ -> merge to aspirate
                nxt[0] = ASPIRATE[on]; coda.pop()
            elif on in (9, 14):           # ㅅ/ㅊ: drop ㅎ (anseumnida, nochida)
                coda.pop()
            elif on == 2:                 # 놓는->논는 / 많네->만네
                coda.pop()
                if not coda: coda.append(2)
            elif on == 11:                # vowel: ㅎ drops, rest liaisons
                coda.pop()
                if coda: nxt[0] = coda.pop()
            else:
                coda[-1] = 3
            continue
        if not coda or nxt is None:
            if coda: coda[:] = [_reduce(coda)]
            continue
        # -- liaison before vowel --
        if on == 11:
            if coda[-1] == 11:
                coda[:] = [11]            # ㅇ coda stays ng
            else:
                moved = coda.pop()
                if moved == 3 and nxt[1] == 20:  moved = 12   # 굳이 -> 구지
                elif moved == 16 and nxt[1] == 20: moved = 14 # 같이 -> 가치
                nxt[0] = moved
                if coda: coda[:] = [NEUT[coda[0]]]
            continue
        # -- coda + onset ㅎ: keep both (saenggakhada, iphak, mothae) --
        if on == 18:
            if len(coda) == 2 and coda[1] in ASPIRATE:
                nxt[0] = ASPIRATE[coda[1]]; coda[:] = [NEUT[coda[0]]]  # 밝히다->balkida
            else:
                coda[:] = [_reduce(coda)]
            continue
        # -- onset ㄹ assimilation --
        if on == 5:
            last = _reduce(coda)
            if last in (0, 3, 7, 6, 11):  # ㄱㄷㅂㅁㅇ + ㄹ -> onset ㄴ
                nxt[0] = 2; on = 2        # falls through to nasalization
            elif last == 2:               # ㄴ+ㄹ -> ㄹㄹ (silla)
                coda[:] = [5]; continue
        # -- coda ㄹ + onset ㄴ -> ㄹㄹ (seollal) --
        if on == 2 and _reduce(coda) == 5:
            coda[:] = [5]; nxt[0] = 5; continue
        # -- nasalization before ㄴ/ㅁ --
        if on in (2, 6):
            last = _reduce(coda)
            coda[:] = [{0: 11, 3: 2, 7: 6}.get(last, last)]
            continue
        # -- plain neutralization before other consonants --
        coda[:] = [_reduce(coda, on)]
    # assemble
    out = []
    for i, s in enumerate(syls):
        if not isinstance(s, list):
            out.append(s); continue
        onset = L[s[0]]
        prev = syls[i - 1] if i > 0 and isinstance(syls[i - 1], list) else None
        if s[0] == 5 and prev and prev[2] and prev[2][-1] == 5:
            onset = "l"                   # coda l + onset r -> ll
        out.append(onset + V[s[1]] + (CODA_LETTER[s[2][0]] if s[2] else ""))
    return "".join(out)

_PUNCT = re.compile(r"[.,!?;:'\"…“”‘’()\[\]~·\-]")
def _norm(tok):
    return _PUNCT.sub("", tok).lower()

def _load_exceptions():
    path = os.path.join(HERE, "rom-exceptions.json")
    return json.load(open(path)) if os.path.exists(path) else {}

def check_rom_pair(ko, rom, label, fails, exceptions):
    ko_toks = [t for t in ko.split() if _norm(t)]
    rom_toks = [t for t in rom.split() if _norm(t)]
    mismatch = None
    if len(ko_toks) == len(rom_toks):
        for kt, rt in zip(ko_toks, rom_toks):
            bare = _PUNCT.sub("", kt)
            if not re.fullmatch(r"[가-힣]+", bare):
                continue  # mixed/latin/alternates — skip token
            expect = romanize(bare)
            got = _norm(rt)
            if got == expect or got in [_norm(x) for x in exceptions.get(bare, [])]:
                continue
            mismatch = f"{label}: {bare} romanized \"{_norm(rt)}\" — expect \"{expect}\""
            break
        if mismatch is None:
            return
    # fallback: whole-string compare with cross-space liaison (copula chunks)
    bare_all = _PUNCT.sub("", "".join(ko.split()))
    if re.fullmatch(r"[가-힣]+", bare_all):
        got_all = _norm("".join(rom.split()))
        joined = "".join(romanize(_PUNCT.sub("", t)) if re.fullmatch(r"[가-힣]+", _PUNCT.sub("", t)) else _norm(t) for t in ko.split())
        if got_all in (romanize(bare_all), joined):
            return
    if mismatch:
        fails.append(mismatch)
    else:
        exp = " ".join(romanize(_PUNCT.sub("", t)) if re.fullmatch(r"[가-힣]+", _PUNCT.sub("", t)) else t for t in ko.split())
        fails.append(f"{label}: rom \"{rom}\" doesn't align with ko \"{ko}\" — expect ~\"{exp}\"")

CASE_TAGS = {"[subj]": ("이", "가"), "[topic]": ("은", "는"), "[obj]": ("을", "를")}
CONTRACTIONS = {"게": "[subj]", "건": "[topic]", "걸": "[obj]", "내": "[poss]", "제": "[poss]"}

def check_gloss(sent, fails, warns):
    for g_chunk, k_chunk in zip(sent.get("gloss", []), sent.get("ko", [])):
        g_toks = g_chunk["t"].split()
        k_toks = [_PUNCT.sub("", t) for t in k_chunk["t"].split()]
        for gt in g_toks:
            if gt.lower().endswith("-yes"):
                fails.append(f"{sent['id']}: gloss token \"{gt}\" — polite 요 must not be glossed \"-yes\" (shipped style ends in the verb sense itself: \"am-sorry\", \"become\")")
        if len(g_toks) != len(k_toks):
            continue  # alignment differs; skip tag check
        for gt, kt in zip(g_toks, k_toks):
            if kt in CONTRACTIONS:
                continue
            for tag, finals in CASE_TAGS.items():
                if tag in gt and not kt.endswith(finals):
                    warns.append(f"{sent['id']}: gloss \"{gt}\" tags {tag} but ko \"{kt}\" lacks that particle")
                    break
            else:
                if kt.endswith(("이", "가")) and "[topic]" in gt:
                    warns.append(f"{sent['id']}: ko \"{kt}\" ends 이/가 but glossed [topic] — should be [subj]?")
                elif kt.endswith(("은", "는")) and "[subj]" in gt:
                    warns.append(f"{sent['id']}: ko \"{kt}\" ends 은/는 but glossed [subj] — should be [topic]?")

_BAD_CONJ = re.compile(r"[가-힣]*(?:[르리]요|리어요|키어요|주어요|뜨리어요)[.!?,]?$")

def check_conjugation(sent, warns):
    # stem+요 without -어 (찌르요, 두드리요) and uncontracted polite forms
    # (가리키어요, 돌려주어요) are rom-consistent, so the rom check can't see them
    for chunk in sent.get("ko", []):
        for tok in chunk["t"].split():
            if _BAD_CONJ.fullmatch(tok):
                warns.append(f"{sent['id']}: ko \"{tok}\" looks unconjugated/uncontracted (expect e.g. 찔러요, 가리켜요, 돌려줘요)")

def lint_content(words, sentences, gaps, fails, warns):
    exceptions = _load_exceptions()
    for w in words:
        check_rom_pair(w["ko"], w["rom"], f"word {w['id']}", fails, exceptions)
    for s in sentences:
        ko_join = " ".join(c["t"] for c in s["ko"])
        check_rom_pair(ko_join, s["rom"], f"sent {s['id']}", fails, exceptions)
        check_gloss(s, fails, warns)
        check_conjugation(s, warns)
    for g in gaps:
        check_rom_pair(g["ko"], g["rom"], f"gap {g['id']}", fails, exceptions)

def main():
    args = sys.argv[1:]
    fails, warns = [], []
    if "--draft" in args:
        mid = args[args.index("--draft") + 1]
        words = json.load(open(f"{HERE}/draft-{mid}.words.json"))
        sentences = json.load(open(f"{HERE}/draft-{mid}.sentences.json"))
        gaps = json.load(open(f"{HERE}/draft-{mid}.gap.json"))
    else:
        words = json.load(open(f"{REPO}/src/content/words.json"))
        sentences = json.load(open(f"{REPO}/src/content/sentences.json"))
        gaps = json.load(open(f"{REPO}/src/content/gap.json"))
        if "--module" in args:
            mid = args[args.index("--module") + 1]
            words = [w for w in words if w["moduleId"] == mid]
            sentences = [s for s in sentences if s["id"].startswith(f"s_{mid}_")]
            gaps = [g for g in gaps if g["id"].startswith(f"g_{mid}_")]
        elif "--exclude" in args:
            mid = args[args.index("--exclude") + 1]
            words = [w for w in words if w["moduleId"] != mid]
            sentences = [s for s in sentences if not s["id"].startswith(f"s_{mid}_")]
            gaps = [g for g in gaps if not g["id"].startswith(f"g_{mid}_")]
    lint_content(words, sentences, gaps, fails, warns)
    print(f"=== lint_language: {len(words)} words, {len(sentences)} sentences, {len(gaps)} gaps ===")
    print(f"\n{len(fails)} FAIL:")
    for f in fails: print("  ✗", f)
    print(f"\n{len(warns)} WARN:")
    for w in warns: print("  ?", w)
    sys.exit(1 if fails else 0)

if __name__ == "__main__":
    main()
