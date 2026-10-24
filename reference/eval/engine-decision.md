# Phase D engine decision — every rung measured, nothing qualifies

> **⚠ Read §*Nick's decision — 2026-10-22: build the translator in code* at the
> end of this file before anything else here.** Two owner decisions landed on
> 2026-10-22, hours apart, and they say different things about different options:
>
> 1. **The model programme is stopped and stays stopped.** *"we can just forget
>    about the AI features. it would be nice to have but is apparently difficult
>    to get working."* No eighth candidate, no screen, no training run, no pin.
>    `reference/model-pin.json` stays `{"pin": null}`. A larger parameter class
>    and the held non-commercial families are **closed, not pending.**
> 2. **Option D — the deterministic in-code engine — is named and started.**
>    Asked what Daneo should do next, Nick chose *"Build the translator in code,
>    with no AI model."* That is the naming the stop section said reopening would
>    take, and it is the only option in this document that is live.
>
> So: **no model, and a translator anyway.** The document stays whole because it
> is the measured record of why that is the shape of the answer.

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
section; **his answer is the section below**, and it authorizes option C only.

## Nick's decision — 2026-10-05: option C, a different model family

Asked on BAD-240 to choose between a larger parameter class (**B**), a different
model family (**C**), narrowing the product claim (**D**) and stopping the engine
programme, with the five measured scores in front of him, Nick chose **"Try a
different model family."** That is option **C**.

What the decision fixes, and what it does not:

- **The incumbent architecture is no longer the subject.** Qwen3.5-4B has been
  prompted, prompt-repaired, code-assisted and fine-tuned twice. The next rung
  changes the model family, not the data volume. No further training on
  Qwen3.5-4B is authorized by this decision.
- **The licence precondition is satisfied, and it cost nothing.** Option C was
  written as a tradeoff — EXAONE is the strongest Korean-oriented bet but is
  non-commercially licensed, *"fine if Daneo is never sold, a dead end if it
  might be."* It is not a tradeoff: **Mi:dm 2.0 Mini** (KT, **MIT**, 2.3 B,
  `LlamaForCausalLM`) and **A.X 4.0 Light** (SKT, **Apache-2.0**, 7 B) are both
  Korean-specialised and both commercially usable. The shortlist needs no
  decision from Nick about selling Daneo, and taking it does not foreclose
  selling Daneo. EXAONE and Kanana are **held, not rejected**, and return only
  if the permissive two decline *and* Nick states the product will never be
  sold. Candidates, licences, architectures, download costs and sources:
  [`engine-family-survey.md`](engine-family-survey.md).
- **There is no gate left to score against.** All 96 reserved rows are burned —
  10 v0, 10 v1, 6 dev, 10 v2, 60 independent. A new reserved set is authored and
  frozen before any candidate is measured, and a separate development split
  carries the per-family prompt adaptation. A new family does not inherit the
  Qwen-shaped prompt, and a prompt is never tuned against a held-out set.
- **The screen comes before the gate.** Four of the five declines died on the
  literal-gap dimension and the 250-row fine-tune emitted an empty gap field on
  all ten items. Asking *"does this family produce a usable literal-gap
  explanation at all?"* costs one run on a development split. A fresh sealed set
  is the scarcest asset this programme has; it is spent on a candidate that has
  already cleared that dimension on the screen, or not at all.
- **Nothing here reopens a paid engine, and nothing here moves the bar.**
  `PLAN-local-model.md` §*Owner constraint* and [`v0-rubric.md`](v0-rubric.md)
  are both unchanged. Option **F** stays measured-closed.
- **Release one is not re-cut.** It shipped with the translator and tutor off
  (BAD-234). Turning them on needs a qualified artifact that does not exist and
  a separate ticket when it does.

The chain is BAD-244 (freeze a new gate set and development split, Chani) and
BAD-245 (screen the two licence-cleared families, Duncan) in parallel, then
BAD-246 (one gate run, Duncan, independently re-scored by Thufir), terminating
on BAD-247 (write the pin or return to Nick, Bad Dong). BAD-213 and BAD-188 now
wait on BAD-247. **If the screen shortlists no candidate, that is the verdict
and it goes straight to BAD-247** — no gate run, no new set burned.

**If option C declines, the options left are B, D, the held non-commercial
families and stopping.** Six declines would be information about the problem
rather than about a run, and the honest reading at that point is that a 2–7 B
local model will not explain a Korean literal/idiomatic gap to a learner's
standard. BAD-247 is written to say so rather than to propose a seventh rung.

## Option C measured and declined — 2026-10-05: the sixth decline

