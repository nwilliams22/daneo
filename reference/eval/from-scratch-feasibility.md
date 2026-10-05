# Building a Daneo-specific model from scratch — feasibility

2026-10-05. Nick asked whether Daneo should **train its own Korean-specific model** rather than keep
re-training someone else's, on the reasoning that *"that's all we really need the model for."*

**Answer: not as a pretrained language model — the data gap is about six orders of magnitude, and the
specialisation it would buy has already been measured and does not fix our failing dimension. But the
instinct is right, and it points somewhere this project can actually reach: the narrow scope makes a
deterministic, corpus-backed engine viable, and every dimension Daneo already produces in code or in
authored data passes while every dimension left to a model fails.**

This document prices the from-scratch option so it is declined on evidence rather than on instinct,
and states the alternative it argues for. It selects no artifact and changes no pin.

## 1. The data gap

Measured from the tree at this commit, not estimated:

| Source | Characters | Hangul syllables |
| --- | ---: | ---: |
| `src/content/*.json` (words, sentences, gap deck, modules index) | 2,784,839 | 181,087 |
| `src/content/modules/*.md` — all 164 lessons | 787,033 | 59,244 |
| **Total authored content** | **3,571,872** | **240,331** |

Those two rows overlap: the lessons quote the sentences. So Daneo's **entire** Korean holding is
**under ~240,000 Hangul syllables**, call it **under 300,000 Korean tokens**, and its entire authored
text in any language is roughly **one million tokens**.

A modern small instruct model is pretrained on **at least a trillion** tokens; the incumbent Qwen3-4B's
publisher reports a corpus in the tens of trillions. Even against the conservative one-trillion floor,
Daneo owns about **one millionth** of a pretraining corpus. Against the published figure for the model
we already have, it is nearer one part in thirty million.

That gap cannot be closed by writing more lessons. Tripling the entire course — a year of authoring —
moves us from 10⁻⁶ to 3×10⁻⁶ of what the floor requires.

## 2. The compute is *not* the blocker, which is worth stating plainly

It would be wrong to decline this on "we don't have the hardware." We roughly do.

A 0.5B-parameter model trained Chinchilla-optimally on 10B tokens costs about `6ND` =
6 × 5×10⁸ × 10¹⁰ ≈ **3×10¹⁹ FLOPs**. The build host's RTX 5090 does on the order of 100 TFLOP/s dense
BF16; at a realistic 35% utilisation that is ~3.5×10¹³ FLOP/s, so the run is roughly **ten days** of
continuous GPU time. That is a long but survivable number, and it costs nothing but electricity.

*(Arithmetic, clearly labelled as such — not a measured run.)*

The problem is the other side of the equation. We do not have 10 billion tokens of curated Korean we
authored and are licensed to train on, and the model that came out would be a 0.5B trained on 10B
tokens: **strictly and substantially weaker** than the 4B that already scored 4/10 on the burned v0
items and 3/10 on the sealed v2 set. We would spend ten days of GPU and months of data work to arrive
below where we started.

## 3. The decisive point: Korean specialisation was measured today, and it did not help

This is the part that makes the question cheap to answer, because the experiment is already paid for.

**Mi:dm 2.0 Mini is exactly the thing the proposal describes** — a small (2.3B) model specialised on
Korean, built by KT with resources this studio does not have. It was screened on the 30-item
development split this morning ([`v3-screen-results.md`](v3-screen-results.md)):

| Measure, out of 30 | Mi:dm 2.0 Mini | A.X 4.0 Light |
| --- | ---: | ---: |
| Fully correct | **0** | **0** |
| Literal-gap claims | **0** | **3** |
| Invented grammatical rules | **15** | **15** |
| Meaning reversals | 1 | 0 |

Korean-native training data at national-telecom scale bought **zero** on the dimension that has
declined every candidate. The failing field is not a Korean-knowledge field — it is a **contrastive
explanation** field: *why does the word-for-word structure differ from the real reading?* That is a
reasoning capability that emerges from general scale. Narrowing a model's domain removes the general
ability and does not install the specific one.

