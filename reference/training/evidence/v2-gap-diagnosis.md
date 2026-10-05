# v2 literal-gap diagnosis — in progress

This is development diagnosis, not a gate result. No reserved input is opened
by the replay launcher. The production pin and release remain unchanged.

## Verified before replay

`node reference/training/audit-gap-supervision.mjs` reproduced 317 historical
training/selection rows, 123 non-empty gaps, 113 single-chunk gap rows, and only
10 rows with both a multi-chunk gloss and a gap. English-to-Korean has 2/110
non-empty targets. The corpus audit finds 200 sentence anchors / 48 patterns.

The retained v2 Q8_0 artifact is 4,610,579,744 bytes with SHA-256
`025935d6c8477d70946b0e97fddcac318ddbd04630a496bd011f488ef39020c5`.
The original native probe survives as `prompt_probe-49e843a3ac6cd401`, SHA-256
`98e7b0ef14e0ce1776556bc0250d46ceab495cadb2173d583aac6248c8fa368d`.
These match the recorded v2 run manifest. The current default probe has changed,
so using its pathname alone would not reproduce v2.

The first preflight correctly rejected the current prompt hash before inference.
The replay now binds the original embedded prompt, SHA-256
`81f525b2fb54ac5b1a16d3cfb7ba2fc28ed88db156156cff5fbddb9ff043e669`,
retrieved from the recorded training/export commit. It changes no product file.
The failed preflight's manifest and log are retained separately.

## Response-token audit

Run:

```sh
.local-models/compatibility/venv/bin/python reference/training/audit-v2-response-tokens.py
```

All 290 training/development rows fit within 747 tokens (limit 1,024). Every
literal-gap field token is supervised under the training script's label rule;
there is no truncation. Reproduced lengths match all 1,000 historical training
steps, and development response tokens match the recorded 4,714 total.
`v2-gap-replay/response-token-audit.json` contains per-row counts and limitations.
Transformers emitted its regex warning; the tokenizer was not modified. Matching
historical counts strengthen the reproduction but do not establish historical
per-token gradients or language capability.

## Replay and next action

```sh
python3 reference/training/replay-v2-gaps.py
python3 reference/training/summarize-gap-replay.py
```

Selection is exhaustive for non-empty v2 targets: 108 training and 10 development
rows. Inputs, expected targets, split labels and prompt are preserved under
`v2-gap-replay/`. The original worker runs offline, with its original decoding
settings. The launcher refuses overwrite. The summarizer requires successful
completion, verifies provenance and agreement between raw and parsed replies,
and counts field emission, exact target agreement and output gloss shape.
Those counts are diagnostic metrics, not independent language-quality scores.

**Outcome remains undecided until replay completes.** Some early training rows
emit gaps, so universal runtime field deletion is already contradicted. This
alone does not establish memorisation versus generalisation versus a shape or
direction confound. No dataset rebuild or training has begun.

Next owner: Duncan. Finish when the complete training/development cross-table
and reviewed outputs settle the diagnosis; stop if the memorisation branch
holds. Otherwise proceed to paired multi-chunk supervision and the bounded
training/development comparison. The sealed v3 gate remains excluded throughout.

Verification at this checkpoint: `npm run build` passed; `npm run
validate:content` passed 16/16 tests. These are repository checks, not a UI run.