**Neither licence-cleared family was shortlisted, so the new reserved gate was
never opened.** Source of truth:
[`v3-screen-results.md`](v3-screen-results.md) at `01b89eb`, with retained raw
replies, artifact hashes, prompt hashes and item-level judgments;
[`v3-results.md`](v3-results.md) records the no-candidate branch.

| Development measure, out of 30 | Mi:dm 2.0 Mini | A.X 4.0 Light |
| --- | ---: | ---: |
| **Fully correct** | **0** | **0** |
| Meaning | 26 | 29 |
| Korean word-order gloss | 0 | 5 |
| Particle roles | 23 | 25 |
| Polite register | 22 | 25 |
| Romanization | 30 | 30 |
| **Literal-gap claims** | **0** | **3** |
| Schema-valid | 26 | 11 |
| Meaning reversals | 1 | 0 |
| **Invented-rule items** | **15** | **15** |

These are 30-item development counts, not gate scores. They are reported as the
reason the sealed set was not spent, not as a rubric verdict — the rubric is
unedited and still reads ≥9/10 fully correct on ten reserved items with zero
reversals and zero invented rules.

Three findings carry past this rung:

- **Korean specialisation did not buy the failing dimension.** Mi:dm is a
  Korean-native model from KT and scored **0/30** on literal gap, worse than the
  general-purpose Qwen3.5-4B's best. The deficit is contrastive explanation, not
  Korean coverage.
- **Both families invented a grammatical rule on 15 of 30 items.** For a
  teaching app that is worse than an empty field, and it is a hallucination
  profile rather than a capability gap — more parameters do not remove it.
- **A.X is out of envelope anyway.** 4,435,826,208 download bytes and 34.803 s
  warm p95 against the roughly 2.5–3 GB, 24 s standard. A qualifying score would
  have reopened the download budget rather than settled it.

Both artifacts were converted locally from publisher weights and **neither is
pinnable**: the local GGUF filenames do not exist at the publisher URLs, so the
downloader could not fetch what was scored. That is a second, independent reason
no pin is written here.

### Option E — pretrain our own Korean model: asked, priced, declined

Nick asked on BAD-15 whether Daneo should pretrain a narrow Korean-specific
model instead of re-training someone else's.
[`from-scratch-feasibility.md`](from-scratch-feasibility.md) (`8446153`) answers
it on measured grounds, not on effort: the whole authored corpus is **240,331
Hangul syllables**, roughly 300k Korean tokens, against a **≥1-trillion-token**
pretraining floor — short by about six orders of magnitude, and authoring more
lessons does not close it. Compute is not the blocker and the decline does not
rest on it. The Mi:dm result above is the direct empirical test of the premise:
narrowing to Korean removed nothing and installed nothing.

### The pattern that should decide this

Across six rungs, **every rubric dimension Daneo produces in code or holds as
reviewed data passes, and every dimension delegated to a model is why nothing
has passed.**

| Dimension | Produced by | Best measured |
| --- | --- | ---: |
| Romanization | `romanize.ts` | **30/30** |
| Particle roles | `particlesIn()` | 23–25/30 |
| Literal gap | the model | **0–3/30** |

The reviewed data for the failing dimension already exists in this repository:
**420 entries in `src/content/gap.json`, every one carrying exactly
`lit`/`real`/`note`**, beside **1,439 sentences with a human gloss on every one**
and **5,615 taught words**. Verified by counting the committed files, 2026-10-05.

**So option D is no longer "ship less."** It is a deterministic engine — an
established Korean morphological analyser (`lindera` is the first candidate to
price) plus lookup over our own reviewed corpus — that **cannot invent a rule**,
needs **no download**, and costs nothing at runtime. Its honest cost is
**coverage**: excellent inside the 5,615 taught words, and beyond them it must
say *"that is outside the course"* rather than guess.

### What is spent, and what is actually left

Spent: prompting, a repaired prompt, code-extracted fields, a 27-row fine-tune, a
250-row fine-tune, and a second model family — **six declines, nothing above
4/10 against ≥9/10**. That is information about the problem, not about a run.

Genuinely remaining, carried to Nick on BAD-247:

- **B — a larger parameter class**, priced above in the learner's download and
  working memory, and carrying the 15/30 invented-rule profile unchanged.
- **D — the deterministic engine**, as reframed above.
- **The held non-commercial families** (EXAONE, Kanana), available only if Nick
  states Daneo will never be sold; the EXAONE licence must then be **read**
  before any gate run — `engine-family-survey.md` records only that it is `-NC`.
- **Stopping the engine programme**, with the app as it shipped.

