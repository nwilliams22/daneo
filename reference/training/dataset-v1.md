# Daneo training dataset v1

`build-dataset.mjs` generates `dataset-v1.json` and its manifest from the
shipped sentence and literal-gap corpus at commit
`6587c1f9ef471eb9e50b7059fd99ee745d4c2a64`. The generator checks both
source-file hashes, selects stable corpus IDs, joins aligned chunks, validates
every target against the strict model-owned part of
`translationResultSchema`, and records the output hash and counts. The
committed dataset is the versioned supervised source for the later training
slice. It contains only Daneo's project-owned curriculum; there is no learner
data, outside Korean text, copied model reply, or diagnostic correction. The
project's own content provenance and any distribution terms are inherited from
the repository; this note makes no new third-party licence claim.

The four `errorClass` labels come from `error-analysis.md`. They identify the
primary target, and classes can overlap in a sentence. Gloss rows teach Korean
order, aligned chunks and attached particles. Semantic-fidelity rows teach
actor, polarity, contrast, obligation and consequence. Register rows retain
the curriculum's polite 해요 style. Literal-gap rows use Korean inputs so the
ordinary English and literal structure are both explicit. The generator does
not supervise romanization or `particles[]`; the application assembles those
fields after the model reply.

## Review record

The manifest names nine sampled IDs and the linguistic point checked for each.
I also read the generated Korean, English, gloss and gap text for all 27 rows
against the pinned corpus. During that read, I removed a greeting whose
English gloss was context-dependent and a request whose English speech act did
not match its Korean. Their replacements are corpus-derived. This is a
construction review, not the separate independent review required before full
training. No target uses a reserved evaluation answer or a paraphrase of one.

## Held-out protocol

The 60 independent anchors were frozen before training in
`../eval/training-independent-set.json`; their byte hash and review live in
`../eval/training-independent-set.sha256` and
`../eval/training-independent-freeze.md`. The v0, v1, dev and v2 sets add 36
older reservations. Never train, tune a prompt, or construct a derived example
from any of these 96 anchors. The generator checks the pinned freeze hash and
the 96 IDs and normalized English/Korean strings. The separate checker is the
source of truth for the full reservation comparison; its text comparison does
not prove that a paraphrase is independent, so review any later augmentation.

Keep the independent set unopened for training choices. The v1 set is spent;
the v2 set remains frozen, with its existing hash and gate. After training,
compare the trained Q8 and prompted base with the same frozen inputs, prompt,
postprocessor, runtime and six-dimension rubric in `../eval/v0-rubric.md`.
Record raw replies and per-item verdicts, then run `../eval/check-provenance.py`
on each held-out run. Do not inspect results to retune and rerun the same set.
Score the final assembled response, including deterministic romanization and
particles. The ten-item acceptance threshold remains 10/10 schema and
direction, at least 9/10 fully correct, and zero meaning reversals or invented
rules. The independent 60 are an additional qualification set, not a source
for model selection; report their dimension counts separately. This slice
performs no training or held-out inference.

Regenerate and check from the repository root:

```sh
node --import tsx reference/training/build-dataset.mjs
python3 reference/eval/check-independent-freeze.py --candidates reference/training/dataset-v1.json
```
