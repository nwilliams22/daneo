# Post-extraction fine-tuning decision

**Decision: go.** The valid post-extraction baseline has trainable residual errors,
and a measured BF16 LoRA → merge → matched Q8_0 → pinned-runtime path now exists.
Proceed to reviewed dataset construction, then full training and independent
qualification. This decision does not select a shipping model or claim that
training has already improved quality.

## Deciding evidence

The source of truth is [the final v1 verdict](../eval/v1-results.md), its
[raw replies](../eval/raw/v1-raw.jsonl), [assembled results](../eval/raw/v1-results.jsonl),
and [per-item first scores](../eval/raw/v1-scored.json). The independent verdict
corrects particles from 9/10 to **8/10** (KE-05); all other dimension totals stand.
Pre-run commit `da957d4`, evidence commit `575fcd0`, final verdict `6587c1f`.
The retired v0 scores do not justify this decision. The spent v1 set is not rerun.

Fully correct **2/10** against ≥9/10; schema and direction **10/10** each;
zero meaning reversals, one invented-rule item. Baseline warm p95 **17.544 s**
is below 30 s, supporting retaining the 4B base for training. This is not a Q8
latency qualification; the trained Q8 artifact still needs its own gate.

## Per-item attribution

IDs below have prefix DAN-V1-. No separate near-miss category exists in the rubric; one-dimensional misses are identified explicitly instead of inventing a score.

| Item | Residual failures | Training implication |
|---|---|---|
| EK-01 | Gloss drops subject/object markers; deferential ending instead of lesson 해요 register | Complete aligned gloss and consistent lesson register |
| EK-02 | Gloss omits topic marking; deferential ending | Same two classes |
| EK-03 | Gloss omits object marker; Korean separates marker from noun; assembled particles omit it | Train orthography and gloss coverage; extraction defect requires code regression separately |
| EK-04 | Only gloss fails: topic marking omitted | Single-dimension near miss; gloss coverage |
| EK-05 | Meaning adds unrequested “also”; unnatural slash-form sibling; gloss omits topic/additive marking | Semantic fidelity and natural wording, complete gloss |
| KE-01 | Gloss invents a topic-marker rule for subject marker; gap misses existence structure | Truthful aligned gloss and literal/idiomatic distinction; no particles[] training |
| KE-02 | Meaning misses ordinary office/work reading; gloss obscures action location; gap misses literal company versus idiomatic work | Context-sensitive meaning and explicit gap |
| KE-03 | All dimensions pass | Preserve successful behavior; not a training example |
| KE-04 | All dimensions pass, including omitted-subject explanation | Preserve successful behavior; not a training example |
| KE-05 | Gloss omits topic/locative; gap misses contextual my-family reading; assembled particle explanation confuses living and action location | Gloss and gap training; contextual particle explanation is a separate application defect |

Totals: gloss fails 8/10; meaning 2/10; register 2/10; literal gap 3/10; particles 2/10; romanization 0/10. Schema and direction pass 10/10 each; zero reversals/thinking leaks; one invented-rule item; fully correct 2/10. Counts overlap and must not be added as item totals.

Supervised examples plausibly address output alignment, omitted semantic relations, register consistency, unsupported additions, and explaining a known literal/idiomatic distinction. The existing corpus supplies aligned chunks and notes, but source content is not automatically a correct model target. Every generated target needs schema validation and linguistic review. No evidence here calls for factual-knowledge training or a longer context window. Prompt changes after viewing v1 would consume its independence; do not rerun it.

## Why adaptation is justified

Gloss is the binding constraint: eight failures, including the sole one-dimension
near miss EK-04. Targets must retain Korean order, cover attached grammatical
relations and avoid invented explanations. Register failures EK-01 (`마십니다`)
and EK-02 (`갑니다`) call for consistent lesson 해요 responses. Meaning failures
EK-05 and KE-02 require semantic fidelity; literal-gap failures KE-01, KE-02 and
KE-05 require honest explanation of the literal versus ordinary reading.
These are learnable response conventions with aligned curriculum examples.
That is a hypothesis supported by the error classes, not evidence of a trained
model's quality. Retrieval may supply vocabulary facts, and validators can enforce
shape, but neither alone supplies a complete sentence-aligned gloss.

