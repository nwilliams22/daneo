# v2 literal-gap diagnosis

This is development diagnosis, not a gate result. The replay launcher opens only its fixed training/development inputs. The
production pin and release remain unchanged. See the boundary incident below:
reserved descriptions were accidentally exposed through the freeze document.

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

## Completed result

All **118/118** source rows returned successful native results. The continuation
completed with exit 0 in 528.204 seconds. Raw JSON equals every parsed result;
model, prompt and per-segment input hashes match. The original interrupted
process is not falsely assigned a successful exit status.

| Split / direction / target gloss | Rows | Non-empty gap | Exact target text | Output multi-chunk | Gap + multi-chunk |
| --- | ---: | ---: | ---: | ---: | ---: |
| Training / en-to-ko / multi | 2 | 0 | 0 | 2 | 0 |
| Training / ko-to-en / multi | 7 | 6 | 1 | 6 | 5 |
| Training / ko-to-en / single | 99 | 95 | 16 | 4 | 2 |
| Development / ko-to-en / multi | 1 | 1 | 0 | 0 | 0 |
| Development / ko-to-en / single | 9 | 8 | 0 | 1 | 1 |
| **Training total** | **108** | **101** | **17** | **12** | **7** |
| **Development total** | **10** | **9** | **0** | **1** | **1** |

**The observed branch is the direction/gloss-shape confound (outcome 3), with
important limits on the causal claim.** Both English-to-Korean training gap
examples return empty while Korean-to-English emits gaps on 101/106 training
inputs and 9/10 development inputs. Output shape also tracks the defective
supervision: 95/99 training single-chunk targets retain a single-chunk output,
and 9/10 development replies are single-chunk. The paired output required by
the task remains scarce: 7/108 training replies and 1/10 development replies.

This is **not** the stipulated memorisation stop outcome: the model does not
emit gaps only on its own training inputs and go empty on development inputs.
Exact-string agreement (17/108 versus 0/10) alone cannot establish memorisation;
valid paraphrases differ too. It is also not universal pipeline field deletion:
110 raw replies contain non-empty gaps, and the token audit found the gap
positions supervised with no truncation. The two observed en-to-ko positives
are a small sample; no en-to-ko development positives exist in this fixture.

The replay does **not** prove that the construction confound is the whole cause
of every previously recorded failure or that rebuilding will fix them. Most
ko-to-en multi-chunk training inputs also emit gaps (6/7). There is no controlled
same-input intervention on gloss shape here. The evidence establishes a
learned direction/shape distribution and excludes two proposed blanket
explanations; causal isolation and language-quality improvement remain unproven.

### Reviewed examples: emission is not correctness

Against the project-owned expected targets:

- Training `DAN-V2-CANDIDATE-086` reproduces its complete gap target exactly
  and emits a multi-chunk gloss. The paired output is possible in this runtime.
- Training `DAN-V2-CANDIDATE-218` explains body aches as slenderness. Being an
  own-row input does not make the emitted explanation correct.
- Development `DAN-V2-CANDIDATE-281` paraphrases the dragon/small-stream proverb
  as great things from small beginnings: a non-empty, relevant mapping without
  an exact-string match. This is counterevidence to empty-on-fresh-inputs.
- Development `DAN-V2-CANDIDATE-283` misses the stood-up idiom, and `284` emits
  the unrelated “there's no place like home.” Both nevertheless count as
  non-empty. `287` also misses the care/work meaning and collapses its target's
  three gloss chunks into one. `286` emits an empty gap.

Thus the v2 development **field-emission baseline is 9/10 (90%)**, with exact
text agreement 0/10 and joint gap/multi-chunk emission 1/10. These are diagnostic
metrics, **not a 90% literal-gap language pass rate**. No retrained artifact or
retrained development score exists. No gate was inferred on or scored.

### Verification and next action

From the repository root, `python3 reference/training/summarize-gap-replay.py`
passes all provenance/coverage/raw-result assertions and reproduces the table.
`python3 -m unittest discover -s reference/training -p test_gap_replay_summary.py`
passes 5 tests. `npm run build` passes (including `npm run validate:content`,
16/16 checks). No UI claim applies to this headless diagnostic.

The diagnostic evidence is complete. Rebuilding/retraining remain unfinished
and await the scope decision described below; the original task is not complete.
The next permitted action is review of these fixed replay results and a decision
on safe operator context and exclusion checking, followed by paired supervision
only when that continuation is authorized. The production pin remains null.

## Interrupted replay recovery

The first process stopped without recording an exit code after 83 of 118 source
rows. Its raw and parsed files are preserved byte-for-byte. Run
`python3 reference/training/resume-v2-gap-replay.py` only for that interrupted
state: it verifies the original model and worker hashes, keeps the original
fixture, and runs a separate fixture containing the 35 remaining rows. It refuses
to overwrite a continuation. The continuation manifest records hashes of both
preserved files; all source inputs and targets are unchanged. The extra greeting
and cancellation probes are excluded from the diagnostic counts.

The summarizer verifies the two segments against their own fixture hashes and
requires disjoint, exhaustive coverage of the original 118 rows. Five regression
checks exercise successful merging and rejection of changed preserved evidence,
wrong provenance, duplicate replies and an unfinished continuation:

```sh
python3 -m unittest discover -s reference/training -p test_gap_replay_summary.py
```

## Boundary incident and continuation constraint

During this continuation, reading `reference/eval/v3-freeze.md` for the
reservation-exclusion rules also exposed that document's reserved item
descriptions to the operator context. The sealed JSON itself was not opened;
no reserved inference ran. The replay fixtures were fixed before this exposure,
and its continuation remains an unchanged subset of the original inputs. No
new supervision, model training or candidate selection followed the exposure.

The `v3-translation-set.sha256` file remains byte-identical to the recorded
manifest hash. **That proves unchanged bytes, not that reserved information
remained unseen.** No gate claim is made. Rebuilding and retraining require a
scope decision and a clean continuation context; the exposure cannot be undone
by omitting it from the report or merely starting another command.

The current `check-independent-freeze.py` also opens the sealed v3 JSON
internally. It has not been run in this continuation. The existing no-read rule
must be reconciled with mandatory exclusion checking before any future training
artifact is admitted. An opaque reservation-exclusion record supplied through
an authorized custodian is a possible solution; this report does not authorize
reading, replacing, or spending the gate.