**Recommendation: D, or stop.** Not a seventh rung. A 2–7 B local model is not
going to explain a Korean literal/idiomatic gap to a learner's standard, and the
one dimension that fails is the one we already hold 420 reviewed answers for.

The rubric is unedited, no paid or cloud engine is reopened, `model-pin.json`
stays null, and release one is not re-cut. The reserved gate set
[`v3-translation-set.json`](v3-translation-set.json) is **unused** and survives
for any future authorized candidate.

## The training data never contained the output the rubric asks for — 2026-10-05

> **Superseded as an argument, 2026-10-22.** The defect recorded below is real and
> the repair worked — the rebuilt dataset carries the required pair on **160 of
> 406** rows against 10 of 317. The *inference* drawn from it did not survive the
> test: trained on that supervision, correct literal-gap explanations fell from
> **2/10 to 0/10** on the same development inputs. See §*The corrected supervision
> is measured and declined* at the end of this file. Read this section as the
> diagnosis it was, not as a live reason for another training run.


Nick asked why the Korean-native KT model is not simply fine-tuned on the one
dimension that fails. Auditing the training data to answer him turned up a
defect in our own supervision, and it changes what the two fine-tune declines
are evidence of. Source of truth, re-runnable:
`node reference/training/audit-gap-supervision.mjs`.

**Across every row either fine-tune has ever trained on or been selected
against — 317 rows over v1 training, v2 training and the v2 development split —
exactly 10 show an aligned multi-chunk gloss together with a non-empty
`literal_gap`.** That pair is what the rubric requires of every reply. The
model was shown it 10 times in 317.

Two independent construction faults produce that, both visible in
`reference/training/build-dataset.mjs`:

| Fault | Where | Effect |
| --- | --- | --- |
| Every sentence-derived row hardcodes `literal_gap: ''` | `build-dataset.mjs:139-140` | 194 rows teach that the field is empty |
| Every gap-derived row hardcodes `direction: 'ko-to-en'` and the **whole sentence as one chunk**, `role: 'other'` | `build-dataset.mjs:154-156` | the only rows carrying a gap also carry a gloss shape the rubric fails |

So the supervision is confounded twice over:

| Measure | Count |
| --- | ---: |
| `en-to-ko` rows carrying a non-empty literal gap | **2 / 110** |
| Gap rows whose gloss is a single chunk | **113 / 123** |
| Rows carrying both a multi-chunk gloss and a literal gap | **10 / 317** |

The dataset manifests record class counts and direction counts as independent
marginals and were reviewed that way; the cross-tabulation was never taken, so
neither the dataset review nor the training report could have seen this.

**It explains both halves of the v2 result, which nothing else did.** In
`en-to-ko` the field was demonstrated empty on 108 of 110 rows — and four of the
seven gate items requiring a gap are `en-to-ko`. In `ko-to-en`, a non-empty gap
was 92% co-located with the degenerate one-chunk gloss, so learning the correct
gloss and learning to emit a gap were in direct opposition. The artifact did
learn the gloss: **4/10 → 9/10**. It carried the empty gap field along with it,
on all ten items.

**What this does and does not establish.** The two artifacts are still declined;
those are measurements of artifacts and they stand. What is **not** supported is
the inference drawn from them — that a 4B model at this quantization cannot learn
to reason about a literal/idiomatic gap *from examples of it*. It was not given
examples of it. 115 of the 123 gap rows taught the field attached to an output
shape the rubric rejects, and the other direction taught its absence.

**A corrected rebuild is buildable from committed content, as a lower bound:**
**200** of the 1,439 glossed corpus sentences exhibit a reviewed `gap.json`
pattern, reaching **48** distinct gap entries — so **400 rows across both
directions**, every one carrying the human multi-chunk gloss the sentence
already has *and* a reviewed `lit`/`real`/`note` explanation. Against 10 today.
Substring matching is a deliberate lower bound: it misses inflected forms, so a
morphological build finds more anchors, never fewer. The reason the current rows
are degenerate is that `gap.json` entries are **patterns, not sentences** — only
2 of 420 match a full corpus sentence — which is why the builder had nothing to
align and used the whole string as one chunk.

**This is the first mechanism argument this project has had for another training
run**, as distinct from "more data". It does not reopen anything Nick closed: no
paid or cloud engine, no relaxed rubric, no pretraining, `model-pin.json` still
null, release one not re-cut. The reserved gate set
[`v3-translation-set.json`](v3-translation-set.json) remains **unused**, and a
rebuilt dataset must be screened on the development split before it is spent.

