# Phase D engine decision — three rungs measured, nothing qualifies

Written 2026-10-05, after the head-to-head score in
[`head-to-head-results.md`](head-to-head-results.md) settled. This document does
not change the bar, does not select an artifact, and does not write a pin.
`reference/model-pin.json` stays null. It records what every candidate measured,
what each failure mode costs a learner, and which ways forward remain open —
so the scope decision is taken against numbers rather than impressions.

## The bar, unchanged

[`v0-rubric.md`](v0-rubric.md) governs selection and has not been edited:

- 10/10 schema-valid and complete replies, correct direction, no leaked thinking.
- **≥9/10 fully correct** across six conjunctive dimensions — meaning,
  Korean-order gloss, particle roles, polite register, romanization, literal gap.
- **Zero meaning reversals and zero invented grammatical or cultural rules.**

## Every candidate, in order

| Rung | What it was | Ten-item set | Fully correct | Hard-rule flags | Ticket |
| --- | --- | --- | ---: | --- | --- |
| 1 | Qwen3.5-4B Q4_K_M, original prompt | v0 | **0/10** | — | BAD-183 |
| 2 | Same model, repaired shared prompt (tuned on a separate dev set) | v0 | **1/10** | — | BAD-206 |
| 3 | Same model, romanization and particle identity computed in code | v1 | **2/10** | 1 invented rule | BAD-212 |
| 4 | Same model and code fields, re-measured in the head-to-head | v0 | **4/10** | 0 reversals, 0 invented | BAD-202 |
| 5 | 27-row QLoRA on Qwen3.5-4B, Q8_0 merged export | v0 | **4/10** | **1 meaning reversal** | BAD-202 |

Rungs 4 and 5 are the settled scores, after the independent re-score on
BAD-233 corrected base `DAN-V0-KE-04` from a meaning failure to a pass. The
three rungs did not all use the same ten items, so the 0 → 4 progression is
indicative and not a controlled series; the controlled comparison is rungs 4
and 5, which ran sequentially on one host through one worker with one prompt.

**Two caveats, stated because they are load-bearing.** First, the ten v0 items
have now gated four runs, and the rubric itself says the burned v0 items stay
out of later gates; reusing them flattered both engines rather than penalising
them, so the decline is safe, but a passing count would not have been. Second,
[`v2-translation-set.json`](v2-translation-set.json) — the set reserved for the
fine-tune — was never run. It is still unburned, verified clean of the training
rows, and is the gate any next rung should use.

## The sixty fresh items

These sixty English inputs derive unchanged from the frozen 96-item reservation
and had never been run before. They are the honest measure of both engines.
Each class holds fifteen items; a class pass is conjunctive with schema,
direction, no leak, and no reversal or invented rule.

| Review class | Prompted base | Q8_0 fine-tune |
| --- | ---: | ---: |
| Gloss — Korean word order | 9/15 (60%) | 11/15 (73%) |
| Semantic fidelity | 9/15 (60%) | 10/15 (67%) |
| Polite register | 6/15 (40%) | 5/15 (33%) |
| Literal gap | **1/15 (7%)** | **1/15 (7%)** |
| Final schema complete | 57/60 | 60/60 |
| Direction correct | 60/60 | 60/60 |
| Thinking leaks | 0 | 0 |

The base's three schema failures are `DAN-IND-03`, `DAN-IND-47` and `DAN-IND-51`.

## Runtime, measured on the shipping worker

Both artifacts ran through the unchanged `llama-cpp-2 0.1.158` CPU worker on one
host, same embedded prompt, greedy sampler.

| | Prompted base Q4_K_M | Fine-tune Q8_0 |
| --- | ---: | ---: |
| Download | 2,740,937,888 B (2.74 GB) | 4,610,579,744 B (4.61 GB) |
| Warm completion p95, 60 items | 24,083 ms | 20,509 ms |
| Cold load / ready | 1,546 ms | 2,238 ms |
| Cold first token | 6,424 ms | 7,141 ms |
| Peak process RSS | 3,004,100 KiB | 4,708,140 KiB |