Do not supervise romanization or particles[]. The EK-03 extraction miss and
KE-05 contextual particle explanation remain application defects; a fine-tune
cannot be credited with repairing those deterministic outputs. Grammatical
relations in gloss remain model-owned. Preserve passing schema/direction behavior
with independent corpus examples, never by copying held-out passing rows.

## Measured compatibility and limits

[Training results](results.md) and its retained evidence establish four finite
losses (0.493317, 0.274542, 0.384078, 0.345357), 256 changed adapter tensors,
BF16 merge and GGUF export. Exact environment is `requirements.lock`; base
Qwen/Qwen3.5-4B revision `851bf6e806efd8d0a36b00ddf55e13ccb7b8cd0a`,
Apache-2.0. BF16 LoRA ran on the authorized RTX 5090 (32,607 MiB), peak allocated
10,125,327,872 bytes. Four-step training took 48.317 s with compilation;
this does not predict full-run duration or require paid infrastructure.

Matched Q8_0 is **4,610,579,744 bytes**, SHA-256
`26e1c9db711b5fc43dc2b373bae825e506d55129b735a1bfe2bafce732e5fd4d`.
It passes strict model-owned, production postprocessor and assembled schemas
through unchanged `llama-cpp-2 0.1.158`; baseline and matched Q4 fail all three.
The independent review passed, and the decision owner accepted the documented
BF16 reconversion deviation on 2026-10-05. The source files have identical
whole-file SHA-256; the historical deviation remains in results.md.

This is one fixed-input contract proof. Its one-chunk gloss is not a quality pass,
and the unscored greeting omits gloss. Fixed-input completion 14.102 s on the
CPU worker is not warm p95 or GPU inference evidence. Production pins stay
unchanged. Reuse this tooling for the full training chain; qualify the resulting
artifact independently before shipping.

## Dataset and evaluation contract

Build from project-owned curriculum, with pinned corpus provenance, reviewed
labels and counts by gloss, semantic-fidelity, register and literal-gap class.
No quota. Validate strict model-owned targets separately from assembled app
responses; do not restore mechanical labels to satisfy the full app schema.
No personal learner data or third-party synthetic corpus.

Exclude **all 96 reservations**: v0/v1/dev/v2 (36) plus the 60 independent anchors
in `reference/eval/training-independent-set.json`, frozen before the smoke run.
`reference/eval/check-independent-freeze.py` decides ID and normalized English/
Korean exclusion. Also exclude derived variants, paraphrases and corrections;
text matching alone cannot prove independence of paraphrases. Do not use this
diagnostic document as training data or prompt examples. Do not read reserved
content to generate targets. Dataset construction must retain the independent
freeze and finalize its evaluation protocol before full training; the existing
frozen v2 gate remains intact. No v1 rescore or inference is authorized.

## Verification and finish

Rechecked in `/mnt/t7/Projects/daneo` without inference:

- `python3 reference/eval/check-provenance.py reference/eval/raw/v1-raw.jsonl --report-commit 575fcd0 --item-set reference/eval/v1-translation-set.json`:
  **PROVENANCE PASS: 11 raw rows verified against 575fcd0**, exit 0.
- `python3 reference/eval/check-independent-freeze.py --candidates reference/training/smoke-examples.json`:
  **60 independent + 36 prior reservations; 4 clear candidates**, exit 0.
- `node --import tsx reference/training/validate-matched.mjs`:
  **Q8 true/true/true; both Q4 controls false/false/false**, exit 0.
- `node --import tsx reference/training/validate-runtime.mjs --q8`:
  **PASS: one non-held-out production worker response, deterministic postprocessing and assembled app schema**, exit 0.

The analysis finish condition is the published go verdict and dataset handoff.
Next: build and independently review the dataset/manifest, then train and measure
quality, latency and schema compliance under the untouched evaluation protocol.
No UI, new training, export or held-out inference was performed for this decision.