**On the KT model specifically: it is the wrong base for this, and not because
of cost.** Mi:dm 2.0 Mini is MIT-licensed, free, and already converted locally —
nothing was ever bought and nothing proposed here costs money. But the premise
of "near-perfect on everything else" does not hold for it: 0/30 fully correct,
**0/30 word-order gloss**, 22/30 register, one meaning reversal, and an invented
grammatical rule on **15/30** items. Its two strong columns — romanization 30/30
and particle roles 23/30 — are computed by `src/lib/translation-postprocess.ts`,
not by the model. Training it would have to carry four model-owned dimensions up
from near-zero while suppressing a hallucination rate of one item in two.

**The base that actually matches the premise is the one we already hold**: the
v2 Q8_0 fine-tune of the incumbent scores meaning 10/10, gloss 9/10, particles
10/10, register 10/10, romanization 10/10 and literal gap 3/10 — one field
short, and that field is the one the supervision never taught. If another
training run is authorized, it belongs on that base, not on a Korean-native
model that fails four dimensions and invents rules.

## The corrected supervision is measured and declined — 2026-10-22: the seventh decline

The mechanism argument above was the one thing this project had never tried: not
*more* data, but data that actually demonstrates the output the rubric asks for.
It was built, trained and scored, on the incumbent base the argument named, and
**it made the failing dimension worse.** Source of truth, committed:
[`../training/evidence/paired-development-comparison.md`](../training/evidence/paired-development-comparison.md),
independently reviewed on BAD-260.

**The repair itself is not in doubt.** `node reference/training/audit-gap-supervision.mjs
reference/training/dataset-paired.json` reports 406 approved rows, **160 carrying
an aligned multi-chunk gloss together with a non-empty `literal_gap`** — 80 per
direction, an exact 50/50 split — and **zero** single-chunk gap rows. Both faults
named in the section above are gone. The model was shown the required pair 160
times in 406, against 10 times in 317.

| Measure, 10 preserved development inputs | v2 artifact | Corrected paired |
| --- | ---: | ---: |
| **Correct literal-gap explanation** | **2/10** | **0/10** |
| Non-empty literal gap | 9/10 | 1/10 |
| Multi-chunk gloss, shape only | 1/10 | 8/10 |
| Non-empty gap **+** multi-chunk gloss | 1/10 | 1/10 |
| **Correct gap explanation + multi-chunk gloss** | **1/10** | **0/10** |

**What the two columns show is a trade, not a gain.** The corrected artifact
learned the gloss shape the old supervision had taught wrong — 1/10 to 8/10 — and
stopped emitting the gap field at all, 9/10 down to 1/10. The v2 artifact did the
opposite: it emitted the field on nine of ten items and explained it correctly on
two. Neither carried both. Four epochs on 160 demonstrations of the pair produced
the pair **once**, and that once was wrong: the single non-empty explanation reads
눈코 뜰 새 없다 as an inability to sleep, where the project-owned reading is *being
utterly swamped, with no time to breathe* — the same invented-rule failure the
family screen measured at 15/30 on two other models.

**So the confound is answered, and the answer is not the one the diagnosis
predicted.** The supervision defect was a true defect and fixing it was correct
work; it was not what stood between a 4 B local model and a learner-grade
contrastive explanation. The protocol leaves no room to blame the run: the
original incumbent prompt by hash, the same base revision, seed and LoRA
settings, the same frozen 40-row development split, a predeclared loss-only
selection rule applied before any answer was read (0.0001/epoch 1, 0.360212
against 0.365144), the unchanged native worker at matching bytes, and all ten
replies passing schema and provenance. An earlier recovery that inherited the
wrong product prompt is preserved and excluded from selection, with a hash guard
now rejecting that drift before a model loads.

**That is seven declines**: prompting, a repaired prompt, code-extracted fields, a
27-row fine-tune, a 250-row fine-tune, a second model family, and corrected
paired supervision. Nothing has passed above 4/10 against an unchanged ≥9/10 bar,
and the one dimension that fails has now failed on prompting, on scale, on
Korean specialisation and on correct supervision.

### What the seventh decline does to the option set

> **Superseded 2026-10-22 — these four options were put to Nick and he chose to
> stop.** None of them is live. See §*Nick's decision — 2026-10-22: stop* below.
> The list is kept because it is what he was shown when he decided.

Nothing is added and nothing is removed — the four options Nick already held
stand, and the recommendation hardens:

- **D — the deterministic engine.** `lindera` plus lookup over the reviewed
  corpus. It cannot invent a rule, needs no download, costs nothing at runtime,
  and its answers are the 420 `lit`/`real`/`note` entries already in
  `src/content/gap.json`. Its cost is coverage: excellent inside the 5,615 taught
  words, and outside them it must say *"that is outside the course"*.