The fine-tune is about 3.6 s faster at p95 and costs about 1.70 million KiB more
resident memory and 1.87 GB more download.

## What each failure mode costs a learner

1. **Literal gap, 1/15 on fresh items, both engines.** This is the field that
   tells a learner *why* Korean says it differently — 밥 is literally cooked rice
   but ordinarily means a meal, "sugar not-exists" means without sugar, the
   subject is simply dropped. Fourteen of fifteen fresh items get an empty or
   wrong explanation. A learner is left with no account of the language exactly
   where it is least guessable, and an empty field teaches that there was
   nothing to explain.
2. **Polite register, 5–6/15.** The Korean comes back outside the polite 해요
   register the whole 164-module corpus teaches. A learner who copies the output
   addresses a teacher or a stranger the way they would a close friend. In
   Korean that is the mistake that gets noticed.
3. **Gloss, 9–11/15.** The Korean-order reading is mis-chunked, or rearranged
   into ordinary English order and presented as Korean order. The tool whose job
   is to teach word order teaches the wrong one about a third of the time.
4. **Semantic fidelity, 9–10/15.** Actor, polarity, obligation or contrast
   drift. A learner memorises a sentence that does not mean what they were told.
5. **One meaning reversal, fine-tune only.** `친구가 커피를 좋아해요` — the friend
   likes coffee — came back as "I like coffee". A learner cannot detect this. It
   is the one error class the rubric refuses at any rate above zero, and it is
   the reason the fine-tune's relative gains do not make it the better ship.
6. **Latency, 20–24 s p95 warm.** Even a correct answer arrives twenty seconds
   after a learner asks, mid-drill.

**What does work, and why.** Schema completeness, direction, romanization and
particle identity all measure at or near 100%. Romanization and particle
identity are computed in `src/lib/translation-postprocess.ts` from the Korean
line (BAD-211); the model's particle text is kept only when it agrees with the
computed identity. Those two dimensions score 10/10 because they are code. The
model's own four dimensions are the four that fail.

## Relaxing the rubric does not rescue either engine

Recomputed from the settled per-item dimension verdicts in
`raw/head-to-head-*-v0-scored.json`, with the BAD-233 correction applied, by
[`relaxation-counterfactual.py`](relaxation-counterfactual.py). Each row drops
dimensions from the conjunction and recounts fully-correct items. `meaning` is
not in the table because nobody would relax it; `particles` and `romanization`
are not, because they are already computed in code.

| Dimensions dropped | Prompted base | Q8_0 fine-tune |
| --- | ---: | ---: |
| none — today | 4/10 | 4/10 |
| literal gap | 5/10 | 7/10 |
| polite register | 5/10 | 4/10 |
| gloss | 4/10 | 4/10 |
| literal gap + polite register | 6/10 | 7/10 |
| literal gap + gloss | 7/10 | 8/10 |
| polite register + gloss | 6/10 | 4/10 |
| literal gap + register + gloss | **9/10** | 8/10 |

Three findings follow.

- The fine-tune **cannot reach 9/10 by any combination** of the three
  dimensions above; its two meaning failures cap it at 8/10. Its actor reversal
  fails the zero-tolerance rule at every row of that table independently of the
  count.
- The base reaches 9/10 only by dropping gloss, polite register and literal gap
  — three of six. What remains is meaning, particles and romanization, and the
  last two are already code. So the base "passes" a three-dimension rubric by
  being trusted with nothing except the plain translation.
- Therefore relaxing the rubric is not a cheaper route to the same product. It
  is the narrower product claim with the bar moved to hide the narrowing. It is
  recorded here as measured-closed, not as an option.

## Ways forward that remain open

Every option below is free and runs on hardware the studio already owns. None
involves a paid or cloud engine.

