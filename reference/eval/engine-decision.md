# Phase D engine decision — every rung measured, nothing qualifies

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
| 6 | Same prompted base, first run against the sealed set | v2 | **2/10** | 1 meaning reversal, 3 invented | BAD-238 |
| 7 | 250-row QLoRA on Qwen3.5-4B, Q8_0 merged export | v2 | **3/10** | 0 reversals, 1 invented | BAD-238 |

Rungs 6 and 7 were added on 2026-10-05 and are the only scores taken on an
unburned set; see [*Option A measured and declined*](#option-a-measured-and-declined--2026-10-05)
below. Rungs 4 and 5 are the settled scores, after the independent re-score on
BAD-233 corrected base `DAN-V0-KE-04` from a meaning failure to a pass. The
three rungs did not all use the same ten items, so the 0 → 4 progression is
indicative and not a controlled series; the controlled comparison is rungs 4
and 5, which ran sequentially on one host through one worker with one prompt.

**Two caveats, stated because they are load-bearing.** First, the ten v0 items
have now gated four runs, and the rubric itself says the burned v0 items stay
out of later gates; reusing them flattered both engines rather than penalising
them, so the decline is safe, but a passing count would not have been. Second,
[`v2-translation-set.json`](v2-translation-set.json) — the set reserved for the
fine-tune — was unburned when this was written, and was the gate the next rung
had to use. It was opened once on 2026-10-05 for rungs 6 and 7 and is now spent;
a further rung needs a newly reserved set.

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
saved discoveries. Phase B is desktop installers and does not depend on the model:
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

## Nick's decision — 2026-10-05: E now, in parallel with A

Asked on BAD-231 with every number above in front of him, Nick chose **"Ship
Daneo now with the AI off. Train the model again at the same time."** That is
option **E in parallel with A**, which is the recommendation this document
made. He did not choose to hold the release, to narrow the claim, to try
another family, or to try a larger parameter class — those stay available and
unspent if A declines.

What the decision fixes:

- **The release does not wait for the engine.** Phase B is the live shipping
  path. The AI translator and the Ask Daneo tutor are **off in the shipped
  build**, and that has to be true in code, not in a release note. A null
  `reference/model-pin.json` already makes the downloader refuse by design.
- **Training continues on the one lever that is barely pulled.** 27 reviewed
  rows and 17.6 s of GPU time produced the current fine-tune. The next rung
  scales the dataset toward the two worst dimensions — literal gap at 1/15 and
  polite register at 5–6/15 — from a corpus that holds 1,439 glossed sentences
  with notes and 420 gap items, of which only 5 gap rows and 22 sentence rows
  have ever been trained on.
- **v2 stays sealed until the one scoring run.** `v2-translation-set.json` is
  the only unburned gate left. Iteration happens against a separate development
  split; the v2 set is run once, on the finished artifact. The v0 items are
  burned and are not a gate again.
- **Nothing here reopens a paid engine.** The constraint in
  §*Owner constraint* of `PLAN-local-model.md` is unchanged.

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

## Documentation closeout and activation boundary — 2026-10-05

The implementation inventory and reactivation gates are in
[desktop-closeout.md](../desktop-closeout.md). Production frontend gates now
exclude the translator, tutor and model panel; native commands remain compiled.
No packaged offline/no-paid-model proof is claimed here: BAD-204 owns it within
BAD-234 → BAD-204 → BAD-205. BAD-240 owns the future engine verdict and offline
translator/tutor evidence. The first training/export pipeline completed, but
its candidate declined; scaled data review continues separately.

Retain `server/` and the Cloud adapter as a DEV-gated result-contract comparison
tool, off by default and never a fallback, with `claude-sonnet-4-6` unchanged.
Deleting it is Nick's decision. No Phase D code is removed by the closeout.

## Option A measured and declined — 2026-10-05

Option A was the recommendation of this document and the half of Nick's decision
that ran in parallel with the release. It is now measured and it declines. The
pin stays null; nothing in this section changes the bar.

**What was built.** 250 independently reviewed training rows — 100 literal gap,
60 polite register, 45 gloss, 45 semantic — weighted at the two worst
dimensions exactly as option A specified, plus 40 separately frozen development
rows. Mechanical exclusion confirmed zero intersection with all 96 reserved rows
(the ten v2 items among them), zero v1 overlap and zero train/development
overlap. Two bounded QLoRA runs; LR 0.0001 / 2 epochs selected on development
loss 0.2103, merged, exported Q8_0, hash-verified and loaded in the unchanged
shipping worker. That is **9.3× the v1 training data** on the same proven
pipeline (BAD-236 → BAD-237).

**What it scored.** Both engines took the sealed
[`v2-translation-set.json`](v2-translation-set.json) once, sequentially, on one
host through the unchanged native CPU worker, with the harness committed
(`8d413ac`) before either run. First-pass counts in
[`v2-results.md`](v2-results.md); independent re-score in
[`v2-independent-review.md`](v2-independent-review.md) (BAD-238 ran the gate,
BAD-239 re-scored it), which agreed on **every per-item dimension and flag**
with no disagreements.

| Measure | Prompted base | 250-row Q8_0 fine-tune |
| --- | ---: | ---: |
| **Fully correct (bar is ≥9/10)** | **2/10** | **3/10** |
| Meaning | 8/10 | 10/10 |
| Korean-order gloss | 4/10 | 9/10 |
| Particle roles | 8/10 | 10/10 |
| Polite register | 8/10 | 10/10 |
| Romanization | 9/10 | 10/10 |
| **Literal gap** | **3/10** | **3/10** |
| Meaning reversals | 1 | 0 |
| Invented-rule flags | 3 | 1 |

**Why it declines, precisely.** Training moved five of six dimensions to 9 or 10
and removed the reversal. It did not move the one dimension option A was aimed
at. The fine-tune emits an **empty literal-gap field on all ten items**: its
three passes are the three sentences that need no explanation, so it passes
**0/7** items that do require one, against the base's 1/7. On the separate
sixty fresh items the same picture holds unchanged — literal gap **1/15 for
both** engines, and polite register **6/15 base to 5/15 fine-tune**, down one.
The conjunctive rubric means one dead dimension caps the score at 3/10 no matter
how good the other five are.

**What this is evidence about.** Scaling reviewed data 9.3× on the measured-worst
dimension produced **+1 fully-correct item** and no generalized gain on the
target dimension. That is information about the approach, not about a run: a 4B
model at this quantization is not learning to reason about a literal/idiomatic
gap from supervised examples of it. v2 is now spent and there is no unburned gate
left; a further rung needs a newly reserved set authored first.

**Five candidate scores, nothing above 4/10 against ≥9/10.** Spent: prompting,
a repaired prompt, code-extracted fields, a 27-row fine-tune, and a 250-row
fine-tune. Unspent and unchanged: **B** (larger parameter class, paid for by the
learner's download and memory), **C** (different family, licence question
answered *first*), **D** (narrow the claim to what measures at 100%), and
stopping the engine programme with the app as it shipped. **F stays
measured-closed**, and a paid or cloud engine was never on this list.

Routed to Nick on BAD-240 as a card carrying these numbers. No further training,
alternate family selection, rubric change or repeat v2 run is authorized by this
section.