- **B — a larger parameter class.** Priced above in the learner's download and
  working memory. The invented-rule profile is unchanged by scale, and the
  corrected result shows the failure is not a supervision gap that more
  parameters would now exploit.
- **The held non-commercial families** (EXAONE, Kanana) — available only if Nick
  states Daneo will never be sold, with the EXAONE licence **read** before any
  gate run.
- **Stopping the engine programme**, with the app as it shipped.

**Recommendation: D, or stop.** The delegation pattern recorded above is now the
best-supported finding in this whole chain — every rubric dimension Daneo
computes in code or holds as reviewed data passes, and every dimension handed to
a model is why no candidate has qualified.

**Unchanged by this rung.** `reference/model-pin.json` is still `{"pin": null}`.
[`v0-rubric.md`](v0-rubric.md) is unedited and relaxing it stays measured-closed.
No paid or cloud engine is reopened. Release one is not re-cut. The reserved gate
set [`v3-translation-set.json`](v3-translation-set.json) was **never opened** —
`python3 reference/eval/check-independent-freeze.py` exits 0 over all 136
reservations, and `--candidates reference/training/dataset-paired-candidates.json`
confirms all **406** rebuilt rows avoid every one of them, by ID and by
normalized English and Korean. The gate survives unspent for any future
authorized candidate.

## Nick's decision — 2026-10-22: stop. The engine programme is closed.

Asked to choose between the deterministic engine, a larger parameter class, the
held non-commercial families and stopping, Nick answered:

> *"we can just forget about the AI features. it would be nice to have but is
> apparently difficult to get working"*

**That is the stop option, and it ends the programme rather than pausing it.**
This section is the terminus of the whole Phase D engine chain; everything above
is the record of how it got here. Seven rungs were measured — prompting, a
repaired prompt, code-extracted fields, a 27-row fine-tune, a 250-row fine-tune,
a second (Korean-native) model family, and corrected paired supervision — and
nothing scored above **4/10** against an unchanged **≥9/10** bar.

### What the decision settles

- **No engine is selected, and none will be chosen by any later run.**
  `reference/model-pin.json` stays `{"pin": null}`. The downloader refusing an
  unset pin is designed behaviour, not an open defect.
- ~~**The deterministic engine (option D) is not started.** It was the
  recommendation and it was not chosen.~~ **Corrected the same day: Nick named
  option D at 05:05 and it is started.** See §*Nick's decision — 2026-10-22:
  build the translator in code* below. The condition this bullet set — *"nothing
  acts on it unless Nick names it again"* — was met by him naming it, not by an
  agent's reading of this file. The rest of the bullet stands as written: option D
  is `lindera`-or-equivalent segmentation plus lookup over the 420 reviewed
  `lit`/`real`/`note` entries in `src/content/gap.json`, and it remains the only
  route on record that could deliver the literal/idiomatic gap to the rubric's
  standard.
- **The AI features stay off in the shipped product.** Release one already
  shipped with the translator, Ask Daneo and the model controls excluded at build
  time (BAD-234), and that release is not re-cut by this decision. The code
  remains in the tree and remains available in development; **re-enabling it in a
  production build takes an owner decision, which does not exist.**
- **Nothing is deleted.** The training data, the evaluation harness, the native
  worker, the screens and every numbered result stay committed. The cost of
  keeping them is zero and they are the evidence for the decision.
- **The sealed gate set survives unspent.**
  [`v3-translation-set.json`](v3-translation-set.json) was never opened. It is not
  spent, not re-drawn and not retired; `check-independent-freeze.py` exits 0 over
  all 136 reservations. If the programme is ever reopened, the gate is intact.
- **The rubric does not move.** [`v0-rubric.md`](v0-rubric.md) is unedited.
  Relaxing it was measured-closed and stopping does not reopen it.
- **No paid or cloud engine is reopened.** `PLAN-local-model.md` §*Owner
  constraint* is unchanged. Stopping the local engine is not an argument for a
  hosted one.

### What reopening it would take

Nick naming it. Not a new model release, not a better benchmark, not an agent's
judgement that the field looks tractable now. **The failing dimension is
contrastive explanation** — stating why the literal words of a Korean phrase
differ from what the phrase means — and it has now failed on prompting, on
scale, on Korean specialisation and on correct supervision. Any future proposal
has to beat that record, not restate the hope.

### The practical reading, for whoever comes to this cold

Daneo ships and works without an engine. Everything the rubric asked a model for
that Daneo could instead compute or look up already passes: romanization is
`romanize.ts` at 30/30, particle roles are `particlesIn()` at 23–25/30, and the
literal/real gap for the taught corpus is 420 reviewed entries authored by hand.
The feature that is gone is the open-ended one — explaining a phrase the course
does not teach. That is the thing seven rungs could not do to a learner's
standard, and the decision is to live without it.

