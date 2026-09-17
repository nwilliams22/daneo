#!/usr/bin/env python3
"""iou.py [-w N] string [string…] — find every prose mention (word notes, sentence
notes, gap notes/real, module md) with a snippet of N chars around it (default 90)."""
import sys, re; sys.path.insert(0, __import__("os").path.dirname(__file__))
from _corpus import *
words, sents, gaps, mods, mds = load()
args = sys.argv[1:]; W = 90
if "-w" in args: i = args.index("-w"); W = int(args[i+1]); del args[i:i+2]
corpus = corpus_text(words, sents, gaps, mds)
for q in args:
    print(f"### {q}")
    n = 0
    for src, t in corpus:
        for m in re.finditer(re.escape(q), t):
            a, b = max(0, m.start()-W), min(len(t), m.end()+W)
            print(f"  [{src}] …{t[a:b].replace(chr(10),' ')}…"); n += 1
    if not n: print("  (no mentions)")