**A — More training data, same proven pipeline.** The training lever is barely
pulled: 27 reviewed rows, three epochs, **17.6 s of GPU training**, 81
optimizer steps. The pipeline is proven end to end — dataset build, QLoRA on the
RTX 5090, merge, matched Q8_0 export, hash-verified load in the shipping worker
(BAD-201, BAD-228). The two worst dimensions, literal gap and polite register,
are exactly the "learnable response conventions" `reference/training/error-analysis.md`
identified, and the corpus holds 164 reviewed modules and roughly 1,500 glossed
sentences with notes to draw targets from. Scale to several hundred reviewed
rows weighted toward literal gap and register, retrain, and score against the
unburned v2 set. *Cost:* authoring and linguistic review time, which is the real
cost — all 27 current rows needed review. GPU time is minutes. *Risk:* a 4B
model may lack the headroom; another rung may decline.

**B — A larger parameter class on the 5090.** 32,607 MiB of VRAM fits a QLoRA of
a 14B-class model and the box can run a much larger GGUF for a second opinion.
Training stays free. The constraint is the learner's machine, not ours: a
14B Q4 is roughly 9 GB to download and needs about 10 GB of working memory, and
at the 4B's measured 24 s p95 on CPU a 14B on an ordinary laptop is far slower.
This option can clear the rubric and still be unshippable, and it breaks the
small-free-download commitment in `PLAN-local-model.md`.

**C — A different model family.** EXAONE (LG) is explicitly Korean-oriented and
the strongest quality bet at this size, but its cards carry a **non-commercial
licence** — fine if Daneo is never sold, a dead end if it might be. Gemma 4
E2B/E4B is multilingual, but "E2B" is 5.1 B real parameters including
embeddings, so its download exceeds the current 4B. *Cost:* one gate run per
family on the harness that now exists. This is the only option that moves the
quality ceiling without changing the product or the download much — conditional
on the licence answer.

**D — Narrow the product claim.** Ship what measures at 100%: direction
detection, schema, code-computed romanization and particle identity, and
lookup plus conjugation **inside the known corpus**. Stop claiming free-form
translation with explanation. The AI surface becomes "explain the sentence I am
learning", backed by the corpus notes the six content-review passes already
certified, with the model doing only the plain translation. *Cost:* a product
decision and a UI pass. No further model work.

**E — Ship Daneo with the AI features off.** 164 modules, the drills and Explore
on corpus data. Phase B is desktop installers and does not depend on the model:
the downloader already refuses an unset pin by design, which is the intended
behaviour and not a defect. *Cost:* none, and the release chain moves today.
The translator ships later or not at all.

**F — Relax the rubric.** Measured closed above. Listed so it is visibly closed.

## Recommendation

**E now, in parallel with A.** They do not conflict: the Phase B release chain
needs no model, and a null pin is the designed refusal rather than a blocker.
That puts 164 reviewed modules in front of a user without waiting on the engine,
and keeps the engine programme on the one lever that is free, proven and barely
pulled. Score the next rung against v2, never against v0 again. If A declines,
C with the licence question answered first.

## Evidence and source of truth

- `reference/model-pin.json` — null, unchanged.
- [`head-to-head-results.md`](head-to-head-results.md) and
  `raw/head-to-head-*` at commit `d390c74` — raw replies, assembled outputs,
  per-item verdicts, resource logs.
- `python3 reference/eval/check-head-to-head-provenance.py --report-commit d390c74`
  — exits 0 for all four runs and the 60-item derivation.
- [`v0-rubric.md`](v0-rubric.md) — the unchanged bar.
- BAD-233 — the independent re-score that settles base at 4/10.
- `reference/training/v1-results.md` — the 27-row dataset, config and timings.
- `python3 reference/eval/relaxation-counterfactual.py` — reproduces the
  relaxation table from the committed per-item verdicts. It invents no
  judgment, runs no inference, and writes nothing.
