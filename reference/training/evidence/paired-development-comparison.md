# Paired supervision: development comparison declined

The corrected experiment produced **0/10 correct literal-gap explanations** on
the same ten preserved v2 development inputs. Independent review confirmed the preserved v2 baseline is **2/10**. It resolved
the broad paraphrase in item 285 as a failure: clearing the mind does not establish
releasing expectations or wanting. This is semantic scoring, not exact-text matching.

| Measure | Preserved v2 | Corrected paired selection |
| --- | ---: | ---: |
| Correct literal-gap explanation | 2/10 | 0/10 |
| Non-empty literal gap | 9/10 | 1/10 |
| Multi-chunk gloss (shape only) | 1/10 | 8/10 |
| Non-empty gap + multi-chunk gloss | 1/10 | 1/10 |
| Correct gap explanation + multi-chunk gloss | 1/10 | 0/10 |

Nine corrected replies have empty gaps. The sole non-empty explanation, on
`DAN-V2-CANDIDATE-289`, incorrectly explains 눈코 뜰 새 없다 as inability to sleep
and adds an unsupported anatomy disclaimer. Its project-owned intended reading
is being utterly swamped, with no time to breathe. More gloss chunks are a shape
change, not evidence of correct gloss meaning or improved explanations.

**Stop condition reached.** Neither required joint output nor explanation
correctness improved. No additional candidate, answer-driven retry, gate
inference or model pin follows this experiment. This is a bounded negative
result, not a claim that no possible training approach could ever work.

## Data and diagnostic deliverables

The diagnostic slice remains at `b58d710` with independent review: all 118
training/development replies verified, observed direction/gloss-shape signature,
and explicit causal limits. It did not prove the confound was the whole cause.
The approved dataset is unchanged from `176c46c`: 406 rows, including 160 aligned
multi-chunk/gap rows, 80 per direction (50% en-to-ko), zero single-chunk gap rows.
Its manifest includes the joint cross-table and the target approval is hash-bound.
Both permitted exclusion checks and strict target validation passed. No learner
records or outside translations were introduced.

## Corrected frozen protocol and selection

An initial recovery inherited a product prompt different from the incumbent v2
prompt. It is preserved under `paired-recovery/` and is excluded from selection.
The recorded scope decision authorized only corrected runs of the same two rates
with the original prompt in a separate workspace. The product prompt was not
changed. A hash guard now rejects drift before loading a model.

Correction source: `076ec573121d13bdc8d3b02e8f2c2540482a349d`. Training explicitly
used `evidence/v2-gap-replay/embedded-prompt.json`, SHA-256
`81f525b2fb54ac5b1a16d3cfb7ba2fc28ed88db156156cff5fbddb9ff043e669`, identical to
the preserved worker's embedded prompt. The original Qwen3.5-4B revision, seed,
LoRA settings, reviewed dataset and frozen 40-row development split were reused.
Each rate ran four epochs / 1,624 updates, with 25 warmup updates and cosine decay.
The maximum observed sequence was 882/1,024 tokens. Development never entered
the optimizer; every score used 4,714 response tokens.

| Peak rate | Epoch 1 | Epoch 2 | Epoch 3 | Epoch 4 | Selected epoch |
| --- | ---: | ---: | ---: | ---: | ---: |
| 0.0001 | 0.360212 | 0.381537 | 0.424836 | 0.446927 | 1 |
| 0.0002 | 0.365144 | 0.378817 | 0.399641 | 0.418658 | 1 |

Baseline development loss was 0.657474 for both. The predeclared loss-only rule
selected `paired-corrected-lr1`, epoch 1, before any new native answer was read.
Only that selection was exported. Training plus development evaluation took
298.660 and 292.724 seconds respectively, on the shared local RTX 5090 with the
retained locked environment; peak allocated GPU memory was 4,446,602,240 bytes
for each. Checkpoints preserve adapter, optimizer, RNG and selection history.
These losses and resource measurements are not language scores.

## Export and unchanged native runtime

The matched converter, all 1,865 retained vendored files and quantizer hash were
verified. The exported Q8 artifact is 4,610,579,744 bytes, SHA-256
`97b238dbfabc2bc0c19474fa0c501b16624e9e855f09ba400610950e4f363ce5`.
It is retained on both the GPU host and the runner in ignored local storage.
The native worker bytes match the baseline exactly:
`98e7b0ef14e0ce1776556bc0250d46ceab495cadb2173d583aac6248c8fa368d`.

The first native launch failed **before reading its fixture or loading a model**
because that worker embeds its original repository path. The error and manifest
are preserved in `paired-development-replay/startup-failure/`; no raw reply or
result file existed. A private user/mount/network namespace mapped only the
owned training workspace to the compiled path. The worker itself was unchanged,
the fixed fixture bytes were retained, and no model reply was repeated.

The completed worker run exited 0 in 141.168 seconds including warmup and
cancellation. All ten development replies passed strict model-owned schema,
unchanged postprocessing/assembled schema, exact direction, raw/parsed equality
and model/prompt/fixture/rubric provenance. Cancellation returned `cancelled` in
0 ms. Median development completion was 12264.5 ms;
these are observed CPU-runtime timings, not a controlled speed comparison.

The provenance manifest explicitly identifies the historical embedded prompt
path. The orchestration commit contains a different product prompt, which was
not used for this run; do not substitute that product file when checking hashes.

## Evidence and reproducible checks

- `paired-corrected-lr1/` and `paired-corrected-lr2/`: complete training records;
  `corrected-selection.json`: the fixed loss selection; selected directory also
  contains all export and merged-file hashes.
- `paired-development-replay/`: exact inputs, raw replies, parsed replies,
  runtime log/manifest, startup failure, and `contract-summary.json`.
- `paired-v2-development-review.json` and
  `paired-corrected-development-review.json`: per-row semantic judgments. The
  baseline is preserved in `v2-gap-replay/continuation/`; it was not re-inferred.
- `node reference/training/audit-gap-supervision.mjs reference/training/dataset-paired.json`
  reports 406/160 rows, 80 gap rows per direction, zero single-chunk gaps.
- `node --import tsx reference/training/validate-paired-development.mjs` passes
  all ten source/provenance/schema checks; reports 1 non-empty gap and 1 paired
  gap/multi-chunk reply. It also checks the original warmup/cancellation records.
- Three preflight regressions and two retained-environment recovery regressions
  passed. Build/typecheck and content validation (16/16), exact-commit CI and
  independent review are recorded in the task closeout.

## Limits and next action

All ten gap inputs are Korean-to-English and were already development data.
This provides no held-out or English-to-Korean language claim. The sealed v3 set
and its freeze document were not read into the operator context; only the
permitted checker subprocess read reservations. The v3 checksum manifest, rubric
and null production pin are unchanged. The shipped release remains AI-off.

Independent review on BAD-260, comment `f0349b48-d752-42c9-b29e-c834b2ff1a02`,
verified commit `c89dd46f83730053cb9ca8df0cf04510ffd8b3bb`: baseline 2/10,
corrected 0/10, fixed selection/provenance and the negative stop result. The
review confirmed the initial failure judgment for `DAN-V2-CANDIDATE-285`; both
initial reasoning and resolution are retained in the baseline review JSON.
The reviewed development result goes to the existing gate-decision issue. This
experiment supports no gate spend and authorizes no further candidate here.