## Nick's decision — 2026-10-22: build the translator in code

Asked what Daneo should do next, Nick selected two things:

> *"Test Windows, macOS and RPM first"* and *"Build the translator in code, with
> no AI model."*

The second is **option D**, and it is the naming that §*What reopening it would
take* required. It reopens nothing else: the model programme above stays stopped,
`reference/model-pin.json` stays `{"pin": null}`, no paid or cloud engine is
admitted, and [`v0-rubric.md`](v0-rubric.md) is still unedited.

### What option D is, concretely

A translator with **no model, no download and no network**, assembled from
material this repository already holds and has already reviewed:

| Rubric dimension | Source in this repository | Already proven |
| --- | --- | --- |
| Romanization | `romanize()` in `src/lib/romanize.ts` | 30/30 measured |
| Particle roles | `particlesIn()` in `src/lib/translation-postprocess.ts` | 23–25/30 measured |
| Korean-order gloss | the aligned `gloss[]` chunks on all 1,439 `src/content/sentences.json` entries | authored and six-pass reviewed |
| Literal gap, cultural note | the 420 `lit`/`real`/`note` entries in `src/content/gap.json` | authored and six-pass reviewed |
| Meaning | `en[]` / `ko[]` chunk alignment on the same 1,439 sentences | authored and six-pass reviewed |
| Polite register | the course teaches one register; taught forms are in `src/content/words.json` (5,615 entries) | authored |

The engine's job is therefore **segmentation, lookup and assembly**, not
generation — and its honest cost is coverage. Inside the taught vocabulary it
answers from reviewed data. Outside it, it must say *"that is outside the
course"* and must never synthesize a grammatical or cultural claim. A refusal is
a correct answer; an invented rule is the failure mode that declined two Korean
model families at 15/30.

### Two problems this plan has that a model-based plan did not

Both are named here so no slice has to rediscover them.

**1. The existing frozen gate sets cannot honestly score a lookup engine.** Every
item in the v0/v1/v2/v3 sets carries a `corpusSentenceId` — they are corpus
sentences, and the corpus is the engine's own lookup table. A lookup engine would
score near-perfectly on them while demonstrating nothing, which is memorisation
in the most literal sense available. **A deterministic candidate is therefore
developed and scored against a new set of novel recombinations** — sentences
composed only of taught words that are not themselves corpus sentences — plus a
deliberate out-of-course class that tests refusal. The unedited rubric still
governs each item; what changes is the item population, and the reason is written
down rather than assumed.

**2. Conjugation is the real engineering risk, not segmentation.**
`src/content/words.json` stores dictionary forms (`마시다`) while the corpus uses
polite forms (`마셔요`), and the irregulars are recorded only as human prose in
each entry's `notes` field (*"ㅂ-irregular: 더러워요"*). Recovering one from the
other across 5,615 entries is the part of option D that can fail on measurement,
and it is measured **before** any app code is written: can the engine recover the
stored chunk boundaries and `wordIds` of a corpus sentence it is not allowed to
look up whole? If that number is poor, option D is a corpus-sentence lookup with
a refusal path for everything else — still useful, much narrower, and the board
hears it as a finding rather than discovering it in review.

### What this decision does not authorize

- **The sealed gate set stays sealed.** `v3-translation-set.json` has never been
  opened and spending it is Nick's call, not an engineer's. Development and
  scoring happen on the new recombination set.
- **Release 0.1.0 is not re-cut.** It shipped with the AI translator, Ask Daneo
  and the model controls excluded at build time, those are the exact bytes under
  owner platform verification, and a deterministic translator lands in a **later**
  version. Nothing in this section changes a staged 0.1.0 installer.
- **The gated-out model code is not deleted and not re-enabled.** It stays in the
  tree, off in production builds, available in development.

## Option D measured — 2026-10-22: there is no translator, there is a lesson lookup

**The eighth rung, and the first one with no model in it.** Option D was built,
wired into Explore and scored under the unedited rubric. The result is **0/24
fully correct**, agreed on every item by an independent re-score. Source of
truth: [`recombination-course-results.md`](recombination-course-results.md) at
`b272896`, over the frozen set in
[`recombination-dev-set.json`](recombination-dev-set.json), with raw adapter
output and all six per-dimension verdicts retained.

| Frozen recombination population | Fully correct | Refusals | Substantive answers |
| --- | ---: | ---: | ---: |
| Class 1 — recombinations of taught words | 0/12 | 12/12 | 0/12 |
| Class 2 — out-of-course, refusal expected | 0/6 | 6/6 | 0/6 |
| Class 3 — near-misses | 0/6 | 6/6 | 0/6 |
| **Total** | **0/24** | **24/24** | **0/24** |