So the honest prediction for a Daneo-scale from-scratch model is not "uncertain." It is: **worse than
Mi:dm, which scored zero.**

## 4. What the evidence actually points at

Set every model result side by side with **who produces each field today**:

| Rubric dimension | Produced by | Best measured |
| --- | --- | ---: |
| Romanization | **code** — `src/lib/romanize.ts` | 30/30, both candidates |
| Particle roles | **code** — `particlesIn()`, a 21-entry table over `words.json` | 23–25/30 |
| Meaning | model | 26–29/30 |
| Polite register | model | 22–25/30 |
| Korean word-order gloss | model | 0–5/30 |
| Literal-gap claims | model | 0–3/30 |

**Every dimension Daneo computes itself passes. Every dimension it delegates to a model is the reason
no model has passed.** Five candidates, three families, and that pattern has never once broken.

And the field that fails hardest is the one Daneo has **already authored by hand**:
`src/content/gap.json` holds **420 reviewed entries** carrying precisely the fields the rubric asks
for — `lit`, `real`, and an explanatory `note`:

```json
{ "id": "g_isseoyo", "ko": "있어요 / 없어요", "lit": "exists / doesn't exist", "real": "have / don't have",
  "note": "Korean has no verb 'to have' for possession in everyday speech. 'I have time' is
           시간이 있어요 — 'time exists (for me).' The owner is just understood." }
```

Alongside them sit **1,439 sentences with human interlinear glosses and notes**, carried through six
independent review passes and 66 corrections. We have been asking a 4B model to improvise, badly,
content that is sitting in the repository, written correctly, already checked.

## 5. The proposal this argues for

**Build the Daneo-specific engine, but build it as a system, not as a neural network.** Nick's premise
— the scope is narrow — is the thing that makes this viable, and it is the opposite of what makes
pretraining viable.

1. **Morphology from a real analyser, not a regex.** Replace the hand-rolled 21-particle table with an
   established Korean segmenter/POS tagger. `lindera` (Rust, permissive, ko-dic) is the candidate
   worth pricing first because it embeds in the existing Tauri shell with no runtime download —
   **unverified; checking it is the first slice.**
2. **Literal gap and cultural note by lookup**, over the 420 authored gap entries and the 1,439
   sentence notes, keyed by construction. Deterministic, reviewed, offline.
3. **Gloss by composition** — the analyser's segmentation over `words.json` (5,615 entries with POS
   and English), emitted in Korean order by construction rather than by hope.
4. **Register by construction.** Daneo teaches 해요. For KO→EN no Korean is generated at all.
5. **The residual is free-text EN→KO outside the course vocabulary** — the only place generation is
   genuinely required.

**The property this buys that no model has offered: it cannot invent a grammatical rule.** Both
screened candidates invented one on **15 of 30 items**. For a teaching app that is the worst failure on
the list — worse than a blank field — and it is not fixable by scale, because a model that explains
confidently is the same model that explains confidently when wrong. A lookup can only say what a human
wrote.

**The honest cost is coverage.** This engine is excellent across the 5,615 taught words and the constructions
Daneo teaches, and must say *"that is outside the course"* beyond them, or hand that residual to a
model under a visibly lower claim. That is a **narrower product claim**, which is one of the four
options already standing on BAD-247 — reached here from evidence rather than from fatigue.

## 6. Recorded conclusions

- **Pretraining a Daneo-specific model from scratch is declined on measured evidence**, not on effort.
  Data short by ~6 orders of magnitude; the specialisation it would buy measured at 0/30 on the
  failing dimension; predicted outcome below the candidates already declined.
- **Further fine-tuning stays closed** until someone has a mechanism argument. 9.3× more reviewed data
  bought one extra correct item and left the literal-gap field empty on all ten.
- **No gate set is spent on any of this.** The sealed set is opened once, on a finished artifact.
- The next engine decision belongs to **BAD-247**, which now carries this option priced.