The engine answered nothing. It is not a score that a better prompt or a bigger
artifact moves, because there is no model in the loop: the engine returns the
typed `outside-course` error on every input that is not a verbatim course
sentence, by construction and on purpose.

### This was predicted, measured first, and then chosen

§*Two problems this plan has that a model-based plan did not* wrote the
conditional before any app code existed: *"If that number is poor, option D is a
corpus-sentence lookup with a refusal path for everything else — still useful,
much narrower, and the board hears it as a finding rather than discovering it in
review."* The number was poor.
[`deterministic-engine-feasibility.md`](deterministic-engine-feasibility.md)
recovers the stored word-ID set of a corpus sentence from its Korean surface
alone in **407/1,439 (28.28%)** sentences, **410/1,439 (28.49%)** with a bundled
dictionary adapter, and the stored chunk boundaries in **277/1,439 (19.25%)**.
Conjugation, not segmentation, is what fails: `words.json` stores `마시다` and the
corpus uses `마셔요`, with the irregulars written as human prose in each entry's
`notes`.

So the engine was narrowed to exact lookup with the owner's accepted scope change
at slice 3, and the 0/24 is the honest consequence of that narrowing rather than
a new discovery. **The rubric verdict is therefore that the translator does not
exist**, not that a translator was built and scored badly. The rubric describes
open-ended translation; the thing that was built does not attempt it.

### What each failure mode costs a learner

1. **Every recombination of taught words is refused (18/18 must-answer items).**
   A learner who has finished Module 2 and assembles `친구는 우유를 좋아해요` from
   words the course taught them gets no answer. This is the single most natural
   thing a learner does with a translator, and it is the whole of classes 1 and
   3. The refusal is honest, but to a learner it is indistinguishable from the
   feature being broken.
2. **The out-of-course refusal does not name the untaught word (6/6).** On
   `저는 양자컴퓨터를 봐요` the engine knows which token it could not resolve —
   `unresolvedInput` holds it internally — and the Explore adapter returns the
   whole submitted sentence instead. Echoing the input back is not a diagnosis.
   The learner is told something is outside the course without being told which
   word, which is the one piece of information that would let them act.
3. **Exact match means exact, with no trimming or normalization.** A trailing
   space, a missing terminal mark or different spacing refuses. `ExplorePage.run`
   passes the raw field value through, so a stray space a learner cannot see
   defeats a sentence that is in the corpus.
4. **Two worked examples out of 1,439, and no browse path.** The only
   discoverable way in is copying a sentence out of a lesson. Nothing in Explore
   shows a learner the set of sentences it can answer.

**No invented rule, no meaning reversal and no thinking leak was observed
(0/24 each).** That is the failure mode that declined two Korean model families
at 15/30 invented-rule items, and a lookup engine is structurally incapable of
it. It is also, on this population, measured over zero substantive answers — the
clean flags are a property of the design, not evidence of translation quality.

### What does work, measured

Over all 1,439 reviewed course sentences, submitted as the exact joined Korean
surface Explore and the lesson card both render:

| Measure | Result |
| --- | ---: |
| Sentences returning a reviewed translation | **1,439/1,439** |
| Ambiguous or unsafe source rows | 0 |
| Sentences carrying a reviewed `lit` → `real` gap and cultural note | 193 |

Reproduce from the repository root with `node --import tsx`, calling
`translateCorpusSentence(sentenceSurface(s.ko))` over `src/content/sentences.json`
and counting statuses. That is complete, correct coverage of the lookup table —
and the honest discount is that **the lesson card already shows most of it**.
`SentenceList.tsx` renders the same Korean with the same role colouring, the
romanization, the English and the sentence note. What Explore adds beyond the
lesson is the explicit per-chunk gloss text, the computed particle chips, the 193
gap lit → real explanations with their cultural notes, and the save-to-deck path
into the gap drills. That is a real feature. It is a **lesson-sentence
breakdown**, not a translator, and calling it a translator is the part that would
mislead a learner.

### The sealed gate should not be spent on this

[`v3-translation-set.json`](v3-translation-set.json) has never been opened and
`check-independent-freeze.py` exits 0 over all 136 reservations. Spending it here
would be the worst purchase available:

- **Every item in it is a corpus sentence**, carrying a `corpusSentenceId`, and
  the corpus is this engine's own lookup table. A lookup engine scores near
  perfectly on it while demonstrating nothing. That is memorisation in the most
  literal sense, and §*Two problems* is why the recombination set was authored in
  the first place.
- **It would read as a pass.** A high number against a sealed, reserved,
  independently frozen gate is the strongest-looking evidence this project
  produces, and it would be evidence about the wrong question. The measured
  0/24 is the number that describes this candidate.
- **It is the last reserved set.** All 96 earlier reservations are burned. Spent
  here, a future question that genuinely needs an unseen population has nothing
  left to ask it with.

Recorded as **weak evidence about this candidate**, not as a neutral option.

### Recommendation to the owner — 2026-10-22

1. **The translator does not ship, because there is no translator.** Do not
   release the Explore surface under that name on a 0/24 measurement.
2. **The lesson-sentence breakdown is worth shipping under its own name**, in a
   later version, after the three defects above are fixed: name the untaught word
   on refusal, normalize the submitted input, and give a learner a way to find
   the sentences it can answer. If those do not land, option 1 stands alone and
   the surface is gated out of production builds the way the model translator is.
3. **Keep the sealed gate sealed.**
4. **Nothing in the released 0.1.0 changes either way.** Its four staged
   installers are the bytes under owner platform verification; the breakdown
   lands in a later version and publishing anything still asks.

The decision is the owner's and is recorded in the section below when he answers.

## Nick's decision — 2026-10-24: fix the three defects, then ship it as a lesson breakdown

**Answered on BAD-267.** Both recommendations were taken, and a third answer
changed what the release ticket is waiting on.

| Question | His answer |
| --- | --- |
| What do we do with the in-code engine? | **Fix the three defects first, then ship it as a lesson breakdown** |
| Do we open `v3-translation-set.json` and score this engine on it? | **Keep it sealed** |
| The 0.1.0 installer results | Not run: *"I haven't run them because I don't know where to get the installers."* |

### What the decision settles

1. **The surface ships, and it does not ship as a translator.** Recommendation 2
   of the section above is adopted over recommendation 1. It goes out under a
   name that describes a **lesson-sentence breakdown**: the per-chunk gloss, the
   computed particle chips, the 193 reviewed `lit` → `real` gap explanations with
   their cultural notes, and save-to-deck, over the 1,439 sentences the course
   teaches. No copy on it may claim translation, free input, or coverage outside
   the taught corpus.
2. **The three defects are a precondition of shipping, not a follow-up.** Named
   in §*What each failure mode costs a learner* above: the refusal must name the
   untaught word it already holds in `unresolvedInput` (6/6 failures); the
   submitted input must be normalized before lookup, because `ExplorePage.run`
   passes the raw field through and an invisible trailing space defeats a corpus
   sentence; and a learner needs a browse path to the sentences it can answer,
   where today there are two worked examples out of 1,439.
3. **0/24 stands as the measured number for this candidate**, undiluted. It
   ships because a correct breakdown of 1,439 reviewed sentences is worth
   shipping, not because the rubric verdict moved. The rubric is unedited and
   measured-closed.
4. **The sealed gate stays sealed.** `v3-translation-set.json` has still never
   been opened and all 136 reservations in `check-independent-freeze.py` remain
   intact. It is the last reserved set; it was not spent on a lookup engine whose
   own lookup table it is drawn from.
5. **A later version, never 0.1.0.** The four staged installers are untouched
   and `reference/releases/0.1.0/SHA256SUMS` is unchanged. Publishing still asks.

### What the decision does not authorize

- **No model.** The engine programme is closed, `reference/model-pin.json` stays
  `{"pin": null}`, and the gated-out model code stays in the tree and off in
  production builds. Shipping a deterministic breakdown is not a step back
  towards an eighth model rung.
- **No new-input coverage claim.** The `outside-course` refusal path is the
  product, not a gap to be papered over with synthesis. Naming the untaught word
  is a better refusal, not a weaker one.
- **No rubric edit and no re-score.** The 0/24 is not to be re-run for a kinder
  number, on any population, sealed or otherwise.

### The installers were already on the build host

The third answer is not a verdict, it is a blocker: nobody told him where the
bytes were. They are on this machine, and they are intact —
`sha256sum -c SHA256SUMS` in `.release-staging/0.1.0/` passes **4/4** against
`reference/releases/0.1.0/SHA256SUMS` on 2026-10-24, so the irreplaceable bytes
are the ones recorded at release. The path and the copy command are on the owner
platform verification ticket. No installer was rebuilt and no CI artifact was
needed.

### What follows

**BAD-274** — fix the three defects and ship the breakdown under its own name in
a later version — owned by Bad Dong, closed when the three defects have tests
and the surface no longer calls itself a translator. Phase E is otherwise
finished: there is no slice 8 on the engine.
